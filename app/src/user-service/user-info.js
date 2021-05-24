const { getConfiguration } = require('../config')
const { handleMsg } = require('../myutils')
const myutils = require('../myutils')
const { createNode, reportStatus, lookupInDHT } = require('../myutils')
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { default: axios } = require('axios');
const FormData = require('form-data')
const express = require('express')
const pipe = require('it-pipe')

function parseArticles(data) {
    const fullset = data.news
    return fullset
}

function parseTwitterTimeline(html) {
    const $ = cheerio.load(html);
    let tweets = $('p.tweet-text')
    let timelines = []
    tweets.each((i, e) => {
        timelines.push($(e).text())
    })
    return timelines.join('\n')
}

async function getUserTimeline(browser, userid) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://google.com/bot.html)',
        'upgrade-insecure-requests': '1',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,en;q=0.8'
    })
    await page.goto('https://twitter.com/' + userid, {
        timeout: 30000,
        waitUntil: "networkidle2",
    });
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    return parseTwitterTimeline(data)
}

async function recommend(usertimeline, loc) {
    const body = new FormData();
    body.append('text', usertimeline)
    body.append('latitude', loc.latitude)
    body.append('longitude', loc.longitude)
    try {
        const res = await axios({
            method: "post",
            url: "http://35.170.150.51/predict",
            data: body,
            headers: { ...body.getHeaders() },
            proxy: false
        })
        return res.data
    } catch (e) {
        console.log(e.data)
        return {}
    }
}

async function getLocation(username) {
    try {
        const res = await axios.get('http://34.70.246.23?user=' + username, { proxy: false })
        const data = res.data
        const loc = data.message.split(',')
        const latitude = loc[0]
        const longitude = loc[1]
        return {
            latitude: latitude,
            longitude: longitude
        }
    } catch (e) {
        return {
            latitude: 40,
            longitude: -70,
        }
    }
}

async function logToBlockChain(node, username) {
    const providers = await lookupInDHT(node, 'blockchain', 5000)
    if (providers && providers.length > 0) {
        const p = providers[0]
        console.log(providers.length)
        const req = username
        let t = (new Date()).getTime()
        try {
            // console.log('Send heartbeat to ' + adminPortal)
            const { stream } = await node.dialProtocol(p.id, '/user/visit')
            await pipe(
                [req + '\r\n'],
                stream
            )
        } catch (e) {
            console.log(`In report status, error thrown ${e} \n`)
        }
        console.log('Blockchain req time cost: ' + (new Date().getTime() - t))
    }
}

const PORT = 9091;
const HOST = '0.0.0.0'; // open to the public world
// const HOST = 'localhost'; // open to the public world

var cors = require('cors');

async function main() {

    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0
    const config = await getConfiguration()

    const [node] = await Promise.all([
        createNode(config.bootstrapers, publicIp, publicPort)]
    )
    await node.contentRouting.provide(myutils.strToCid('user'))
    const selfAddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
    console.log('User node running at' + selfAddrs)

    await node.contentRouting.provide(myutils.strToCid('user'))

    const browser = await puppeteer.launch({ headless: true });
    console.log('Launch done')

    // status heartbeat
    await reportStatus('UserService', node)
    setInterval(async () => {
        await reportStatus('UserService', node)
    }, 20000)

    // node.handle('/user/recommend', handleMsg(async (msg) => {
    //     try {
    //         const userdata = await getUserTimeline(browser, userId)
    //         const loc = await getLocation(userId)
    //         const data = await recommend(userdata, loc)
    //         const articles = parseArticles(data)
    //         return JSON.stringify(articles)
    //     } catch (e) {
    //         console.log(e)
    //     }
    //     return False
    // }))

    // await browser.close();
    const app = express();
    app.use(cors())

    app.get('/:user', async (req, res) => {
        const user = req.params.user
        const userId = user;
        logToBlockChain(node, userId).then(()=>{
            console.log('blockchain logged!')
        }).catch(e => {
            console.log(e)
        });
        try {
            const userdata = await getUserTimeline(browser, userId)
            const loc = {longitude: '40.495791', latitude: '-74.254845'}
            const data = await recommend(userdata, loc)
            let articles = parseArticles(data)
            res.send(articles)
        } catch(e) {
            console.log(e)
            res.send('Something went wrong')
        }
    });

    app.listen(PORT, HOST);

    console.log(`Running on http://${HOST}:${PORT}`)
}

; (async () => {
    await main()
})();
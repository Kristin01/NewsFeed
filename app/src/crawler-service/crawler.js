const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const _ = require('lodash');
const axios = require('axios').default;
const fs = require('fs');
const pipe = require('it-pipe')
const { getConfiguration } = require('../config')
const myutils = require('../myutils')
const { False, True, reportStatus } = require('../myutils')
const { createNode, lookupInDHT } = require('../myutils');

let print = console.log;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function is_news_url(url) {
    const re = /\/\d+\/\d+\/\d+.*\/index\.html/
    return url.match(re) !== null
}

function parse_index_page(html) {
    const $ = cheerio.load(html);
    let article_links = $('article a')
    let link_list = []
    article_links.each((i, e) => {
        const link = $(e).attr('href')
        if (is_news_url(link)) {
            link_list.push(link)
        }
    })
    return link_list
}

async function scrape_index_page(browser, url) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://google.com/bot.html)',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,en;q=0.8'
    })
    await page.setDefaultNavigationTimeout(0)
    console.log('loading page')
    await page.goto(url, {
        waitUntil: 'load',
        timeout: 0
    });
    console.log('one page is done')
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    return parse_index_page(data)
}

function parse_article(html) {
    if (html === null || html === '') {
        return null
    }
    const $ = cheerio.load(html)
    let title = $('h1.pg-headline').text()
    let time = $('p.update-time').text()
    let body = $('article').text()
    return {
        title: title.replace('"', '\'').replace('\\', '\\\\'),
        date: time.replace('"', '\'').replace('\\', '\\\\'),
        body: body.replace('"', '\'').replace('\\', '\\\\')
    }
}

async function scrape_article(url) {
    let result = null
    if (url.startsWith('/')) {
        fullurl = 'http://us.cnn.com' + url
    } else {
        fullurl = url
    }
    try {
        const resp = await axios.get(fullurl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36',
            },
            proxy: false,
        })
        let article = parse_article(resp.data)
        if (!article || !article.body) {
            result = null
        } else {
            article.url = url
            result = article
            // fs.writeFileSync(`${__dirname}/news-sample/${encodeURIComponent(url)}.json`, JSON.stringify(article));
        }
    } catch (e) {
        console.log(`${url} has failed with ${e}`)
        result = null
    }
    return result
}

async function work(browser, index_pages, finishSet, node) {
    let result = []
    for (let page of index_pages) {
        let res = await scrape_index_page(browser, page)
        result.push(res)
        console.log('One index built')
    }

    result = _.flattenDeep(result)
    result = _.uniq(result)

    retry_count = new Map()
    console.log(result.length)

    console.log('All index built!')
    const providers = await lookupInDHT(node, 'database', 5000)
    if (providers && providers.length > 0) {
        const p = providers[0] // quickest
        console.log('Found provider! --> ' + p.id)
        console.log(result.length + ' pages to submit')
        while (!_.isEmpty(result)) {
            const page = result.pop()
            if (finishSet.has(page)) {
                continue;
            }
            const news = await scrape_article(page)
            await sleep(500)
            if (!news) {
                retry_count[page] = (retry_count[page] || 0) + 1
                if (retry_count[page] < 3) {
                    result.push(page)
                } else {
                    print(`${page} failed with retry 3`)
                }
            }
            let t = (new Date()).getTime()
            try {
                // console.log('Send heartbeat to ' + adminPortal)
                const { stream } = await node.dialProtocol(p.id, '/news/add')
                await pipe(
                    [JSON.stringify(news)+'\r\n'],
                    stream
                )
                finishSet.add(page)
            } catch (e) {
                console.log(`In report status, error thrown ${e} \n`)
            }
            console.log('Submit one doc, time cost: ' + (new Date().getTime() - t))
        }

    }
    print(result.size)
}

(async () => {

    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0

    const config = await getConfiguration()

    const [node] = await Promise.all([
        createNode(config.bootstrapers, publicIp, publicPort),
    ])

    const index_pages = [
        'https://us.cnn.com/politics',
        'https://us.cnn.com/world',
        'https://us.cnn.com/us',
        'https://us.cnn.com/health',
        'https://us.cnn.com/entertainment',
        'https://us.cnn.com/business/tech',
        'https://us.cnn.com/opinions',
    ]
    const browser = await puppeteer.launch();
    console.log('Browser Launched!')

    const finishSet = new Set()

    // status heartbeat
    await reportStatus('Crawler', node)
    setInterval(async () => {
        await reportStatus('Crawler', node)
    }, 20000)

    const interval = 60 * 60 * 1000 // one hour
    work(browser, index_pages, finishSet, node).then(() => {
        console.log('Crawling finished')
    })
    setInterval(async () => {
        work(browser, index_pages, finishSet, node).then(() => {
            console.log('Crawling finished')
        })
    }, interval)

})();
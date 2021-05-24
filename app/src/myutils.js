const CID = require('cids')
const multihashing = require('multihashing')
const all = require('it-all')
const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')
const KadDHT = require('libp2p-kad-dht')
const pipe = require('it-pipe')
const { map } = require('streaming-iterables')

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function strToBase64(str) {
    return Buffer.from(str).toString('base64')
}

function base64ToStr(str) {
    return Buffer.from(str, 'base64').toString('ascii')
}

async function createBootstrapNode(publicIp, port) {
    const node = await Libp2p.create({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/' + port],
            announce: publicIp ? [`/ip4/${publicIp}/tcp/${port}`] : [],
        },
        modules: {
            transport: [TCP],
            streamMuxer: [Mplex],
            connEncryption: [NOISE],
            pubsub: Gossipsub,
            peerDiscovery: [PubsubPeerDiscovery],
            dht: KadDHT,
        },
        config: {
            peerDiscovery: {
                [PubsubPeerDiscovery.tag]: {
                    interval: 1000,
                    enabled: true
                },
            },
            dht: {
                // dht must be enabled
                enabled: true
            },
            relay: {
                enabled: true, // Allows you to dial and accept relayed connections. Does not make you a relay.
                hop: {
                    enabled: true // Allows you to be a relay for other peers
                }
            }
        }
    })
    await node.start()
    return node
}

async function createNode(bootstrapers, publicIp, port) {
    const node = await Libp2p.create({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/' + port],
            announce: publicIp ? [`/ip4/${publicIp}/tcp/${port}`] : [],
        },
        modules: {
            transport: [TCP],
            streamMuxer: [Mplex],
            connEncryption: [NOISE],
            pubsub: Gossipsub,
            peerDiscovery: [Bootstrap, PubsubPeerDiscovery],
            dht: KadDHT,
        },
        config: {
            peerDiscovery: {
                [PubsubPeerDiscovery.tag]: {
                    interval: 1000,
                    enabled: true
                },
                [Bootstrap.tag]: {
                    enabled: true,
                    list: bootstrapers
                }
            },
            dht: {
                // dht must be enabled
                enabled: true
            }
        }
    })
    await node.start()
    return node
}

function handleMsg(msgFn) {
    return async ({ stream }) => {
        pipe(
            stream.source,
            map(msgFn),
            stream.sink
        )
    }
}

function strToCid(str) {
    const bytes = new TextEncoder('utf8').encode(str)
    const hash = multihashing(bytes, 'sha2-256')
    const cid = new CID(1, 'dag-pb', hash)
    return cid
}

async function lookupInDHT(node, str, timeout) {
    let providers = []
    try {
        providers = await all(node.contentRouting.findProviders(strToCid(str), { timeout: timeout }))
    } catch (e) {
        providers = []
    }
    return providers
}

async function requestService(node, service, method, msg) {
    const providers = await lookupInDHT(node, service, 5000)
    if (providers && providers.length) {
        console.log('Found provider:', providers[0].id.toB58String())
        let p = providers[0]
        if (p.id.toB58String() === node.peerId.toB58String()) {
            return
        }
        const { stream } = await node.dialProtocol(p.id, method)
        pipe(
            [JSON.stringify(msg)],
            stream,
            async function (source) {
                try {
                    const res = []
                    for await (const data of source) {
                        res.push(data.toString())
                    }
                    return res
                } catch (e) {
                    console.log(e)
                }
            }
        )
    }
    return []
}

function decodeBase64(str) {
    return Buffer.from(str, 'base64').toString()
}

function encodeBase64(str) {
    return Buffer.from(str).toString('base64')
}

async function reportStatus(serviceName, curNode) {
    const adminPortal = 'admin'
    const selfAddrs = curNode.multiaddrs.map(
        (m) => `${m.toString()}/p2p/${curNode.peerId.toB58String()}`
    )
    const curAddr = selfAddrs[0]
    const providers = await lookupInDHT(curNode, adminPortal, 5000)
    try {
        for (const p of providers) {
            if (p.id.toB58String() === curNode.peerId.toB58String()) {
                // you cannot dial self, or possible deadlock
                continue;
            }
            // console.log('Send heartbeat to ' + adminPortal)
            const { stream } = await curNode.dialProtocol(p.id, '/admin/report')
            pipe(
                [JSON.stringify({
                    address: curAddr,
                    service: serviceName,
                })],
                stream
            )
        }
    } catch (e) {
        console.log(`In report status, error thrown ${e} \n`)
    }
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
        console.log(e)
        return {}
    }
}

async function getLocation(username) {
    try {
        const res = await axios.get('http://18.214.239.235:80?user=' + username, { proxy: false })
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

function parseArticles(data) {
    const fullset = JSON.parse(data.news).body
    let articles = []
    for (let x in fullset) {
        if (articles.hasOwnProperty(x)) {
            articles.push(articles[x])
        }
    }
    return articles
}

const False = 'false'
const True = 'true'

module.exports = {
    decodeBase64, encodeBase64,
    strToBase64, sleep, base64ToStr,
    createNode, strToCid, lookupInDHT, handleMsg,
    reportStatus, createBootstrapNode, requestService,
    False, True
}
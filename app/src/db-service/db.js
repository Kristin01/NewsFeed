const pipe = require('it-pipe')
const { concat, tap, map } = require('streaming-iterables')
const { getConfiguration } = require('../config')
const { handleMsg } = require('../myutils')
const myutils = require('../myutils')
const { False, True, reportStatus } = require('../myutils')
const util = require('util')
const { isArray } = require('lodash')
const Firestore = require('@google-cloud/firestore');
const path = require('path')

async function persistDocuments(mongoAddr) {
    // basically bash scripting
    return true
}

async function main() {
    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0

    const config = await getConfiguration()

    const db = new Firestore({
        projectId: 'ccproj-gcp',
        keyFilename: path.resolve(__dirname, "../../ccproj-gcp.json"),
    });

    const [node] = await Promise.all([
        myutils.createNode(config.bootstrapers, publicIp, publicPort),
    ])

    await node.contentRouting.provide(myutils.strToCid('database'))

    node.handle('/test', handleMsg(async (msg) => {
        try {
            const docRef = db.collection('users').doc('alovelace');
            const success = await docRef.set({
                first: 'Ada',
                last: 'Lovelace',
                born: 1815,
                profession: 'programmer'
            });
            console.log(success)
            return success
        } catch (e) {
            console.log(e)
        }
        return False
    }))

    let newsBuffer = []
    node.handle('/news/add', handleMsg(async (msg) => {
        try {
            const msgStr = msg.toString()
            newsBuffer.push(msgStr)
            if (msgStr.endsWith('\r\n')) {
                const news = JSON.parse(newsBuffer.join('').slice(0, -2)) // security issue !
                const newsFields = ['url', 'body', 'date', 'title']
                newsBuffer = []
                if (newsFields.every(e => e in news)) {
                    // valid field
                    const newsUrl = news['url'] || 'us.cnn.com'
                    const body = news['body'] || 'Empty news body'
                    const date = news['date'] || '2021'
                    const title = news['title'] || 'CNN news'
                    // console.log(Buffer.from(newsUrl).toString('base64'))
                    const docRef = db.collection('news').doc(Buffer.from(newsUrl).toString('base64'));
                    const success = await docRef.set({
                        title: title,
                        url: newsUrl,
                        date: date,
                        body: body
                    });
                    return success
                }
            }

        } catch (e) {
            console.log(e)
            console.log('Err input ' + msg.toString())
        }
        return False
    }))

    // self addr
    const selfAddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)

    // status heartbeat
    await reportStatus('Database', node)
    setInterval(async () => {
        await reportStatus('Database', node)
    }, 20000)

    // persistency of db
    const persistencyInterval = 4 * 60 * 60 * 1000
    await persistDocuments(config.mongodbAddr, config.mongodbAddr)
    setInterval(async () => {
        await persistDocuments(config.mongodbAddr, config.mongodbAddr)
    }, persistencyInterval)

    node.on('peer:discovery', (peerId) => {
        console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    })

    console.log('DB node running at ' + selfAddrs)

}

; (async () => {
    await main()
})();
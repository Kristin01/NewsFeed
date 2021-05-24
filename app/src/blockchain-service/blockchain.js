const pipe = require('it-pipe')
const { concat, tap, map } = require('streaming-iterables')
const { getConfiguration } = require('../config')
const { handleMsg } = require('../myutils')
const myutils = require('../myutils')
const { False, True, reportStatus } = require('../myutils')
const redis = require('redis')
const util = require('util')
const { isArray } = require('lodash')
const { default: axios } = require('axios')

async function visit(uid, url) {
    const params = {
        username: uid,
        timestamp: new Date().getTime(),
    };
    const data = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data,
        url: url,
    };
    // basically bash scripting
    await axios(options)
}

async function main() {
    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0

    const config = await getConfiguration()
    // await visit('testuser123', config.blockchainAddr+'/updateactivity')

    const [node] = await Promise.all([
        myutils.createNode(config.bootstrapers, publicIp, publicPort)]
    )

    await node.contentRouting.provide(myutils.strToCid('blockchain'))

    // check if index is already fetched
    let visitBuf = []
    node.handle('/user/visit', handleMsg(async (msg) => {
        try {
            const msgStr = msg.toString()
            visitBuf.push(msgStr)
            if (msgStr.endsWith('\r\n')) {
                const uid = visitBuf.join('').slice(0, -2)
                visitBuf = []
                console.log(uid)
                await visit(uid, config.blockchainAddr+'/updateactivity')
            }
        } catch (e) {
            console.log(e)
        }
    }))

    // self addr
    const selfAddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)

    // status heartbeat
    await reportStatus('Blockchain', node)
    setInterval(async () => {
        await reportStatus('Blockchain', node)
    }, 20000)

    node.on('peer:discovery', (peerId) => {
        console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    })

    console.log('Blockchain node running at ' + selfAddrs)
}

; (async () => {
    await main()
})();
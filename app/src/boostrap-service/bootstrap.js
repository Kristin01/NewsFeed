const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')

// create a bootstrap publish node
const express = require('express');
const myutils = require('../myutils')
const { handleMsg, True, False, reportStatus, strToCid } = require('../myutils')

// Constants
const PORT = 80;
const HOST = '0.0.0.0'; // open to the public world

// const PUBLIC_IP = '54.146.96.152' // this is crucial
const LOCAL_IP = '127.0.0.1';

; (async () => {
    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 8888

    if (!publicIp) {
        throw 'Bootstraper ip cannot be empty'
    }

    const [node] = await Promise.all([
        myutils.createBootstrapNode(publicIp, publicPort),
    ])

    // const node = await createRelayServer({
    //     listenAddresses: [`/ip4/0.0.0.0/tcp/8888`],
    //     announceAddresses: [`/ip4/${publicIp}/tcp/${publicPort}`]
    // })
    node.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))

    console.log(`libp2p relay starting with id: ${node.peerId.toB58String()}`)
    // await node.start()
    const relayMultiaddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
    console.log(relayMultiaddrs)

    const statusMap = new Map()
    statusMap.set('Boostrap', new Set([relayMultiaddrs[0]]))
    node.handle('/admin/report', handleMsg(async (msg) => {
        try {
            const status = JSON.parse(msg.toString())
            if (status.service && status.address) {
                if (!statusMap.has(status.service)) {
                    statusMap.set(status.service, new Set())
                }
                statusMap.get(status.service).add(status.address)
            }
        } catch (e) {
            console.log(e)
        }
    }))

    // status heartbeat
    await node.contentRouting.provide(myutils.strToCid('admin'))
    await reportStatus('Bootstrap', node)
    setInterval(async () => {
        await reportStatus('Bootstrap', node) 
    }, 20000)

    // const publicAddr = relayMultiaddrs.find(x => x.includes(LOCAL_IP)).replace(LOCAL_IP, publicIp)

    // App
    const app = express();

    app.get('/', (req, res) => {
        res.send('hello there!');
    });

    app.get('/bootstrapers', (req, res) => {
        res.send(`${relayMultiaddrs}\n`);
    });

    app.get('/admin', (req, res) => {
        const output = Array.from(statusMap).map(([key, value]) => {
            const addresses = Array.from(value).join('\n\t')
            return `
            ${key}\n <br>
            ${addresses} <br>
            `
        })
        res.send(`<div><p>${output}</p></div>`)
    });

    app.listen(PORT, HOST);

    console.log(`Running on http://${HOST}:${PORT}`);
})();
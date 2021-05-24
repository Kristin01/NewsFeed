const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')
const KadDHT = require('libp2p-kad-dht')
const pipe = require('it-pipe')
const { concat, tap, map } = require('streaming-iterables')
const process = require('process')

const { getConfiguration } = require('./config')
const { strToCid, handleMsg, createNode } = require('./myutils')

;(async () => {
    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0

    console.log(argv)

    const config = await getConfiguration()

    const [node] = await Promise.all([
        createNode(config.bootstrapers, publicIp, publicPort),
    ])

    node.on('peer:discovery', (peerId) => {
        console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    })

    setInterval(async () => {
        const peers = [...node.peerStore.peers.values()].map(p => p.id.toB58String())
        console.log(`${node.peerId.toB58String()} has peers: ${peers.join('   ')}`)
    }, 5000)

    await node.contentRouting.provide(strToCid('hello'))

    node.handle('/test/print', handleMsg((msg) => {
        console.log(msg.toString())
        return 'fuck'
    }))

    const selfAddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
    console.log('DB node running at ' + selfAddrs)

})();
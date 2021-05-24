const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WebSocket = require('libp2p-websockets')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')
const KadDHT = require('libp2p-kad-dht')
const delay = require('delay')
const all = require('it-all')
const { strToCid, lookupInDHT } = require('./myutils')
const { getConfiguration } = require('./config')
const pipe = require('it-pipe')
const concat = require('it-concat')
const myutils = require('./myutils')
const { createNode } = require('./myutils');

; (async () => {
    const argv = process.argv.slice(2)
    const publicIp = argv[0]
    const publicPort = argv[1] || 0

    const config = await getConfiguration()

    const [node] = await Promise.all([
        createNode(config.bootstrapers, publicIp, publicPort),
    ])

    let temp = []
    node.on('peer:discovery', (peerId) => {
        console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    })

    // setInterval(async () => {
    //     const peers = [...node.peerStore.peers.values()].map(p => p.id.toB58String())
    //     temp = [...node.peerStore.peers.values()]
    //     console.log(`${node.peerId.toB58String()} has peers: ${peers.join('   ')}`)
    // }, 5000)

    // await myutils.sleep(5000)

    let flag = true

    const news = {
        title: 'Sample news',
        url: 'https://us.cnn.com/2021/05/21/us/ronald-greene-autopsy/index.html',
        body: `(CNN)An autopsy report from the night Ronald Greene died in 2019 did not assign a manner of death and noted missing information from police.

        Greene died after a police chase on May 10, 2019, and his death has been the subject of a two-year investigation by the Louisiana State Police.
        The autopsy said the 49-year-old Black man died due to "cocaine induced agitated delirium complicated by motor vehicle collision, physical struggle, inflicted head injury, and restraint," according to the report, obtained from a source with knowledge of the investigation.
        Louisiana State Police release videos from 2019 in-custody death of Ronald Greene
        Louisiana State Police release videos from 2019 in-custody death of Ronald Greene
        The report states in its opinion that lacerations on Greene's head were "inconsistent with motor vehicle collision injury. These injuries are most consistent with multiple impact sites from a blunt object."
        The autopsy does not list a manner of death (accidental, homicide, natural causes, suicide or undetermined).
        The report was prepared by the Union Parish Coroner's Office and obtained by CNN from a source with knowledge of the investigation.
        The report notes that "no written incident report was provided despite requests," and that "no detailed information regarding the motor vehicle collision (air bag deployment, vehicle damage, seat belt usage, etc.) was provided."
        It also notes that "no emergency services medical records were provided" to the coroner's office.
        A sternal fracture and cuts on Greene's aorta and liver were noted in the autopsy report.
        "Whether this injury is due to trauma from the motor vehicle collision, subsequent struggle, or is resuscitative in nature cannot be stated with certainty. These findings can be associated with motor vehicle collision, but may also be seen in other circumstances, including inflicted injury during a struggle and/or related to resuscitative efforts (CPR)," the report said.
        CNN has reached out to the coroner's office for comment on the report.
        Greene's family has said that police initially told them he died on impact when his car crashed on May 10, 2019, after a police pursuit.
        Video obtained by The Associated Press and released this week shows Greene face down on the road after the crash outside the city of Monroe, being tased and kicked by Louisiana State Police officers as he tells them he is scared.
        An initial crash report from state police did not mention there was a struggle between Greene and the officers.
        Greene died on his way to a hospital, according to the state police's Criminal Investigations Division.
        There were significant levels of cocaine and alcohol in Greene's blood, the report says.
        Here&#39;s what we know about Ronald Greene&#39;s death in Louisiana 
        Here's what we know about Ronald Greene's death in Louisiana
        The blood levels of cocaine in Greene's system indicate recent use, one expert said.
        "It's uncommon to find cocaine in the bloodstream after a motor vehicle crash. It's rare," said Dr. Edward Boyer, an associate professor of emergency medicine at Brigham and Women's Hospital in Boston.
        "Cocaine induced agitated delirium" is a rare condition, according to researchers, and one of the conditions of "excited delirium," a controversial diagnosis that is not recognized by major medical organizations like the American Medical Association, the American Psychiatric Association or the World Health Organization. It is, however, recognized by smaller organizations that deal with emergency medicine, such as the American College of Emergency Physicians.
        Cyril Wecht, a forensic pathologist and attorney, said it is rare for cocaine to be included in the cause of death like in Greene's autopsy report.
        "I do more than 600 autopsies a year. I've done 21,000 in my career, I reviewed, supervised about 41,000 others," he told CNN. "I have never seen a case of excited delirium, signed out that way by anybody, certainly not by me, in any situation other than where it has involved police."
        `,
        date: 'Fri May 21, 2021',
    }

    let count = 1
    setInterval(async () => {
        const providers = await lookupInDHT(node, 'blockchain', 5000)
        if (providers && providers.length > 0 && flag) {
            const p = providers[0]
            flag = true
            console.log(providers.length)
            const req = 'testuser123'
            let t = (new Date()).getTime()
            try {
                // console.log('Send heartbeat to ' + adminPortal)
                const { stream } = await node.dialProtocol(p.id, '/user/visit')
                await pipe(
                    [req+'\r\n'],
                    stream
                )
            } catch (e) {
                console.log(`In report status, error thrown ${e} \n`)
            }
            console.log(new Date().getTime() - t)
        }
    }, 3000)


    const selfAddrs = node.multiaddrs.map((m) => `${m.toString()}/p2p/${node.peerId.toB58String()}`)
    console.log('DB node running at ' + selfAddrs)

})();
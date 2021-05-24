const axios = require('axios')

let __config = {
        bootPublisher: 'http://ccproj.heliumyc.top/bootstrapers',
        bootstrapers: [],
        mongodbAddr: '172.31.195.99', // only private network
        mongodbPort: 27017,
        redisAddr: '172.31.195.99', // only private network
        redisPort: 6379,
        blockchainAddr: 'http://54.145.239.38:3000',
        mongodbUri: '',
        ready: false
}

async function init() {
    let config = __config
    async function loadBootstrapers() {
        const resp = await axios.get(config.bootPublisher, {proxy: false})
        const addrs = String(resp.data).split('\n').filter(x => x.length)
        config.bootstrapers = config.bootstrapers.concat(addrs)
    }

    config.mongodbUri = `mongodb://${config.mongodbAddr}:${config.mongodbPort}/`
    await loadBootstrapers()
    config.ready = true
    return config
}

async function getConfiguration() {
    if (!__config.ready) {
        await init()
    }
    return __config
}

module.exports = {getConfiguration}

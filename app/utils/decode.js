const fs = require('fs')
const path = require('path')

const s = fs.readFileSync(path.resolve(__dirname, "../ccproj-gcp.encode"))
let ori = Buffer.from(s.toString(), 'base64').reverse()
ori = ori.toString()

fs.writeFileSync(path.resolve(__dirname, "../ccproj-gcp.json"), ori)

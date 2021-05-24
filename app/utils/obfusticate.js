const fs = require('fs')
const path = require('path')

const s = fs.readFileSync(path.resolve(__dirname, "../ccproj-gcp.json"))
const encodedStr = Buffer.from(s).reverse().toString('base64')
// encodedStr = encodedStr.reverse()

fs.writeFileSync(path.resolve(__dirname, "../ccproj-gcp.encode"), encodedStr)

const fs = require('fs')
const path = require('path')

if ( process.argv.length !== 3 ){
    throw new Error("Usage: deploy_source.js <path>")
}

const deployPath = path.resolve(process.argv[2])
const sourcePath = path.resolve(__dirname + '/../src')

async function run(){
    await fs.promises.copyFile(sourcePath + '/scanner.c', deployPath + '/scanner.c')
    await fs.promises.copyFile(sourcePath + '/parser.c', deployPath + '/elementsparserinternal.c')
    await fs.promises.copyFile(sourcePath + '/grammar.json', deployPath + '/grammar.json')
    await fs.promises.copyFile(sourcePath + '/node-types.json', deployPath + '/node-types.json')
    await fs.promises.copyFile(sourcePath + '/tree_sitter/parser.h', deployPath + '/tree_sitter/parser.h')
    console.log("Done")
}

run()

#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const argv = require('yargs')
    .alias('f', 'file')
    .alias('e', 'file-extension')
    .alias('s', 'chunk-size')
    .alias('d', 'output-dir')
    .argv;

let {
    file: filePath,
    'file-extension': fileExtension,
    'chunk-size': chunkSize,
    'output-dir': outputDir,
} = argv;

outputDir = typeof(outputDir) === 'string' ? path.resolve(outputDir) : path.resolve('output');

const fileExtensionRegExp = /^\.?([0-9a-z]{1,12})$/i;
const fileExtensionMatch = fileExtensionRegExp.exec(fileExtension);
fileExtension = (!!fileExtension && fileExtensionMatch !== null) ? fileExtensionMatch[1] : 'chunk';

const hash = crypto.createHash('sha1');
const chunks = [];

const readableStream = fs.createReadStream(path.resolve(filePath), { highWaterMark: (chunkSize || 128) * 1024 });

readableStream.on('readable', () => {
    let chunk;
    while ((chunk = readableStream.read()) !== null) {
        hash.update(chunk, 'utf8');
        chunks.push(chunk);
    }
});

readableStream.on('close', () => {
    const hashString = hash.digest('hex');
    ensureOutputDirExist(path.join(outputDir, hashString) + '/');
    chunks.forEach((buffer, i) => {
        fs.writeFileSync(path.join(outputDir, hashString, `${i}.${fileExtension}`), buffer);
    });
});

function ensureOutputDirExist(dir) {
    if (fs.existsSync(dir)) {
        return;
    }
    try {
        fs.mkdirSync(dir);
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            ensureOutputDirExist(path.dirname(dir));
            ensureOutputDirExist(dir);
        }
    }
}

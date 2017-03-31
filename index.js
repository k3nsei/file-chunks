#!/usr/bin/env node

const argv = require('yargs').alias('f', 'file').alias('s', 'chunk-size').argv;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { file: filePath, 'chunk-size': chunkSize } = argv;

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
    chunks.forEach((buffer, i) => {
        fs.writeFileSync(path.resolve(`./output/${hashString}.${i}.xyz`), buffer);
    });
});

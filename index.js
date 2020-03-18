#!/usr/bin/env node

const Express = require('express');
const yargs = require('yargs');
const mockUtils = require('./utils');
const path = require('path');

const app = Express();
const argv = yargs.argv;

// const config = {
//     apiPrefix: '',
//     microService: {
//         '/service1': '',
//         '/service2': ''
//     },
//     useDirPrefix: true,
//     usePathPrefix: true
// };

let { mock, port=3000, apiPrefix='', useDirPrefix=false, usePathPrefix=false } = argv;

if (!mock) {
    throw Error('请指定正确的mock目录！');
}
if (!path.isAbsolute(mock)) {
    mock = path.resolve(process.cwd(), mock);
}

mockUtils(mock, app, { useDirPrefix, usePathPrefix, apiPrefix });

app.listen(port, () => {
    const msg = `Mock: service started on port ${port} successfully ✔`;
    console.log('-'.repeat(msg.length + 2));
    console.log(msg);
    console.log('-'.repeat(msg.length + 2));
});
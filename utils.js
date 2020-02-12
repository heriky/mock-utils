const fs = require('fs');
const path = require('path');

const ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];
const PATTERN_SIGN = '__parttern__';
const PATTERN_KEYS = ['url', 'method', 'response'];

function walkDir(dir) {

    let result = [];
    let files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.resolve(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            result.push(...walkDir(filePath));
        } else {
            result.push(filePath);
        }
    });
    return result;
}

// 分离，服务名，文件名
function genService(dir, root) {
    let normalizedPath = dir.replace(root, '').split(path.sep).join('/');
    const dirService = path.dirname(normalizedPath); // 以目录的路径为微服务路径
    const pathService = normalizedPath.replace(path.extname(dir), ''); // 以文件全路径为服务路径
    return { dirService, pathService }
}

function makeIterator(plainObj) {

    function *gen() {
        for(let key in plainObj) {
            yield plainObj[key];
        }
    }
    return Object.assign({}, {
        [Symbol.iterator]: () => gen()
    });
}
let c = 1;
// 解析数据, 接受普通函数和Map对象
function register(data, app, prefix = '') {

    Object.entries(data).forEach(([key, value]) => {
        // 1. '/a/b/c': {}
        // 2. '/a/b/c': { get: {}, post: {}, delete: {} }
        // 3. 鉴定特殊 __parttern__: { url, method, response }
        const url = (prefix + key).replace('//', '/');

        if (key === PATTERN_SIGN && Object.keys(value).every(key => PATTERN_KEYS.includes(key))) {
            const { url: _url, method, response } = value;
            app[method](_url, (req, res) => {
                const resData = typeof response === 'function' ? response(req, res) : response;
                res.send(resData);
            });
            return;
        }

        if (Object.prototype.toString.apply(value) === '[object Object]' && Object.keys(value).every(key => ALLOWED_METHODS.includes(key.toUpperCase()))) {
            Object.entries(value).forEach(([method, rawData]) => {
                app[method](url, (req, res, next) => {
                    const _data = typeof rawData === 'function' ? rawData(req, res, next) : rawData;
                    _data && res.send(_data);
                });
            });
            return;
        }

        app.get(url, (req, res) => res.send(value));
    });

}

module.exports = function mockUtils(root, app, config = { useDirPrefix: false, usePathPrefix: false, apiPrefix: '' }) {
    const _root = path.resolve(root);
    const files = walkDir(_root);
    files.forEach(file => {
        const data = require(file);
        const { pathService, dirService } = genService(file, _root);
        let prefix = config.apiPrefix || '';
        if (config.useDirPrefix) prefix = prefix + dirService;
        else if (config.usePathPrefix) prefix = prefix + pathService;
        register(data, app, prefix);
    });
}
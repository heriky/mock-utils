const fs = require('fs');
const path = require('path');
const url = require('url');

const ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];
const PATTERN_SIGN = '__parttern__';
const PATTERN_KEYS = ['url', 'method', 'response'];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return [];

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
function register(data, app, prefix = '', headers) {

    Object.entries(data).forEach(([key, value]) => {
        // 1. '/a/b/c': {}
        // 2. '/a/b/c': { get: {}, post: {}, delete: {} }
        // 3. 鉴定特殊 __parttern__: { url, method, response }
        const url = (prefix + key).replace('//', '/');

        if (key === PATTERN_SIGN && Object.keys(value).every(key => PATTERN_KEYS.includes(key))) {
            const { url: _url, method, response } = value;
            app[method](_url, (req, res) => {
                const resData = typeof response === 'function' ? response(req, res) : response;
                for(let key in headers) {
                    res.setHeader(key, headers[key]);
                }
                res.send(resData);
            });
            return;
        }

        if (Object.prototype.toString.apply(value) === '[object Object]' && Object.keys(value).every(key => ALLOWED_METHODS.includes(key.toUpperCase()))) {
            Object.entries(value).forEach(([method, rawData]) => {
                app[method](url, (req, res, next) => {
                    const _data = typeof rawData === 'function' ? rawData(req, res, next) : rawData;
                    for(let key in headers) {
                        res.setHeader(key, headers[key]);
                    }
                    _data && res.send(_data);
                });
            });
            return;
        }

        app.get(url, (req, res, next) => {
            for(let key in headers) {
                res.setHeader(key, headers[key]);
            }
            typeof value === 'function' ? value(req, res, next) : res.send(value)
        })
    });

}

// const config = {
//     apiPrefix: '',
//     microService: {
//         '/service1': '',
//         '/service2': ''
//     },
//     useDirPrefix: true,
//     usePathPrefix: true
// };

module.exports = function mockUtils(root, app, config = { useDirPrefix: false, usePathPrefix: false, apiPrefix: '', microService: {}, headers: {} }) {
    // 如果传入的是相对路径，则必然是运行在文件中，使用__dirname
    const _root = path.isAbsolute(root) ? root : path.resolve(__dirname, root);

    if (Object.keys(config.microService || {}).length === 0) {
        loadDir(_root, app, config)
    } else {
        loadMicroService(_root, app, config)
    }
}

function loadMicroService(_root, app, config) {
    const { apiPrefix='', microService, headers } = config;
    Object.entries(microService).forEach(([serviceName, dir]) => {
        const prefix = url.resolve(apiPrefix, serviceName);
        const _path = path.isAbsolute(dir) ? dir : path.resolve(_root, dir);
        const files = walkDir(_path);
        files.forEach(file => {
            const data = require(file);
            register(data, app, prefix, headers);
        });
    });
}

function loadDir(_root, app, config) {
    const files = walkDir(_root);
    files.forEach(file => {
        const data = require(file);
        const { pathService, dirService } = genService(file, _root);
        let prefix = config.apiPrefix || '';
        let headers = config.headers;
        if (config.useDirPrefix) prefix = prefix + dirService;
        else if (config.usePathPrefix) prefix = prefix + pathService;
        register(data, app, prefix, headers);
    });
}
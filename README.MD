### Quick start

`npm install mock-utils -g`
`mock-server --mock ./mock --port 8000`

### 作为命令行

+ `--mock` the root dirname of mock data
+ `--port` mock server runing on some port
+ `--apiPrefix` prefix of api
+ `--useDirPrefix` use the dirname as service name
+ `--usePathPrefix` use the basename as service name


### 作为工具函数使用
`通常可以配合devServer使用, 其中传入的参数app，是一个express的实例`
```javascript
    const mockUtils = require('mock-server/utils');

    devServer : {
        before: app => mockUtils('./mock', app, { 
            apiPrefix: '',
            microService: {
                // 前缀为/serviceName1的mock数据会在./mock/abcd目录下面搜索
                // 前缀为/serviceName2的mock数据会在./mock/abcdefg目录下面搜索
                '/serviceName1': 'abcd',
                '/serviceName2': 'abcdefg'
            }
        })
    }
```

### mock数据的配置方式
相关目录下可以新建`.js`或者`.json`文件配置mock数据，如下：

```javascript

// data.js
module.exports = {
    // 默认get请求返回的数据
    '/card/:id': { name: 'abc', age: 10 },
    '/card/:id/detail': [1, 2, 3],
    '/card/:id/text': '饭香不香',
    '/card/list': function(res, req) {
        const query = req.query;
        return { message: '香不香都得吃' }
    },

    // 配置不同的请求方式
    '/card/list/multi': {
        get: {},
        post: {},
        delete: {},
        put: {},
        patch: {}
    },

    // 路径如果是正则匹配，可以使用特殊的形式
    {
        url: /test/\d+/,
        method: 'PUT',
        response: '响应的啊啊啊啊啊'，
        // 或者response(req, res) {  return '啊啊啊' } 
    }

};

```


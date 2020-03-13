### Quick start

`npm install mock-utils -g`
`mock-server --mock ./mock --port 8000`

### 详细配置

+ `--mock` the root dirname of mock data
+ `--port` mock server runing on some port
+ `--apiPrefix` prefix of api
+ `--useDirPrefix` use the dirname as service name
+ `--usePathPrefix` use the basename as service name


### 作为函数使用
`通常可以配合devServer使用, 其中传入的参数app，是一个express的实例`
```javascript
    const mockUtils = require('mock-server/utils');

    devServer : {
        before: app => mockUtils('./mock', app, { useDirPrefix: true })
    }
```


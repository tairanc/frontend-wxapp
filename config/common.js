
const path = require('path')
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());

const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

// 辅助函数
const utils = require('./utils');
function resolve(dir) {
    return path.join(__dirname, '..', dir)
}
const fullPath  = utils.fullPath;
// 项目根路径
const ROOT_PATH = fullPath('../');

module.exports = {
    ROOT_PATH: ROOT_PATH,
    SRC_PATH: `${ROOT_PATH}/src`,  //项目源码路径
    DIST_PATH: `${ROOT_PATH}/dist`, // 产出路径
    LOCAL_SERVER_PATH:`${ROOT_PATH}/dist`,
    NODE_MODULES_PATH: `${ROOT_PATH}/node_modules`,
    CACHE_PATH: `${ROOT_PATH}/cache`,
    publicPath: '/',
    imgPath: resolve('src/img'),
    copyImg: false,
    imgCopyPath: 'src/img',
    host: utils.getIP(),
    port: '3060',
    LOCAL_SERVER_PORT: '8006',
    dev: {
        publicPath: '/',
    },
    server: {
        publicPath: '/',
    }
}
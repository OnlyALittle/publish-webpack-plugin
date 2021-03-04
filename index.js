const url = require('url');
const path = require('path')
const OSS = require('ali-oss');
const u = require('underscore');
const ConfigFileLoader = require('config-file-loader');
const aliyunConfig = new ConfigFileLoader.Loader().get('aliyun');
const pluginName = 'PublishWebpackPlugin';

// 默认配置参数
let DEFAULT_OPTIONS = {
    ak: '',
    sk: '',
    bucket: '',
    region: '',
	retry: 3,
	publicPath: '/',
    // 多账号支持
    account: null,
    exclude: function (file) {
        return true;
    }
};

class PublishPlugin {

    constructor(options) {
		this.options = Object.assign(DEFAULT_OPTIONS, options);
		this.connect();
	}
	
	connect() {
		let conf = this.options.account ? aliyunConfig[this.options.account] : aliyunConfig;
		this.client = new OSS({
			region: this.options.region || conf.region,
			accessKeyId: this.options.ak || conf.ak,
			accessKeySecret: this.options.sk || conf.sk
		});
		this.client.useBucket(this.options.bucket);
	}
	//文件上传至OSS
	putFile(resource, times = this.options.retry) {
		const {file, source} = resource;
        let target = path.join(this.options.publicPath, file)
		let key = url.parse(target).pathname;

		let body = Buffer.isBuffer(source) ? source : new Buffer(source, 'utf8');
		return this.client.put(key, body, {
			timeout: 30 * 1000
		}).then(() => {
			return key;
		}, (e) => {
			if (times === 0 || e.code === 'AccessDenied') {
				throw new Error(e);
			}else {
				console.log('[PublishResourcePlugin retry]：', e, times, key);
				return this.putFile(resource, --times);
			}
		});
	}
	
	recurse(resources, callback) {
		let resource = resources.pop();
		return this.putFile(resource, this.options.retry).then(function (key) {
			console.log('[PublishResourcePlugin SUCCESS]：', key);
			if (resources.length > 0) {
				return this.recurse(resources);
			}
		}).catch(function (e) {
			callback(e);
			return resource.file;
		});
	}

    apply(compiler) {
		compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
			let files = u.filter(u.keys(compilation.assets), this.options.exclude);
	
			if (files.length === 0) {
				return callback();
			}

			const resources = files.map(item => {
				return {
					file: item,
					source: compilation.assets[item].source()
				}
			})

			this.recurse(resources, callback).then((res) => {
				if(!res) {
					console.log('[WebpackAliyunOssPlugin FINISHED]', 'All Completed');
					callback();
				} else {
					console.log('[WebpackAliyunOssPlugin FAILED]', res);
				}
			})
		})
	}
}
// 导出插件 
module.exports = PublishPlugin;
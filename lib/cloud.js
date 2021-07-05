const {TuyaContext} = require('@tuya/tuya-connector-nodejs');
const {regionToUrl} = require('./helpers');

const list = async options => {
	const api = new TuyaContext({
		baseUrl: regionToUrl(options.region),
		accessKey: options.apiKey,
		secretKey: options.apiSecret
	});

	const result = await api.request({
		method: 'GET',
		path: '/v1.0/devices',
		query: {
			page_no: 0,
			page_size: 1000,
			schema: options.schema
		}
	});

	if (!result.success) {
		throw new Error(`${result.code}: ${result.msg}`);
	}

	const {devices} = result.result;

	if (options.stringify) {
		console.log(JSON.stringify(devices));
	} else {
		console.log(devices);
	}
};

module.exports = {list};

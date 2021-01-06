const OpenAPI = require('@tuyapi/openapi');

const list = async options => {
	const api = new OpenAPI({key: options.apiKey, secret: options.apiSecret, schema: options.schema, region: options.region});

	await api.getToken();

	const {devices} = await api.getDevices();

	if (options.stringify) {
		console.log(JSON.stringify(devices));
	} else {
		console.log(devices);
	}
};

module.exports = {list};

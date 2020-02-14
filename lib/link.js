const ora = require('ora');
const TuyaLink = require('@tuyapi/link').wizard;
const API = require('@tuyapi/openapi');
const c = require('./common');

async function link(config, options) {
	// Check arguments
	if (!options.ssid || !options.password || !options.schema) {
		c.badArgument(options);
	}

	if ((!options.apiKey && !config.get('apiKey')) || (!options.apiSecret && !config.get('apiSecret'))) {
		c.badArgument(options);
	}

	// Save API parameters
	if (options.saveAPI) {
		config.set('apiKey', options.apiKey);
		config.set('apiSecret', options.apiSecret);
	}

	// Set API parameters
	if (!options.apiKey) {
		options.apiKey = config.get('apiKey');
	}

	if (!options.apiSecret) {
		options.apiSecret = config.get('apiSecret');
	}

	// Start linking process
	const link = new TuyaLink({
		apiKey: options.apiKey,
		apiSecret: options.apiSecret,
		email: 'johndoe@example.com',
		password: 'examplepassword',
		schema: options.schema,
		region: options.region,
		timezone: options.timezone
	});

	const spinner = ora('Registering devices(s)...').start();

	try {
		await link.init();

		const devices = await link.linkDevice({ssid: options.ssid, wifiPassword: options.password, devices: options.num});

		spinner.succeed('Device(s) registered!');

		// Get device details
		const api = new API({key: options.apiKey, secret: options.apiSecret, schema: options.schema});

		await api.getToken();

		const deviceDetails = (await api.getDevices(devices.map(d => d.id))).devices;

		// Save devices to config
		if (options.save) {
			for (const device of deviceDetails) {
				config.set(device.id, device.local_key);
			}
		}

		const prettyDevices = deviceDetails.map(d => ({
			id: d.id,
			ip: d.ip,
			localKey: d.local_key,
			name: d.name
		}));

		return console.log(prettyDevices);
	} catch (error) {
		spinner.fail('Device(s) failed to be registered!');
		console.log(error);
	}
}

module.exports = link;

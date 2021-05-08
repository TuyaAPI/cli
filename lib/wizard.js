const OpenAPI = require('@tuyapi/openapi');
const inquirer = require('inquirer');
const colors = require('colors');
const any = require('promise.any');
const AggregateError = require('es-aggregate-error/polyfill')();

const REGIONS = ['eu', 'us', 'cn', 'in'];

const list = async (conf, options) => {
	let questions = [
		{
			name: 'deviceId',
			message: () => options.zigbee ? 'Provide the \'virtual ID\' of the zigbee gateway to get the subdevices from:' : 'Provide a \'virtual ID\' of a device currently registered in the app:'
		}
	];

	const apiCredentialQuestions = [
		{
			name: 'apiKey',
			message: 'The API key from tuya.com:'
		},
		{
			name: 'apiSecret',
			message: 'The API secret from tuya.com'
		}
	];

	const savedAPIKey = conf.get('apiKey');
	const savedAPISecret = conf.get('apiSecret');
	const savedAPIRegion = conf.get('apiRegion');

	let useExistingKeys = false;
	if (savedAPIKey && savedAPISecret && savedAPIRegion) {
		const answers = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'useExistingKeys',
				message: `Do you want to use these saved API credentials? ${savedAPIKey} ${savedAPISecret} ${savedAPIRegion}`
			}
		]);

		({useExistingKeys} = answers);

		if (!useExistingKeys) {
			questions = [...apiCredentialQuestions, ...questions];
		}
	} else {
		questions = [...apiCredentialQuestions, ...questions];
	}

	const answers = await inquirer.prompt(questions);

	if (useExistingKeys) {
		answers.apiKey = savedAPIKey;
		answers.apiSecret = savedAPISecret;
	}

	// Get seed device
	let userId = null;
	let foundAPIRegion = savedAPIRegion;

	try {
		if (savedAPIRegion && useExistingKeys) {
			const api = new OpenAPI({key: answers.apiKey, secret: answers.apiSecret, region: savedAPIRegion});
			await api.getToken();
			const device = await api.getDevice(answers.deviceId);

			userId = device.uid;
		} else {
			const {device, region} = await any(REGIONS.map(async region => {
				const api = new OpenAPI({key: answers.apiKey, secret: answers.apiSecret, region});
				await api.getToken();
				const device = await api.getDevice(answers.deviceId);

				return {device, region};
			}));

			userId = device.uid;
			foundAPIRegion = region;
		}
	} catch (error) {
		if (process.env.DEBUG) {
			if (error.constructor === AggregateError) {
				console.error(error.errors);
			} else {
				console.error(error);
			}
		}

		console.error(colors.red('There was an issue fetching that device. Make sure your account is linked and the ID is correct.'));

		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	// Get user devices
	const api = new OpenAPI({key: answers.apiKey, secret: answers.apiSecret, region: foundAPIRegion});
	await api.getToken();

	const devices = options.zigbee ? await api.getSubDevicesOfZigbeeGateway(answers.deviceId) : await api.getDevicesByUser(userId);

	// Output devices
	const prettyDevices = devices.map(device => {
		const pretty = {
			name: device.name,
			id: device.id
		};

		if (options.zigbee) {
			pretty.cid = device.node_id;
		} else {
			pretty.key = device.local_key;
		}

		return pretty;
	});

	if (options.stringify) {
		console.log(JSON.stringify(prettyDevices));
	} else {
		console.log(prettyDevices);
	}

	// Save API key and secret
	conf.set('apiKey', answers.apiKey);
	conf.set('apiSecret', answers.apiSecret);
	conf.set('apiRegion', foundAPIRegion);
};

module.exports = list;

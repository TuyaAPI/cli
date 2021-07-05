const {TuyaContext} = require('@tuya/tuya-connector-nodejs');
const inquirer = require('inquirer');
const colors = require('colors');
const any = require('promise.any');
const AggregateError = require('es-aggregate-error/polyfill')();
const {regionToUrl} = require('./helpers');

const REGIONS = ['eu', 'us', 'cn', 'in'];

const list = async (conf, options) => {
	let questions = [
		{
			name: 'deviceId',
			message: 'Provide a \'virtual ID\' of a device currently registered in the app:'
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
	let userId;
	let foundAPIRegion = savedAPIRegion;

	try {
		const {device, region} = await any((savedAPIRegion ? [savedAPIRegion] : REGIONS).map(async region => {
			const api = new TuyaContext({
				baseUrl: regionToUrl(region),
				accessKey: answers.apiKey,
				secretKey: answers.apiSecret
			});

			const result = await api.request({
				method: 'GET',
				path: `/v1.0/devices/${answers.deviceId}`
			});

			if (!result.success) {
				throw new Error(`${result.code}: ${result.msg}`);
			}

			return {device: result.result, region};
		}));

		userId = device.uid;
		foundAPIRegion = region;
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
	const api = new TuyaContext({
		baseUrl: regionToUrl(savedAPIRegion),
		accessKey: answers.apiKey,
		secretKey: answers.apiSecret
	});

	const result = await api.request({
		method: 'GET',
		path: `/v1.0/users/${userId}/devices`
	});

	if (!result.success) {
		throw new Error(`${result.code}: ${result.msg}`);
	}

	const groupedDevices = {};
	for (const device of result.result) {
		if (device.node_id) {
			if (!groupedDevices[device.local_key] || !groupedDevices[device.local_key].subDevices) {
				groupedDevices[device.local_key] = {...groupedDevices[device.local_key], subDevices: []};
			}

			groupedDevices[device.local_key].subDevices.push(device);
		} else {
			groupedDevices[device.local_key] = {...device, ...groupedDevices[device.local_key]};
		}
	}

	// Output devices
	const prettyDevices = Object.values(groupedDevices).map(device => {
		const pretty = {
			name: device.name,
			id: device.id,
			key: device.local_key
		};

		if (device.subDevices) {
			const prettySubDevices = device.subDevices.map(subDevice => ({
				name: subDevice.name,
				id: subDevice.id,
				cid: subDevice.node_id
			}));

			pretty.subDevices = prettySubDevices;
		}

		return pretty;
	});

	if (options.stringify) {
		console.log(JSON.stringify(prettyDevices));
	} else {
		console.dir(prettyDevices, {depth: 3});
	}

	// Save API key and secret
	conf.set('apiKey', answers.apiKey);
	conf.set('apiSecret', answers.apiSecret);
	conf.set('apiRegion', foundAPIRegion);
};

module.exports = list;

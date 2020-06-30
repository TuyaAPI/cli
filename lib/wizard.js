const OpenAPI = require('@tuyapi/openapi');
const inquirer = require('inquirer');
const colors = require('colors');
const any = require('promise.any');

const REGIONS = ['eu', 'us', 'cn'];

const list = async conf => {
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
	} catch {
		console.error(colors.red('There was an issue fetching that device. Make sure your account is linked and the ID is correct.'));

		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	// Get user devices
	const api = new OpenAPI({key: answers.apiKey, secret: answers.apiSecret, region: foundAPIRegion});
	await api.getToken();
	const devices = await api.getDevicesByUser(userId);

	// Output devices
	console.log(devices.map(device => ({name: device.name, id: device.id, key: device.local_key})));

	// Save API key and secret
	conf.set('apiKey', answers.apiKey);
	conf.set('apiSecret', answers.apiSecret);
	conf.set('apiRegion', foundAPIRegion);
};

module.exports = list;

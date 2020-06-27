const OpenAPI = require('@tuyapi/openapi');
const inquirer = require('inquirer');
const colors = require('colors');

const list = async conf => {
	let questions = [
		{
			name: 'deviceId',
			message: 'Provide the ID of a device currently registered in the app:'
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
		},
		{
			name: 'region',
			message: 'Select the region closest to you:',
			type: 'list',
			choices: [
				{name: 'Americas', value: 'us'},
				{name: 'Europe', value: 'eu'},
				{name: 'Asia', value: 'cn'}
			]
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
		answers.region = savedAPIRegion;
	}

	// Create API instance
	const api = new OpenAPI({key: answers.apiKey, secret: answers.apiSecret, region: answers.region});

	await api.getToken();

	// Get seed device
	let userId = null;

	try {
		const device = await api.getDevice(answers.deviceId);

		userId = device.uid;
	} catch {
		console.error(colors.red('There was an issue fetching that device. Make sure your account is linked and the ID is correct.'));

		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	// Get user devices
	const devices = await api.getDevicesByUser(userId);

	// Output devices
	console.log(devices.map(device => ({name: device.name, id: device.id, key: device.local_key})));

	// Save API key and secret
	conf.set('apiKey', answers.apiKey);
	conf.set('apiSecret', answers.apiSecret);
	conf.set('apiRegion', answers.region);
};

module.exports = list;

const inquirer = require('inquirer');

const link = require('./link');

function linkWizard(config, options) {
	let questions = [
		{
			type: 'confirm',
			name: 'indicatorBlink',
			message: `Make the indicator light on your device flash.
                For most devices, this means holding down the main button.
                Press return when it's blinking.`
		},
		{
			type: 'input',
			name: 'ssid',
			message: 'What\'s your WiFi called?'
		},
		{
			type: 'password',
			name: 'wifiPassword',
			message: 'What\'s the password for your WiFi?'
		},
		{
			type: 'input',
			name: 'devices',
			message: 'How many devices do you want to link?',
			default: 1,
			validate(value) {
				const valid = !isNaN(parseFloat(value));
				return valid || 'Please enter a number';
			},
			filter: Number
		},
		{
			type: 'confirm',
			name: 'saveDevices',
			message: 'Do you want to save devices that are successfully linked?'
		}
	];

	// If API keys don't exist, add prompts
	if (options.overwrite || !config.get('apiKey') || !config.get('apiSecret')) {
		questions = questions.concat([
			{
				type: 'input',
				name: 'apiKey',
				message: 'What\'s your API key?'
			},
			{
				type: 'password',
				name: 'apiSecret',
				message: 'What\'s your API secret?'
			},
			{
				type: 'confirm',
				name: 'saveAPI',
				message: 'Do you want to save your API credentials?',
				default: true
			}
		]);
	}

	inquirer.prompt(questions).then(answers => {
		link(config, {
			ssid: answers.ssid,
			password: answers.wifiPassword,
			apiKey: answers.apiKey,
			apiSecret: answers.apiSecret,
			saveAPI: answers.saveAPI,
			num: answers.devices,
			save: answers.saveDevices
		});
	});
}

module.exports = linkWizard;

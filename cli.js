#!/usr/bin/env node

// Imports
const updateNotifier = require('update-notifier');
const program = require('commander');
const Configstore = require('configstore');

// Import local files
const link = require('./lib/link');
const linkWizard = require('./lib/link-wizard.js');
const control = require('./lib/control');
const pkg = require('./package.json');

// Check Node version
require('please-upgrade-node')(pkg);

// Set up config store
const conf = new Configstore(pkg.name);
updateNotifier({pkg}).notify();

// Link a device
program
	.command('link')
	.description('link a new device')
	.option('--ssid <ssid>', 'name of WiFi to connect to')
	.option('--password <password>', 'password of WiFi')
	.option('--api-key [apiKey]', 'your tuya.com API key')
	.option('--api-secret [apiSecret]', 'your tuya.com API secret')
	.option('--saveAPI', 'save your API pair so you can omit it for subsequent commands')
	.option('-s, --save', 'save device parameters for subsequent commands')
	.option('-n, --num [num]', 'number of devices to link', 1)
	.action(options => {
		link(conf, options);
	});

// Interactively link a device
program
	.command('link-wizard')
	.description('interactively link a new device (recommended for new users)')
	.option('--overwrite', 'show prompts for API credentials, even if some are already saved')
	.action(options => {
		linkWizard(conf, options);
	});

// Get a property
program
	.command('get')
	.description('get a property on a device')
	.option('-s, --save', 'save key so you can omit it for subsequent commands')
	.option('--id <id>', 'id of device')
	.option('--key [key]', 'key of device')
	.action(options => {
		control.get(conf, options);
	});

// Set a property
program
	.command('set')
	.description('set a property on a device')
	.option('-s, --save', 'save key so you can omit it for subsequent commands')
	.option('--id <id>', 'id of device')
	.option('--key [key]', 'key of device')
	.option('--set <set>', 'value to set')
	.option('--dps [dps]', 'DPS index to set', 1)
	.action(options => {
		control.set(conf, options);
	});

// List all saved devices
program
	.command('list')
	.description('list all saved devices and API keys')
	.action(() => {
		console.log(conf.all);
	});

// Get help
program
	.command('help')
	.description('output usage information')
	.action(() => {
		program.outputHelp();
	});

// Parse arguments
program.parse(process.argv);

#! /usr/bin/env node

// Imports
const updateNotifier = require('update-notifier');
const program = require('commander');
const Configstore = require('configstore');

// Import local files
const cloud = require('./lib/cloud');
const link = require('./lib/link');
const listApp = require('./lib/list-app.js');
const mock = require('./lib/mock.js');
const control = require('./lib/control');
const pkg = require('./package.json');

// Set up config store
const conf = new Configstore(pkg.name);
updateNotifier({pkg}).notify();

// Cloud methods
program
	.command('cloud list')
	.option('--api-key [apiKey]', 'your tuya.com API key')
	.option('--api-secret [apiSecret]', 'your tuya.com API secret')
	.option('--schema <schema>', 'your tuya.com app identifier')
	.option('-r, --region [region]', 'the region closest to you from the following list: us=Americas, eu=Europe, cn=Asia', 'us')
	.action(cloud.list);

// Link a device (old method)
program
	.command('link')
	.description('link a new device')
	.option('--ssid <ssid>', 'name of WiFi to connect to')
	.option('--password <password>', 'password of WiFi')
	.option('--api-key [apiKey]', 'your tuya.com API key')
	.option('--api-secret [apiSecret]', 'your tuya.com API secret')
	.option('--schema <schema>', 'your tuya.com app identifier')
	.option('-t, --timezone [timezone]', 'your local timezone in tz format', 'America/Chicago')
	.option('-r, --region [region]', 'the region closest to you from the following list: us=Americas, eu=Europe, cn=Asia', 'us')
	.option('--saveAPI', 'save your API pair so you can omit it for subsequent commands')
	.option('-s, --save', 'save device parameters for subsequent commands')
	.option('-n, --num [num]', 'number of devices to link', 1)
	.action(options => {
		link(conf, options);
	});

// Get a property
program
	.command('get')
	.description('get a property on a device')
	.option('-s, --save', 'save key so you can omit it for subsequent commands')
	.option('--ip <ip_addr>', 'ip address of device')
	.option('--id <id>', 'id of device')
	.option('--key [key]', 'key of device')
	.option('--dps [dps]', 'property index to get', 1)
	.option('-a, --all', 'get all properties of a device', false)
	.option('--protocol-version [version]', 'tuya protocol version', parseFloat, 3.1)
	.action(options => {
		control.get(conf, options);
	});

// Set a property
program
	.command('set')
	.description('set a property on a device')
	.option('-s, --save', 'save key so you can omit it for subsequent commands')
	.option('--ip <ip_addr>', 'ip address of device')
	.option('--id <id>', 'id of device')
	.option('--key [key]', 'key of device')
	.option('--set <set>', 'value to set')
	.option('--raw-value', 'pass the raw set value without attempting to parse it from a string')
	.option('--dps [dps]', 'DPS index to set', 1)
	.option('--protocol-version [version]', 'tuya protocol version', parseFloat, 3.1)
	.action(options => {
		control.set(conf, options);
	});

// List all locally saved devices
program
	.command('list')
	.description('list all locally saved devices')
	.action(() => {
		console.log(conf.all);
	});

// MITM Tuya App and list devices
program
	.command('list-app')
	.description('list devices from Tuya Smart app (deprecated)')
	.option('--ip <ip_addr>', 'IP address to bind the proxy and certificate server to')
	.option('-p, --port [port]', 'port to use for proxy', 8001)
	.option('--cert-port [port]', 'port to use for certificate download', 8002)
	.option('-q, --omitQR', 'don\'t show the QR code for certificate setup', false)
	.option('-o, --out [file]', 'export devices to a JSON file instead of printing them', '')
	.action(options => {
		listApp(conf, options);
	});

program
	.command('mock')
	.description('mock a Tuya device for local testing')
	.option('-i, --id [id]', 'ID to use for mock device')
	.option('-k, --key [key]', 'key to use for mock device')
	.option('-s, --state [state]', 'inital state to use for device', JSON.stringify({1: true, 2: false}))
	.option('-u, --disableUDP', 'disable the UDP broadcast')
	.action(options => {
		mock(conf, options);
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

const qrcode = require('qrcode-terminal');
const address = require('address');
const AnyProxy = require('anyproxy');
const ora = require('ora');

// eslint-disable-next-line no-unused-vars, no-restricted-modules
const colors = require('colors');

async function listApp(config, options) {
	// Get port from CLI options
	options.port = Number(options.port);

	// Options for AnyProxy
	const proxyOptions = {
		port: options.port,
		rule: require('./proxy-rules.js')(printDevices),
		webInterface: {
			enable: true,
			webPort: (options.port + 1)
		},
		forceProxyHttps: true,
		wsIntercept: false,
		silent: true
	};

	// Instantiate proxy server
	const proxyServer = new AnyProxy.ProxyServer(proxyOptions);

	// Spinner object
	let spin;

	// When proxy server is ready
	proxyServer.on('ready', () => {
		// Clear console
		process.stdout.write('\u001Bc');

		// Show QR code
		if (!options.omitQR) {
			console.log('Scan this QR code with your phone to setup the certificate: \n'.bold.blue);
			qrcode.generate('http://' + address.ip() + ':' + (options.port + 1) + '/fetchCrtFile');
			console.log('\n');
		}

		// Instructions for setting up proxy
		console.log('Set your HTTP proxy IP to '.bold.blue + address.ip().bold.yellow + ' with port '.bold.blue + (String(options.port)).bold.yellow + '.'.bold.blue);

		spin = ora('Waiting for request...').start();
	});

	// (Not) handle errors
	proxyServer.on('error', e => {
		throw e;
	});

	// Start proxy server
	proxyServer.start();

	function printDevices(devices) {
		// Extract only needed information for easier viewing
		const devicesStripped = devices.map(device => {
			return {id: device.devId, key: device.localKey};
		});

		// Stop spinner
		spin.stop();

		// Print out results
		console.log('\n');
		console.log('Devices(s):'.bold.green);
		console.log(devicesStripped);

		// Exit
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit();
	}
}

module.exports = listApp;

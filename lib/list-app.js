const path = require('path');
const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const qrcode = require('qrcode-terminal');
const address = require('address');
const mitm = require('http-mitm-proxy');
const ora = require('ora');

// eslint-disable-next-line no-unused-vars, no-restricted-modules
const colors = require('colors');

async function listApp(config, options) {
	const configPath = path.dirname(config.path);

	// Activity spinner
	const spin = ora('Waiting for request...');

	// Get port from CLI options
	options.port = Number(options.port);

	// Create proxy server
	const proxy = mitm();

	proxy.onRequest((ctx, callback) => {
		if (ctx.clientToProxyRequest.headers.host.includes('tuya')) {
			ctx.onResponseData((ctx, chunk, callback) => {
				const data = JSON.parse(chunk.toString());

				try {
					// Find devices
					const devices = data.result.find(result => result.a === 'tuya.m.my.group.device.list').result;

					// No error, devices exist
					spin.succeed('Response intercepted.');

					console.log('\n');

					console.log('Devices(s):'.bold.green);
					console.log(devices.map(device => ({
						name: device.name,
						id: device.devId,
						key: device.localKey
					})));

					// Exit
					// eslint-disable-next-line unicorn/no-process-exit
					process.exit();
				} catch (_) {}

				return callback(null, chunk);
			});
		}

		return callback();
	});

	proxy.listen({port: options.port, sslCaDir: path.join(configPath, 'ssl')}, () => {});

	// Create server for downloading certificate
	const serve = serveStatic(path.join(configPath, 'ssl', 'certs'), {});

	// Create server
	const server = http.createServer((req, res) => {
		serve(req, res, finalhandler(req, res));
	});

	// Listen
	server.listen(options.port + 1);

	// Clear console
	process.stdout.write('\u001Bc');

	// Show QR code
	if (!options.omitQR) {
		console.log('Scan this QR code with your phone to setup the certificate: \n'.bold.blue);
		qrcode.generate('http://' + address.ip() + ':' + (options.port + 1) + '/ca.pem');
		console.log('\n');
	}

	// Instructions for setting up proxy
	console.log('Set your HTTP proxy IP to '.bold.blue + address.ip().bold.yellow + ' with port '.bold.blue + (String(options.port)).bold.yellow + '.'.bold.blue);

	console.log('\n');

	// Start spinner
	spin.start();
}

module.exports = listApp;

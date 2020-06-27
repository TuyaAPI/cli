const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const qrcode = require('qrcode-terminal');
const mitm = require('http-mitm-proxy');
const ora = require('ora');

// eslint-disable-next-line no-unused-vars
const colors = require('colors');

async function listApp(config, options) {
	const configPath = path.dirname(config.path);

	// Activity spinner
	const spin = ora('Waiting for request...');

	// Get port from CLI options
	if (!options.port) {
		console.error('Port number is missing. For valid options:\n  tuya-cli list-app --help');
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	options.port = Number.parseInt(options.port, 10);

	if (options.port < 1 || options.port > 65535) {
		console.error('The valid range for port number is 1-65535. For valid options:\n  tuya-cli list-app --help');
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}

	options.certPort = Number.parseInt(options.certPort, 10);
	if (options.certPort === options.port) {
		console.error('The port for the proxy and certificate download need to be different.');
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(2);
	}

	if (options.certPort < 1 || options.certPort > 65535) {
		console.error('The valid range for certificate port number is 1-65535. For valid options:\n  tuya-cli list-app --help');
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(2);
	}

	// Create proxy server
	const proxy = mitm();

	proxy.onRequest((ctx, callback) => {
		if (ctx.clientToProxyRequest.headers.host.includes('tuya')) {
			const chunks = [];
			ctx.onResponseData((ctx, chunk, callback) => {
				chunks.push(chunk);
				return callback(null, chunk);
			});
			ctx.onResponseEnd((ctx, callback) => {
				const body = Buffer.concat(chunks).toString('utf-8');

				try {
					const data = JSON.parse(body);

					// Find devices
					let devices = data.result.find(result => result.a === 'tuya.m.my.group.device.list').result;

					// No error, devices exist
					spin.succeed('Response intercepted.');

					devices = devices.map(device => ({
						name: device.name,
						id: device.devId,
						key: device.localKey
					}));

					if (options.out === '') {
						console.log('\n');

						console.log('Devices(s):'.bold.green);
						console.log(devices);
					} else {
						try {
							fs.writeFileSync(options.out, JSON.stringify(devices));
							spin.succeed('File written.');
						} catch {
							console.error('File could not be written.');
						}
					}

					// Exit
					// eslint-disable-next-line unicorn/no-process-exit
					process.exit();
				} catch {}

				return callback();
			});
		}

		return callback();
	});

	proxy.listen({port: options.port, sslCaDir: path.join(configPath, 'ssl')}, () => {});

	// Create server for downloading certificate
	const serve = serveStatic(path.join(configPath, 'ssl', 'certs'), {});

	// Create server
	const server = http.createServer((request, response) => {
		serve(request, response, finalhandler(request, response));
	});

	// Listen
	server.listen(options.certPort);

	// Clear console
	process.stdout.write('\u001Bc');

	let ips = [];
	const ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(name => {
		ifaces[name].forEach(network => {
			if (network.family === 'IPv4' && !network.internal) {
				ips.push(network.address);
			}
		});
	});
	if (options.ip) {
		if (ips.includes(options.ip)) {
			ips = [options.ip];
		} else {
			console.error('The chosen IP is not an external IPv4 address on this machine. The external IPs are:\n\t' + ips.join('\n\t'));
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit(3);
		}
	}

	console.log('Note: Tuya has started to change the way their apps communicate with the cloud \nand it\'s likely that this method will not work with your version of the app. If \nit doesn\'t work, try using the link command instead. \n');
	// eslint-disable-next-line no-use-extend-native/no-use-extend-native
	console.log('See https://github.com/codetheweb/tuyapi/issues/280 for details.\n\n'.gray);

	// Show QR code
	if (!options.omitQR) {
		console.log('Scan this QR code with your phone to setup the certificate: \n'.bold.blue);
		qrcode.generate('http://' + ips[0] + ':' + options.certPort + '/ca.pem');
		console.log('\n');
	}

	// Instructions for setting up proxy
	console.log('Set your HTTP proxy IP to '.bold.blue + ips[0].bold.yellow + ' with port '.bold.blue + (String(options.port)).bold.yellow + '.'.bold.blue);
	if (ips.length > 1) {
		console.log('This machine has ' + ips.length + ' IPs' + ': to choose a different one, use the --ip option.'.gray);
	}

	console.log('\n');

	// Start spinner
	spin.start();
}

module.exports = listApp;

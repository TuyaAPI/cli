const qrcode = require('qrcode-terminal');
const address = require('address');
const AnyProxy = require('anyproxy');

async function listApp(config, options) {
  options.port = Number(options.port);

	const proxyOptions = {
		port: options.port,
		rule: require('./proxyRules.js'),
		webInterface: {
			enable: true,
			webPort: (options.port + 1)
		},
		forceProxyHttps: true,
		wsIntercept: false,
		silent: true
	};
	const proxyServer = new AnyProxy.ProxyServer(proxyOptions);

	proxyServer.on('ready', () => {
    if (!options.omitQR)
      console.log('Scan this QR code with your phone to setup the certificate:')
		  qrcode.generate('http://' + address.ip() + ':' + (options.port + 1) + '/fetchCrtFile');

    console.log('Set your HTTP proxy IP to ' + address.ip() + ' with port ' + options.port + '.');
	});

	proxyServer.on('error', e => {
		console.log('ERROR: ' + e);
	});

	proxyServer.start();
}

module.exports = listApp;

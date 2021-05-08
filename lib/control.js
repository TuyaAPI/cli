const TuyAPI = require('tuyapi');

const c = require('./common');

function parseConfig(config, options) {
	if (options.id === undefined) {
		c.badArgument(options);
	}

	if (Number.isNaN(Number(options.protocolVersion))) {
		c.badArgument(options);
	}

	// Save to config
	if (options.save === true) {
		config.set(options.id, options.key);
	}

	// If key is not given but exists in config
	if (options.key === undefined && config.get(options.id) !== undefined) {
		if (options.ip === undefined) {
			return new TuyAPI({version: options.protocolVersion, id: options.id, key: config.get(options.id)});
		}

		return new TuyAPI({version: options.protocolVersion, ip: options.ip, id: options.id, key: config.get(options.id)});
	}

	// If key is not given and does not exit in config
	if (options.key === undefined && config.get(options.id) === undefined) {
		c.badArgument(options);
	} else {
		// If both arguments are given
		const apiOptions = {version: options.protocolVersion, id: options.id, key: options.key};
		if (options.ip !== undefined) {
			apiOptions.ip = options.ip;
		}

		if (options.cid !== undefined) {
			apiOptions.issueGetOnConnect = false;
		}

		return new TuyAPI(apiOptions);
	}
}

async function get(config, options) {
	const tuya = parseConfig(config, options);

	try {
		await tuya.find();

		await tuya.connect();

		const properties = options.cid ? await tuya.get({cid: options.cid}) : await tuya.get({schema: true});

		tuya.disconnect();

		if (properties) {
			if (options.all || options.cid) {
				console.log(JSON.stringify(properties));
			} else {
				console.log(properties.dps[options.dps]);
			}
		}
	} catch (error) {
		console.log(error);
	}
}

async function set(config, options) {
	if (options.set === undefined) {
		c.badArgument(options);
	}

	if (!options.rawValue) {
		if (!Number.isNaN(Number(options.set))) {
			options.set = Number.parseInt(options.set, 10);
		} else if (options.set.toLowerCase() === 'true') {
			options.set = true;
		} else if (options.set.toLowerCase() === 'false') {
			options.set = false;
		}
	}

	const tuya = parseConfig(config, options);

	try {
		await tuya.find();

		await tuya.connect();

		await tuya.set({cid: options.cid, set: options.set, dps: options.dps});

		tuya.disconnect();

		console.log('Set succeeded.');
	} catch (error) {
		console.log(error);
	}
}

module.exports = {get, set};

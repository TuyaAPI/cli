const TuyAPI = require('tuyapi');

const c = require('./common');

function parseConfig(config, options) {
	const apiOptions = {
		issueGetOnConnect: false,
		version: options.protocolVersion,
		id: options.id,
		ip: options.ip,
		key: options.key || config.get(options.id)
	};

	// If key is not given and does not exit in config
	if (!apiOptions.key) {
		c.badArgument(options);
	}

	if (!apiOptions.id) {
		c.badArgument(options);
	}

	if (Number.isNaN(Number(apiOptions.version))) {
		c.badArgument(options);
	}

	// Save to config
	if (options.save === true) {
		config.set(options.id, options.key);
	}

	return new TuyAPI(apiOptions);
}

async function get(config, options) {
	const tuya = parseConfig(config, options);

	try {
		await tuya.find();

		await tuya.connect();

		const properties = await tuya.get({schema: true, cid: options.cid, dps: options.dps});

		tuya.disconnect();

		if (properties) {
			if (options.dps) {
				console.log(properties.dps[options.dps]);
			} else if (options.full) {
				console.log(properties);
			} else {
				console.log(properties.dps);
			}
		} else {
			throw new Error('No response from device');
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

		await tuya.set({set: options.set, dps: options.dps, cid: options.cid});

		tuya.disconnect();

		console.log('Set succeeded.');
	} catch (error) {
		console.log(error);
	}
}

module.exports = {get, set};

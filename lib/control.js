const TuyAPI = require('tuyapi');

const c = require('./common');

function parseConfig(config, options) {
	if (options.id === undefined) {
		c.badArgument(options);
	}

	// Save to config
	if (options.save === true) {
		config.set(options.id, options.key);
	}

	// If key is not given but exists in config
	if (options.key === undefined && config.get(options.id) !== undefined) {
		if (options.ip === undefined) {
			return new TuyAPI({id: options.id, key: config.get(options.id)});
		}
		return new TuyAPI({ip: options.ip, id: options.id, key: config.get(options.id)});
	}
	// If key is not given and does not exit in config
	if (options.key === undefined && config.get(options.id) === undefined) {
		c.badArgument(options);
	} else {
		// If both arguments are given
		if (options.ip === undefined) {
			return new TuyAPI({id: options.id, key: options.key});
		}
		return new TuyAPI({ip: options.ip, id: options.id, key: options.key});
	}
}

async function get(config, options) {
	const tuya = parseConfig(config, options);

	try {
		await tuya.resolveId();

		const properties = await tuya.get({schema: true});

		if (options.all) {
			console.log(properties);
		} else {
			console.log(properties.dps[options.dps]);
		}
	} catch (error) {
		console.log(error);
	}
}

async function set(config, options) {
	if (options.set === undefined) {
		c.badArgument(options);
	}

	if (!isNaN(options.set)) {
		options.set = parseInt(options.set, 10);
	} else if (options.set.toLowerCase() === 'true') {
		options.set = true;
	} else if (options.set.toLowerCase() === 'false') {
		options.set = false;
	}

	const tuya = parseConfig(config, options);

	try {
		await tuya.resolveId();

		await tuya.set({set: options.set, dps: options.dps});

		console.log('Set succeeded.');
	} catch (error) {
		console.log(error);
	}
}

module.exports = {get, set};

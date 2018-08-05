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
		return new TuyAPI({id: options.id, key: config.get(options.id)});
	}
	// If key is not given and does not exit in config
	if (options.key === undefined && config.get(options.id) === undefined) {
		c.badArgument(options);
	} else {
		// If both arguments are given
		return new TuyAPI({id: options.id, key: options.key});
	}
}

function get(config, options) {
	const tuya = parseConfig(config, options);

	tuya.resolveId().then(() => {
		tuya.get().then(status => {
			console.log(status);
		});
	});
}

function set(config, options) {
	if (options.set === undefined) {
		c.badArgument(options);
	}

	options.set = options.set.toLowerCase();
	if (options.set === 'true') {
		options.set = true;
	} else if (options.set === 'false') {
		options.set = false;
	}

	const tuya = parseConfig(config, options);

	tuya.resolveId().then(() => {
		tuya.set({set: options.set, dps: options.dps}).then(() => {
			console.log('Set succeeded.');
		});
	});
}

module.exports = {get, set};

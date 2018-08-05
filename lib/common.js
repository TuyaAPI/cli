// eslint-disable-next-line no-restricted-modules
const colors = require('colors');

function badArgument(options) {
	options.outputHelp(colors.red);

	// eslint-disable-next-line unicorn/no-process-exit
	process.exit(1);
}

module.exports = {badArgument};

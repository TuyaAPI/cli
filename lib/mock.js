const Stub = require('@tuyapi/stub');
const Table = require('cli-table3');
const keypress = require('keypress');

const c = require('./common');

async function mock(config, options) {
	// Check arguments
	if (!options.id || !options.key) {
		return c.badArgument(options);
	}

	// Create stub device
	const device = new Stub({id: options.id, key: options.key, ip: options.ip, state: JSON.parse(options.state)});

	// Start stub server
	await device.startServer();

	if (!options.disableUDP) {
		await device.startUDPBroadcast();
	}

	// Print usage
	printUsage();

	// Print table of inital values
	printTable(device.getState());

	// Add keypress listener
	keypress(process.stdin);
	process.stdin.setRawMode(true);
	process.stdin.resume();

	process.stdin.on('keypress', (char, key) => {
		if (key && (key.name === 'q' || (key.ctrl && key.name === 'c'))) {
			// Quit
			// eslint-disable-next-line unicorn/no-process-exit
			process.exit();
		} else if (char === 's') {
			// Show state
			printTable(device.getState());
		} else if (char === '?') {
			// Show help
			printUsage();
		} else if (Object.prototype.hasOwnProperty.call(device.getState(), char)) {
			device.setProperty(char, !device.getProperty(char));
			printTable(device.getState());
		}
	});
}

function printUsage() {
	const head = ['Character', 'Function'];

	const table = new Table({
		head,
		colWidths: [15, 30]
	});

	table.push(['s', 'get current state']);
	table.push(['s', 'get current state']);
	table.push(['1-9', 'toggle property']);
	table.push(['?', 'print this help message']);
	table.push(['q', 'exit']);

	console.log(table.toString());
}

function printTable(state) {
	const head = ['Property'];
	const colWidths = [10];

	Object.keys(state).forEach(d => {
		head.push(d);
		colWidths.push(10);
	});

	const table = new Table({
		head,
		colWidths
	});

	const row = ['Status'];
	Object.keys(state).forEach(d => {
		row.push(state[d]);
	});

	table.push(row);

	console.log(table.toString());
}

module.exports = mock;

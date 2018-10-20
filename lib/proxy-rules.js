const dnode = require('dnode');

const d = dnode.connect(5004);

let remote;

d.on('remote', rem => {
	remote = rem;
});

module.exports = {
	summary: 'sniff for Tuya devices',
	// eslint-disable-next-line require-yield
	* beforeSendResponse(requestDetail, responseDetail) {
		const body = responseDetail.response.body.toString('utf8');

		// Check request
		if (body.includes('tuya.m')) {
			const devices = checkForDevice(body);

			if (devices !== false) {
				// Send message back to main script
				remote.returnDevices(devices);
			}

			return null;
		}
	}
};

function checkForDevice(response) {
	try {
		response = JSON.parse(response);

		let devices = false;
		response.result.forEach(call => {
			if (call.a === 'tuya.m.my.group.device.list') {
				devices = call.result;
			}
		});

		return devices;
	} catch (error) {
		return false;
	}
}

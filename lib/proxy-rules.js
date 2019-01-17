const debug = require('debug')('TuyaCLI:Proxy');

module.exports = function (callback) {
	return {
		summary: 'sniff for Tuya devices',
		// eslint-disable-next-line require-yield
		* beforeSendResponse(requestDetail, responseDetail) {
			const body = responseDetail.response.body.toString('utf8');

			debug('Request:');
			debug(requestDetail.requestData.toString('utf8'));

			debug('Response:');
			debug(responseDetail.response.body.toString('utf8'));

			// Check request
			if (body.includes('tuya.m') || body.includes('devices')) {
				const devices = checkForDevice(body);
				if (devices !== false) {
					// Return devices
					callback(devices);
				}
				return null;
			}
		}
	};
};

function checkForDevice(response) {
	try {
		response = JSON.parse(response);
		let devices = false;
		if (response.result.forEach !== undefined) {
			response.result.forEach(call => {
				if (call.a === 'tuya.m.my.group.device.list') {
					devices = call.result;
				}
			});
		} else if (response.result.gateways !== undefined) {
			devices = response.result.gateways;
		}

		return devices;
	} catch (error) {
		return false;
	}
}

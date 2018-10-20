module.exports = {
	summary: 'sniff for Tuya devices',
	* beforeSendResponse(requestDetail, responseDetail) {

		const body = responseDetail.response.body.toString('utf8');
		if (body.includes('tuya.m')) {
			const devices = checkForDevice(body);
      if (devices !== false) {
        console.log(devices);
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
  } catch(error) {
    return false;
  }
}

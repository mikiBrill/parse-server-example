Parse.Cloud.define('pingReply', function(request, response) {
	var params = request.params;
	var customData = params.customData;

	if (!customData) {
		response.error("Missing customData!")
	}

	var jsonData = JSON.parse(customData);
	var sender = jsonData.sender;
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("installationId", sender);

	Parse.Push.send({
		where: query,
		// Parse.Push requires a dictionary, not a string.
		data: {"alert": "hello phone"},
	}, { success: function() {
		console.log("#### PUSH OK");
	}, error: function(error) {
		console.log("#### PUSH ERROR: " + error.message);
	}, useMasterKey: true});

	response.success('success');
});

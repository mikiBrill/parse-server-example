Parse.Cloud.define('notifyClient', function(request, response) {
	var params = request.params;
	var customData = params.customData;

	if (!customData) {
		response.error("Missing customData!")
	}

	var jsonData = JSON.parse(customData);
	var clientInstallationId = jsonData.client;
	var restInstallationId = jsonData.rest;
	var restaurantName = jsonData.restaurant;
	var reservationId = jsonData.reservationId;
	var msg = jsonData.clientMessage;
	var restMsg = jsonData.restMessage;
	
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("installationId", clientInstallationId);

	Parse.Push.send({
		where: query,
		// Parse.Push requires a dictionary, not a string.
		data: {"alert"	 : msg,
		       "restName": restaurantName,
		       "resvId"	 : reservationId},
	}, { success: function() {
		console.log("#### CLIENT PUSH OK");
		var query = new Parse.Query("Reservation");
		query.equalTo("objectId", reservationId);

		  query.find({
		      success: function(reservations){
			  console.log("Reservations found", reservations);
			   reservations[0].set("is_notified", true);
			   reservations[0].save(null,{
			    success: function(updated){
				console.log("Reservation in_notified updated to true: ", updated);
			  },
			  error: function(err){
			    	console.error("error updating Reservation in_notified: ", err);
			   }
			 });

	       },
	      error: function(err2){
		    console.error("error at querying: ", err2);
	       }
	   });
	}, error: function(error) {
		console.log("#### CLIENT PUSH ERROR: " + error.message);
	}, useMasterKey: true});
	
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("installationId", restInstallationId);

	Parse.Push.send({
		where: query,
		// Parse.Push requires a dictionary, not a string.
		data: {"alert"	 : restMsg,
		       "restName": restaurantName,
		       "resvId"	 : reservationId},
	}, { success: function() {
		console.log("#### RESTAURANT PUSH OK");
	}, error: function(error) {
		console.log("#### RESTAURANT PUSH ERROR: " + error.message);
	}, useMasterKey: true});
	
	response.success('success');
});

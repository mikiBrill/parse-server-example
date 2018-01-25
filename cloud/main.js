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
		       "resvId"	 : reservationId,
		       "isForClient": true},
	}, { success: function() {
		console.log("#### CLIENT PUSH OK: ");
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
		       "resvId"	 : reservationId,
		       "isForClient": false},
	}, { success: function() {
		console.log("#### RESTAURANT PUSH OK");
	}, error: function(error) {
		console.log("#### RESTAURANT PUSH ERROR: " + error.message);
	}, useMasterKey: true});
	
	response.success('success');
});

Parse.Cloud.define('deletePushes', function(request, response) {
	var query = new Parse.Query("_PushStatus");
	query.find({
		success: function(pushes){
			for (var i = 0; i < pushes.length; i++) {
				var pushObj = pushes[i];
				pushObj.destroy({
					success: function(pushObj) {
					console.log("delete push success: ", pushObj);
					},
					error: function(error) {
						console.error("delete push failed: ", error);
					},
					useMasterKey: true
				});
			}
		},
		error: function(err2){
			console.error("error at querying: ", err2);
		},
		useMasterKey: true
	});
	
	response.success('success');
});

Parse.Cloud.define('deleteInstallation', function(request, response) {
	var params = request.params;
	var customData = params.customData;

	if (!customData) {
		response.error("Missing customData!")
	}

	var jsonData = JSON.parse(customData);
	var clientInstallationId = jsonData.installationId;
	
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("installationId", clientInstallationId);
	
	query.find({
		success: function(installations){
			var installationObj = installations[0];
			installationObj.destroy({
				success: function(installationObj) {
				console.log("delete installation success: ", installationObj);
				},
				error: function(error) {
					console.error("delete installation failed: ", error);
				},
				useMasterKey: true
			});
		},
		error: function(err2){
			console.error("error at querying: ", err2);
		},
		useMasterKey: true
	});
	
	response.success('success');
});

Parse.Cloud.define('deleteFiles', function(request, response) {
	var params = request.params;
	var customData = params.customData;
	
	if (!customData) {
		response.error("Missing customData!")
	}
	var MongoClient = require('mongodb').MongoClient;
	var url = "mongodb://admin:admin@ds129906.mlab.com:29906/heroku_tjh6fmn7";
	MongoClient.connect(url, function(err, db){
		console.log("Connected successfully to server");
		
		var jsonData = JSON.parse(customData);
		var pictureFileName = jsonData.filename;
		var query = { filename: pictureFileName };

		db.collection("fs.chunks").count(function(err, cnt) {
				console.log("Before remove: ", cnt);
		});
		
//		db.collection("fs.files").findOneAndDelete(query, function(err, f) {
//			deleteChunks(db, f._id);
//		});
		db.collection("fs.files").find(query).toArray(function(err, files) {
			//deleteChunks(db, files[0]._id);
		});
		
		var cursor = db.collection("fs.files").findOne(query);
		console.log(cursor);
		
		
		db.collection("fs.chunks").count(function(err, cnt) {
			console.log("After remove: ", cnt);
		});
		
		db.close();
	});

	response.success('success');
});

function deleteChunks(db, id){
	console.log(id);
	var query = { files_id: id };
	db.collection("fs.chunks").find(query).toArray(function(err, chunks) {
		for (var i = 0; i < chunks.length; i++) {
			console.log(chunks[i]);
		}
	});
}

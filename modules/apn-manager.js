var path = require('path');
var util = require("util");
var apns = require("apns"), options, notification;
optionsLive = {
   keyFile : path.join(__dirname, 'certs') + "/PushChatLiveKey.pem",
   certFile : path.join(__dirname, 'certs') + "/cklive.pem",
   passphrase:"island595",
   debug:false,
   errorCallback:onErrorCB
};


var apn = require('apn');
var options =
{
   	"cert":path.join(__dirname, 'certs') + "/cklive.pem",
   	"key":path.join(__dirname, 'certs') + "/PushChatLiveKey.pem",
   	"passphrase":"island595",
   	"production":true
};

var apnConnection = new apn.Connection(options);



/*
notification = new apns.Notification();
notification.payload = {"description" : "A good news !"};
notification.badge = 1;
notification.sound = "dong.aiff";
notification.alert = "Hello World !";
notification.device = new apns.Device("iphone_token");

*/

function onErrorCB(err,obj)
{
	console.log(err);
	console.log("ERROR_APN")
	console.log(util.inspect(err),util.inspect(obj))
}



exports.sendAPNLive = function(token,message,payload)
{
	/*
	var connection = new apns.Connection(optionsLive);
	notification = new apns.Notification();
	notification.device = new apns.Device(token);
	notification.alert = message;
	notification.payload = payload;
	notification.badge = payload.badge;
	notification.sound = "default";
	connection.sendNotification(notification);
	*/

	var myDevice = new apn.Device(token);

	var note = new apn.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = payload.badge;
	note.sound = "default";
	note.alert = message;
	note.payload = payload;

	apnConnection.pushNotification(note, myDevice);
}


function testApp()
{
	var payload = new Object();
	payload.type = "message";
	payload.badge = 1;

	var connection = new apns.Connection(optionsLive);
	notification = new apns.Notification();
	notification.device = new apns.Device("6304f679eec41cb5a27431b3cd54859eecc63926dbbfcbf051408c56ede76963");
	notification.alert = "Testing!";
	notification.payload = payload;
	notification.badge = payload.badge;
	notification.sound = "default";
	connection.sendNotification(notification);
	console.log("APN_SENT!!")
}

//setTimeout(testApp,5000);


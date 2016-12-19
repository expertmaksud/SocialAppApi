var gcm = require('node-gcm');
 
var message = new gcm.Message();
 
message.addData('key1', 'msg1');
 
var regTokens = ['fy2iagL9MmU:APA91bHzkuOB2o0G1j2cUK7AmVAgVBeiR3c5Ng2XpNvUvtqfD_dY_NxU2mFWtx8w2ESth4e74HAleLcmb5vMq5SpZiWSBxKD_MQ3z5HaRjFao0nUeFtx2mFnUp4cT2Ev5XkuXOBe9Qww'];
 
// Set up the sender with you API key 
var sender = new gcm.Sender('AIzaSyD3MWjde9SBr4sEvRKj-wftB_ECxhfZcOs');
 
//AIzaSyD3MWjde9SBr4sEvRKj-wftB_ECxhfZcOs

// -old one AIzaSyBKCeyNfIEEas5pzOckT7fcCmz_8iQnJW0

// cDLrHxyvq3U:APA91bEdrzMX4ri-L3jjbk9L0BeRiOTixOHJQxllYftxBQdtZvXECvRAo9sHLS2i__qXnWlSrVfXf9k5my9V3kZDDCWJcdy91Tmw9EAM1E0pTy3jeZjOjr45PUbstc-ih3jjIpl5-qRY

function testIt()
{
	// Now the sender can be used to send messages 
sender.send(message, { registrationTokens: regTokens }, function (err, result) {
    if(err) console.error(err);
    else    console.log(result);
	});
}



exports.sendTestMessage = function(token,callback)
{
	sender.send(message, { registrationTokens: [token] }, function (err, result) {
    
		console.log("DONE______ANDROID______")
		console.log(err)
		console.log("------")
		console.log(result)

    	callback()
	});
}



exports.sendMessage = function(token,messageToSend)
{


console.log("_____1")
	var FCM = require('fcm-push');
console.log("_____2")
var serverKey = 'AIzaSyAat6mj0Oi6wq2UvVVKT3JnhMQNZDahRXE';
var fcm = new FCM(serverKey);


console.log("_____3")

var message = {
    to: token, // required fill with device token or topics
    collapse_key: '', 
    data: {

       // your_custom_data_key: 'your_custom_data_value'
    },
    notification: {
        title: 'Alert',
        body: messageToSend
    }
};

console.log("_____4")

//callback style
fcm.send(message, function(err, response){
    if (err) {
    	console.log("_____5")
        console.log("Something has gone wrong!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
})


}






function testApp()
{
var FCM = require('fcm-push');

var serverKey = 'AIzaSyAat6mj0Oi6wq2UvVVKT3JnhMQNZDahRXE';
var fcm = new FCM(serverKey);

var message = {
    to: 'cDLrHxyvq3U:APA91bEdrzMX4ri-L3jjbk9L0BeRiOTixOHJQxllYftxBQdtZvXECvRAo9sHLS2i__qXnWlSrVfXf9k5my9V3kZDDCWJcdy91Tmw9EAM1E0pTy3jeZjOjr45PUbstc-ih3jjIpl5-qRY', // required fill with device token or topics
    collapse_key: 'demo', 
    data: {

       // your_custom_data_key: 'your_custom_data_value'
    },
    notification: {
        title: 'Titles',
        body: 'Bodys'
    }
};

//callback style
fcm.send(message, function(err, response){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
})


}



//setTimeout(testApp,4000)

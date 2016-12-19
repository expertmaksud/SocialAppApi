var moment = require('moment');
var crypto = require('crypto')
var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var database = null;
var DM = require('./db-manager');
var MM = require('./member-manager');
var APNM = require('./apn-manager');
var MSM = require('./messages-manager');
var FM = require('./feed-manager');
var ADM = require('./android-manager');
var notifications;
var eventEmitter = DM.eventEmitter;
eventEmitter.on('database_connected', function()
{
    DM.getCollection('notifications',function(collection)
   {
    notifications = collection;
    console.log("notifications connected");
   });
});


var per_page = 50;


exports.addNotification = function(data, callback)
{
	
	if(data.user_id == data.member_id)
	{
		callback();
		return;
	}


	data.created_at = new Date();
	data.read = false;
	data.visible = true;

	notifications.insert(data, function()
	{
		callback()
	});

	FM.isFeedVisible(data.content_id, function(success)
	{
		if(success && data.content_id != "")
		{

	

	MM.getMemberInfo(data.member_id,function(success,from_item)
	{
		if(success)
		{
			var message = from_item.username + " "  + data.action + " your " + data.content_type + ".";

			if(data.action == "followed")
			{
				message = from_item.username + " started following you.";
			}

			if(data.action == "screen shot")
			{
				message = from_item.username + " took a screen shot in your DM.";
			}

			

			if(data.action == "unfollowed")
			{
				message = from_item.username + " stopped following you.";
			}
			
			if(data.type == "follow_accepted")
			{
				message = from_item.username + " accepted your following request."
			}

			if(data.type == "follow_request")
			{
				message = from_item.username + " " + data.action + "."
			}
			var badge_count = 0;
			MSM.getUnreadCount(data.user_id,function(message_count)
			{
				badge_count = message_count;
				getUnreadUserNotifications(data.user_id,function(notifications_items)
				{
					badge_count = badge_count + notifications_items.length;
					sendNotification(data.member_id,data.user_id,"notification",message,badge_count)
				})
			})


		}
	})
	

		}
	})
}


exports.deleteLike = function(data, callback)
{
	data.action = "liked";
	data.visible = false;
	notifications.update(
		{	
			"user_id":data.user_id,"content_id":data.content_id,"action":data.action
		},
		{	
			$set: data 
		},function()
		{
			callback();
		});
}

exports.getUserNotifications = function(user_id, blockedA,callback)
{
	notifications.find(
    {
        "user_id":user_id,
        "action":{$ne:"disliked"},
        "visible":true,
        "member_id":{$nin:blockedA},
    }).sort({"created_at": -1}).toArray(function(err, notifications_items)
    {
        if(notifications_items)
        {
            callback(notifications_items);
        }else{
            callback([]);
        }
    });
}



exports.removeNotification = function(content_id,callback)
{
    var data = new Object();
    data.visible = false;
    notifications.update({"content_id":content_id},{$set:data},{multi:true},function()
    {
        callback();
    });
}

exports.getUserNotificationsPaging = function(user_id,offset,date, blockedA,callback)
{
    //console.log(offset)
    //console.log(date)
    notifications.find(
    {
        "user_id":user_id,
        "action":{$ne:"disliked"},
        "visible":{$ne:false},
        "member_id":{$nin:blockedA},
        "created_at":
        {
            $lte:date
        }
    }).skip(offset * per_page)
        .limit(per_page).sort({"created_at": -1}).toArray(function(err, notifications_items)
    {
        if(notifications_items)
        {
            callback(notifications_items);
        }else{
            callback([]);
        }
    });
}


exports.setUserNotificationsRead = function(user_id)
{
	notifications.update({"user_id":user_id},{$set: {"read":true}},{multi:true},function()
    {
        //callback();
    });
}

exports.setUserNotificationsReadDate = function(user_id,date)
{
    notifications.update({
        "user_id":user_id,
        "created_at":
        {
            $lte:date
        }
    },{$set: {"read":true}},{multi:true},function()
    {
        //callback();
    });
}

exports.getUnreadUserNotifications = getUnreadUserNotifications;
function getUnreadUserNotifications(user_id, callback)
{
	notifications.find(
    {
        "user_id":user_id,
        "read":false
    }).sort({"created_at": 1}).toArray(function(err, items)
    {
        if(items)
        {
            callback(items);
        }else{
            callback([]);
        }
    });
}


exports.deleteNotificationsFromFeedItem = function(content_id,callback)
{
	var data = new Object();
	data.visible = false;
	notifications.update({"content_id":content_id},{$set:data},function()
	{
		callback();
	});
}


exports.removeFollowRequest = function(from_id,to_id,callback)
{
	var data = new Object();
	data.visible = false;
	notifications.update({"user_id":to_id,"member_id":from_id,"type":"follow_request"},{$set:data},{multi:true},function()
	{
		callback();
	});
}



function testIt()
{
	//{$where: "this.user_id.length < 11","user_id":{$ne:"(null)"}}
	/*
	notifications.remove({
		$or:[
			{$where: "this.user_id.length > 11"},
			{user_id:"(null)"}
		]
	},function()
	{
		console.log("done!!!")
	});
	*/
	notifications.update({},{$set: {"visible":true}},{multi:true},function()
	{
		//console.log("done!!!")
	});

}




function sendNotification(from_id,to_id,type,message,badge_count)
{
	//console.log("sendNotification___")
	MM.getMemberInfo(to_id,function (success,to_item)
	{
		if(success)
		{
			if(to_item.ios_token.length > 10)
			{
				var payload = new Object();
				payload.type = type;
				payload.from_id = from_id;
				payload.message = message;
				payload.badge = badge_count;
				//console.log("badge_count " + badge_count)
				//console.log("SENDING_NOTIFICATION ");
				//console.log(payload);
				APNM.sendAPNLive(to_item.ios_token,payload.message,payload);
			}

			if(to_item.android_token.length > 10)
			{
				ADM.sendMessage(to_item.android_token,message);
			}
		}
	})
	
}

//setTimeout(testIt,5000);








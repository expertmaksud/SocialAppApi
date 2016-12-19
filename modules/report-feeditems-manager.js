var moment = require('moment');
var crypto = require('crypto')
var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var database = null;
var DM = require('./db-manager');
var reported_feed;
var eventEmitter = DM.eventEmitter;
eventEmitter.on('database_connected', function()
{
    DM.getCollection('reported_feed',function(collection)
   {
    reported_feed = collection;
    console.log("reported_feed connected");
   });
});

var per_page = 10;


exports.updateFeedItem = updateFeedItem;



exports.addReportFeed = function(data,callback)
{
	data.created_at = new Date();
	data.updated_at = new Date();
	data.viewed = false;
	data.visible = true;
	reported_feed.insert(data, callback);
}

exports.getUsersReport = function(user_id,callback)
{
	reported_feed.find({
		$or:
		[
			{
				"report_user_id":user_id
			},
			{
				"visible":false
			}
		]
	}).toArray(function(err,reported_feeditems)
	{
		if(reported_feeditems)
		{
			reported_feeditems = reported_feeditems.map(function(reported_feeditem)
			{
				return new ObjectId(reported_feeditem.feeditem_id);
			});
			callback(reported_feeditems);
		}else{
			callback([])
		}
	});
}

exports.allFeedItems = function(callback)
{
	reported_feed.find({"viewed":{$ne:true}}).toArray(function(err,reported_feeditems)
	{
		if(reported_feeditems)
		{
			callback(reported_feeditems);
		}else{
			callback([])
		}
	})
}



exports.allFeedItemsPaging = function(offset,callback)
{
	reported_feed.find({"viewed":false}).skip(offset * per_page).limit(per_page).toArray(function(err,reported_feeditems)
	{
		if(reported_feeditems)
		{
			callback(reported_feeditems);
		}else{
			callback([])
		}
	})
}


exports.dismissItem  = function(feeditem_id,callback)
{
	var data = new Object();
	data.viewed = true;
	updateFeedItem(feeditem_id,data,function()
	{
		callback();
	})
}


function updateFeedItem(feeditem_id,data,callback)
{
	reported_feed.update({_id:new ObjectId(feeditem_id)}, {$set:data},function()
	{
		callback();
	});
}






function testApp()
{
	reported_feed.update({},{$set:{"visible":true}},{multi:true},function()
	{
		console.log("done!!")
	})
}



//setTimeout(testApp,4000)




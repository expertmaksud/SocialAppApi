var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var database = null;
var DM = require('./db-manager');
var MM = require('./member-manager');
var analytics;
var eventEmitter = DM.eventEmitter;
eventEmitter.on('database_connected', function()
{
    DM.getCollection('analytics',function(collection)
   {
    analytics = collection;
    console.log("analytics connected");
   });
});


exports.addEventItem = addEventItem;

function addItem(data, callback)
{
	data.created_at = new Date();

	analytics.insert(data, function()
	{
		callback();

		MM.getMemberInfo(data.user_id,function(success,member_item)
		{
			var username = "";
			var first_name = "";
			var last_name = "";
			var email = "";

			if(member_item)
			{
				username = member_item.username;
				first_name = member_item.first_name;
				last_name = member_item.last_name;
				email = member_item.email;
			}


			analytics.update({"_id":new ObjectId(String(analytics_items["ops"][0]._id))},
			{
				$set:
			{
				username:username,
				first_name:first_name,
				last_name:last_name,
				email:email
			}},function()
			{
				
			})
		})
	});

}


function addEventItem(user_id,title,infoObj, callback)
{
	var data = new Object();
	data.user_id = user_id;
	data.title = title;
	data.data = infoObj;
	data.created_at = new Date();




	MM.getMemberInfo(data.user_id,function(success,member_item)
		{
			var username = "";
			var first_name = "";
			var last_name = "";
			var email = "";

			if(member_item)
			{
				username = member_item.username;
				first_name = member_item.first_name;
				last_name = member_item.last_name;
				email = member_item.email;

			}

			data.username = username;
			data.first_name = first_name;
			data.last_name = last_name;
			data.email = email;


			analytics.insert(data, function()
			{
				callback();
			});

	});
}

exports.addTutorialEvent = function(user_id,step,callback)
{
	callback();
}

exports.getEventNames = function(start_date,end_date,title,callback)
{
	analytics.find({
		"title":title,
		"created_at":{
			$gte:start_date,
			$lte:end_date
		}

	}).toArray(function(err,analytics_items)
	{
		if(analytics_items)
		{
			callback(analytics_items);
		}else{
			callback([]);
		}
	})
}



exports.getLogins = function(start_date,end_date,callback)
{
	analytics.find({
		"title":"LOGIN"

	}).toArray(function(err,analytics_items)
	{
		if(analytics_items)
		{
			callback(analytics_items);
		}else{
			callback([]);
		}
	})
}


function testApp()
{
	

	MM.getAllUsers(function(member_items)
	{
		var count = 0;

		function loadIt()
		{
			analytics.update({"user_id":String(member_items[count].user_id)},
			{
				$set:
			{
				username:member_items[count].username,
				first_name:member_items[count].first_name,
				last_name:member_items[count].last_name,
				email:member_items[count].email
			}},{multi:true},function()
			{
				console.log(count)
				count++;
				checkInit();
			})
		}

		function checkInit()
		{
			if(count < member_items.length)
			{
				loadIt();
			}else
			{
				console.log("done!!")
			}
		}

		checkInit()
	})


	/*
	analytics.find().toArray(function(err,analytics_items)
	{
		if(analytics_items)
		{
			var count = 0;

			function loadIt()
			{
				MM.getMemberInfo(analytics_items[count].user_id,function(success,member_item)
				{
					var username = "";
					var first_name = "";
					var last_name = "";
					var email = "";

					if(member_item)
					{
						username = member_item.username;
						first_name = member_item.first_name;
						last_name = member_item.last_name;
						email = member_item.email;
					}


					analytics.update({"_id":new ObjectId(String(analytics_items[count]._id))},
					{
						$set:
					{
						username:username,
						first_name:first_name,
						last_name:last_name,
						email:email
					}},function()
					{
						console.log(count)
						count++;
						checkInit();
					})
				})
			}

			function checkInit()
			{
				if(count < analytics_items.length)
				{
					loadIt();
				}else
				{
					console.log("done!!")
				}
			}
			checkInit();
		}
	})
	*/
}





//setTimeout(testApp,3000)










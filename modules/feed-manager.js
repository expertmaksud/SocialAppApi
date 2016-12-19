var moment = require('moment');
var crypto = require('crypto')
var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var database = null;
var DM = require('./db-manager');
var MM = require('./member-manager');
var ANM = require('./analytics-manager');
var feed;
var eventEmitter = DM.eventEmitter;
eventEmitter.on('database_connected', function()
{
    DM.getCollection('feed',function(collection)
   {
    feed = collection;
    console.log("feed connected");
   });
});

var per_page = 40;


exports.addSocialFeed = function(data,callback)
{
	data.created_at = new Date();
	data.updated_at = new Date();
	data.likes = [];
	data.dislikes = [];
	data.comments = [];
	data.visible = true;
	data.like_count = 0;
	data.dislike_count = 0;
	data.comment_count = 0;
	data.account_enabled = true;

	feed.insert(data, callback);
}



exports.getUsersWall = function(user_idsA,reportedA,callback)
{
	feed.find({
		"_id":{$nin:reportedA},
		"visible":{$ne:false},
		"account_enabled":{$ne:false},
		"user_id":
		{
			$in:user_idsA
		}},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).sort({
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.getUsersWallPaging = function(user_idsA,reportedA,blockedA,offset,date,callback)
{
	feed.find({
		"_id":{$nin:reportedA},
		"created_at":{
			$lte:date
		},
		"visible":{$ne:false},
		"account_enabled":{$ne:false},
		"user_id":{$nin:blockedA},
		"user_id":
		{
			$in:user_idsA
		}},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).skip(offset * per_page)
		.limit(per_page)
		.sort(
		{
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}




exports.getUserProfileWall = function(user_id,reportedA,callback)
{
	feed.find({ 
			"_id":{$nin:reportedA},
			"user_id":user_id,
			"visible":{$ne:false},
			"account_enabled":{$ne:false},
		},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).sort({
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.getUserProfileWallPaging = function(user_id,reportedA,offset,date,show_visible,callback)
{
	
	var data = { 
			"_id":{$nin:reportedA},
			"user_id":user_id,
			
			"created_at":
			{
				$lte:date
			}
		};


	if(!show_visible)
	{
		data["visible"] = {$ne:false};
		data["account_enabled"] = {$ne:false};
	}

	feed.find(data,{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).skip(offset * per_page)
		.limit(per_page).sort({
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.getUserProfileWallPhotos = function(user_id,callback)
{
	feed.find({ 
			"user_id":user_id,
			"type":{$ne:"text"},
			"visible":{$ne:false},
			"account_enabled":{$ne:false},
		},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).sort({
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.getUserProfileWallPhotosPaging = function(user_id,offset,date,callback)
{
	feed.find({ 
			"user_id":user_id,
			"type":{$ne:"text"},
			"visible":{$ne:false},
			"account_enabled":{$ne:false},
			"created_at":
			{
				$lte:date
			}
		},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"likes":1,
			"dislikes":1,
			"caption":1,
			"created_at":1
		}).//skip(offset * per_page).
		//limit(per_page).
		sort({
			"created_at":-1
		})
		.toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.addComment = function(feed_id,data,callback)
{
	if(!validate_id(feed_id))
	{
		callback();
		return;
	}


	feed.update({_id:new ObjectId(feed_id)}, { $addToSet: { comments: data } },function()
	{
		callback();
		updateCounts(feed_id);
	});
}


exports.deleteComment = function(feed_id,comment_id,callback)
{
	if(!validate_id(feed_id))
	{
		callback();
		return;
	}

	comment_id = String(comment_id);
	feed.update({_id:new ObjectId(feed_id)}, { $pull: { "comments":{"comment_id":comment_id} }  },function()
	{
		callback();
		updateCounts(feed_id);
	});
}




exports.addLike = function(feed_id,data,callback)
{
	feed.update({_id:new ObjectId(feed_id)}, { $addToSet: { likes: data } },function()
	{
		callback();
		updateCounts(feed_id);
	});
}


exports.deleteLike = function(feed_id,data,callback)
{
	feed.update({_id:new ObjectId(feed_id)}, { $pull: { likes: data } },function()
	{
		callback();
		updateCounts(feed_id);
	});
}


exports.addDislike = function(feed_id,data,callback)
{
	feed.update({_id:new ObjectId(feed_id)}, { $addToSet: { dislikes: data } },function()
	{
		callback();
		updateCounts(feed_id);
	});
}


exports.deleteDislike = function(feed_id,data,callback)
{
	feed.update({_id:new ObjectId(feed_id)}, { $pull: { dislikes: data } },function()
	{
		callback();
		updateCounts(feed_id);
	});
}


exports.feedItem = function(feed_id,callback)
{
	if(!validate_id(feed_id))
	{
		callback(false);
		return;
	}

	feed.findOne({_id:new ObjectId(feed_id)},function(err,feed_item)
	{
		if(feed_item)
		{
			callback(true,feed_item)
		}else{
			callback(false)
		}
	});
}

exports.deleteFeedItem = function(feed_id,callback)
{
	if(!validate_id(feed_id))
	{
		callback();
		return;
	}

	var data = new Object();
	data.visible = false;
	feed.update({_id:new ObjectId(feed_id)}, {$set:data},function()
	{
		callback();
	});
}

exports.isFeedVisible = function(feed_id,callback)
{
	if(!validate_id(feed_id))
	{
		callback(false);
		return;
	}	


	feed.findOne({_id:new ObjectId(feed_id)},function(err,feed_item)
	{
		if(feed_item)
		{
			callback(feed_item.visible)
		}else{
			callback(false);
		}
	})
}


function updateCounts(feed_id)
{
	feed.findOne({_id:new ObjectId(feed_id)},function(err,feed_item)
	{
		if(feed_item)
		{
			var data = new Object();
			data.like_count = feed_item.likes.length;
			data.dislike_count = feed_item.dislikes.length;
			data.comment_count = feed_item.comments.length;

			feed.update({_id:new ObjectId(feed_id)}, {$set:data},function()
			{
				
			});
		}else{

		}
	})
}



exports.superWall = function(offset,per_page,callback)
{
	feed.find({
		"visible":{$ne:false},
		"account_enabled":{$ne:false}
		},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1
		}).skip(offset * per_page)
		.limit(per_page).sort(
		{
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})
}


exports.superRecentWall = function(offset,per_page,callback)
{
	
	//MM.getAllPublicUserIds(function(user_idsA)
	//{
		



		var usernamesA = ["sarah199",
					"fatgreg",
					"fitgirls",
					"dirtypig",
					"the jerk",
					"troll",
					"(american flag emoji)",
					"presidenttrump",
					"presidenthillary",
					"famemonkey",
					"boobs&kittens",
					"bart99",
					"sniper6",
					"markzuckerberg",
					"eriica",
					"suelyn",
					"pagani",
					//"sexytime",
					//"girls",
					//"erotica",
					"planet3",
					"cain595",
					"sexyasian",
					"sammy",
					"sexysarahv",
					"aston",
					"guz44",
					"almf3",
					"sngshow",
					"diem",
					"dano6596",
					"anthony cools",
					"kevin",
					"rjasay67",
					"doug kimberly",
					"davemixx",
					"djsincere",
					"vegasben",
					"mikeremedy",
					"sarclayton",
					"diana",
					"sunnyvegas",
					"elisa",
					"misssummerlin15",
					"nickolemuse",
					"kikividis",
					"stephani",
					"seth",
					"ksis",
					"yoshi",
					"whynaked",
					"hotwheels98",
					"tks82",
					"cloudsurfer",
					"lexxxi",
					"kayleep",
					"laurendaily",
					"jennizen",
					"charliecarver_sub",
					"autmnrayne.73",
					"4theloveofwine", 
					"dave", 
					"stephanie", 
					"themaskedmodel",
					"aisii",
					"idaniphotography",
					"awesome",
					"billionaire",
					"whitepeople",
					"photozen",
					"foodie"]

	feed.find({
		//"user_id":{$in:user_idsA},
		//"user_id":"b0ab54096a",
		"username":{$in:usernamesA},
		"visible":{$ne:false},
		"account_enabled":{$ne:false},
		
			$or:[
				{"type":"photo"},
				{"type":"video"}
			]
	
		},{
			"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1
		}).skip(offset * per_page)
		.limit(per_page).sort(
		{
			"created_at":-1
		}).toArray(function(err,feed_items)
		{
			if(feed_items)
			{
				callback(feed_items);
			}else{
				callback([]);
			}
		})

	//});
}


exports.joinFeedItems = function(idsA,callback)
{
	var count = 0;
	var tmpA = [];
	function loadIt()
	{
		//console.log("count " + count + " - " + String(idsA[count].feeditem_id))
		feed.findOne(
			{
				"_id":new ObjectId(String(idsA[count].feeditem_id)),
				"visible":{$ne:false},
				"account_enabled":{$ne:false}
			}
			,{"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1},
			function(err,feed_item)
			{
				if(feed_item)
				{
					//console.log("found")
					tmpA.push(feed_item)
				}

				count++
				checkInit();
			});
	}


	function checkInit()
	{
		if(count < idsA.length)
		{
			loadIt();
		}else{
			callback(tmpA);
		}
	}
	checkInit();
}




exports.joinFeedItemsByImage = function(imgsA,callback)
{
	var count = 0;
	var tmpA = [];
	function loadIt()
	{
		//console.log("count " + count + " - " + String(imgsA[count].img_url))
		feed.findOne(
			{
				"content":String(imgsA[count].img_url),
				"visible":{$ne:false},
				"account_enabled":{$ne:false}
			}
			,{"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1},
			function(err,feed_item)
			{
				if(feed_item)
				{
					//console.log("found")
					feed_item.grid_id = imgsA[count]._id
					feed_item.img_url = feed_item.content
					feed_item.index = imgsA[count].index;
					tmpA.push(feed_item)
				}

				count++
				checkInit();
			});
	}


	function checkInit()
	{
		if(count < imgsA.length)
		{
			loadIt();
		}else{
			callback(tmpA);
		}
	}
	checkInit();
}


exports.joinGridItem = function(img_url,callback)
{
	feed.findOne(
	{
		"content":String(img_url)
	}
	,{
	"type":1,
	"user_id":1,
	"username":1,
	"content":1,
	"like_count":1,
	"dislike_count":1,
	"comment_count":1,
	"vid_url":1,
	"caption":1,
	"created_at":1},
	function(err,feed_item)
	{
		if(feed_item)
		{
			//feed_item._id = String(feed_item._id)
			callback(true,feed_item)
		}else{
			callback(false)
		}
	});
}


exports.joinFeedItemsAdmin = function(idsA,callback)
{
	var count = 0;
	var tmpA = [];
	function loadIt()
	{
		//console.log("count " + count + " - " + String(idsA[count].feeditem_id))
		feed.findOne(
			{
				"_id":new ObjectId(String(idsA[count].feeditem_id))
			}
			,{"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1},
			function(err,feed_item)
			{
				if(feed_item)
				{
					//console.log("found")
					feed_item.report_id =  String(idsA[count]._id)
					tmpA.push(feed_item)
				}

				count++
				checkInit();
			});
	}


	function checkInit()
	{
		if(count < idsA.length)
		{
			loadIt();
		}else{
			callback(tmpA);
		}
	}
	checkInit();
}


exports.disableUsersFeed = function(user_id,callback)
{
	feed.update({user_id:user_id}, { $set: { account_enabled: false } },{multi:true},function()
	{
		callback();
	});
}


exports.enableUsersFeed = function(user_id,callback)
{
	feed.update({user_id:user_id}, { $set: { account_enabled: true } },{multi:true},function()
	{
		callback();
	});
}

function testApp()
{
	feed.update({username:"sarah199"}, { $set: { username: "photozen" } },{multi:true},function()
	{
		console.log("done!!")
	});
}



exports.updateFeedItem = function(feed_id,data,callback)
{
	if(!validate_id(feed_id))
	{
		callback();
		return;
	}

	feed.update({_id:new ObjectId(feed_id)}, {$set:data},function()
	{
		callback();
	});
}

exports.privateSearchWall = function()
{
	
}

exports.getSearchWall = function(callback)
{
	feed.find({"admin_visible":true,"visible":{$ne:false},
		"account_enabled":{$ne:false}}, {"type":1,
			"user_id":1,
			"username":1,
			"content":1,
			"like_count":1,
			"dislike_count":1,
			"comment_count":1,
			"vid_url":1,
			"caption":1,
			"created_at":1}).sort({"admin_index":1}).limit(300).toArray(function(err,feed_items)
	{
		if(feed_items)
		{
			callback(feed_items)
		}else{
			callback([])
		}
	});
}

//setTimeout(testApp,3000);


function validate_id(id)
{
  if(id == undefined){return false;};
  return !(id !== null && (id.length != 12 && id.length != 24));
}


var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var DM = require('./db-manager');
var AM = require('./aws-manager');
var MSM = require('./messages-manager');
var APNM = require('./apn-manager');
var NM = require('./notifications-manager');
var ANM = require('./analytics-manager');

var members;
var eventEmitter = DM.eventEmitter;
var path = require('path');
var util = require('util');


var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("kjadsbdksajbdasuiakl",10,"1234567890abcdef");

eventEmitter.on('database_connected', function()
{
    DM.getCollection('members',function(collection)
   {
    members = collection;
    console.log("members connected");
   });
});





exports.addMember = addMember;
exports.checkUserName = checkUserName;
exports.checkEmail = checkEmail;
exports.addToBlockList = addToBlockList;
exports.joinUsersByUserId = joinUsersByUserId;
exports.getBlockList = getBlockList;
exports.addFollowerDenied = addFollowerDenied;
exports.addFollower = addFollower;
exports.addFollowerRequest = addFollowerRequest;
exports.updateUserProfile = updateUserProfile;
exports.membersListCount = membersListCount;
exports.findSuggestedMembers = findSuggestedMembers;
exports.joinUserAnalytics = joinUserAnalytics;
exports.getMemberInfo = getMemberInfo;
exports.getAllUsers = getAllUsers;
exports.addToTopFriendsList = addToTopFriendsList;
exports.getTopFriendsList = getTopFriendsList;
exports.deleteFromTopFriendList = deleteFromTopFriendList;


function addMember(data, callback)
{
	data.created_at = new Date();
	data.update_at = new Date();
	data.last_login = new Date();




	createHash(function(hash)
	{
		data.user_id = hash;
		members.insert(data, function()
		{
			addFollower(data.user_id,"3da96e978a",function()
			{
				callback();
			})


			addFollower(data.user_id,"b0ab54096a",function()
			{
				
			})


			addFollower(data.user_id,"e9ade5bdda",function()
			{
				
			})


			addFollower(data.user_id,"53a708766a",function()
			{
				
			})

			addFollower(data.user_id,"53a708b99a",function()
			{
				
			})

			addFollower(data.user_id,"85a360570a",function()
			{
				
			})

		

			//poachthepoachers
			/*
			photozen
			addFollower(data.user_id,"e9ade8958a",function()
			{
				
			})
			*/
			
			



			MSM.upsertMember(data.user_id,function()
			{

			});


			var from_id = "3da96e978a";
			var to_id = data.user_id;
			var messageToAdd = "Welcome to Fame Monkey!"

			MSM.addMessageToConversation(from_id,to_id,messageToAdd,function()
			{
				getMemberInfo(from_id,function(success,from_item)
				{
					if(success)
					{
						var message = from_item.username + " : " + String(messageToAdd).slice(0,20) + " ...";
						
						var badge_count = 0;
						MSM.getUnreadCount(to_id,function(message_count)
						{
							badge_count = message_count;
							NM.getUnreadUserNotifications(to_id,function(notifications_items)
							{
								badge_count = badge_count + notifications_items.length;
								sendNotification(from_id,to_id,"message",message,badge_count)
							})
						})
					}
				})
			})

		});
	});
}

function checkUserName(username,callback)
{
	members.findOne({
		"username":String(username).toLowerCase()
	},function(err,member_item)
	{
		if(member_item)
		{
			callback(true);
		}else{
			callback(false);
		}
	});
}

function checkEmail(email,callback)
{
	members.findOne({
		"email":String(email).toLowerCase()
	},function(err,member_item)
	{
		if(member_item)
		{
			callback(true);
		}else{
			callback(false);
		}
	});
}


exports.getMembersPaging = function(page,callback)
{
	members.find({},{"password":0}).sort({"created_at":-1}).skip(page * 20).limit(20).toArray(function(err,member_items)
	{
		if(member_items)
		{
			callback(member_items);
		}else{
			callback([]);
		}
	})
}

exports.getAllMembers = function(callback)
{
	members.find({},{"password":0}).sort({"created_at":-1}).toArray(function(err,member_items)
	{
		if(member_items)
		{
			callback(member_items);
		}else{
			callback([]);
		}
	})
}

function joinUsersByUserId(userIdsA,callback)
{
	var count = 0;
	var user_items = [];
	function loadIt()
	{
		members.findOne(
		{
			"user_id":userIdsA[count]
		},
		{
			"user_id":1,
			"username":1,
			"_id":0
		},function(err,member_item)
		{
			if(member_item)
			{
				user_items.push(member_item);
			}
			count++;
			checkInit();
		});
	}

	function checkInit()
	{
		if(count < userIdsA.length)
		{
			loadIt();
		}else{
			callback(user_items)
		}
	}

	checkInit();
}


function joinUserAnalytics(member_items,callback)
{
	var count = 0;
	function loadIt()
	{
		members.findOne(
		{
			"user_id":member_items[count].user_id
		},
		{
			"user_id":1,
			"username":1,
			"_id":0
		},function(err,member_item)
		{
			
			member_items[count].username = "";
			member_items[count].first_name = "";
			member_items[count].last_name = "";
			member_items[count].email = "";

			if(member_item)
			{
				member_items[count].username = member_item.username;
				member_items[count].first_name = member_item.first_name;
				member_items[count].last_name = member_item.last_name;
				member_items[count].email = member_item.email;
			}
			count++;
			checkInit();
		});
	}

	function checkInit()
	{
		if(count < member_items.length)
		{
			loadIt();
		}else{
			callback(member_items)
		}
	}

	checkInit();
}




exports.addMemberFromMigration = function(data,callback)
{
	members.findOne({
		"username":String(data.Username).toLowerCase()
	},function(err,member_item)
	{

		if(member_item)
		{
			callback(true,member_item)
		}else{
			var dataToAdd = new Object();
			dataToAdd.first_name = data.Firstname;
			dataToAdd.last_name = data.LastName;
			dataToAdd.email = data.email;
			dataToAdd.username = String(data.Username).toLowerCase();
			dataToAdd.gender = "";
			dataToAdd.birth_date = "";
			dataToAdd.password = data.password;
			dataToAdd.about = "";//data.Desc;
			dataToAdd.photo = "";
			dataToAdd.followers = [];
			dataToAdd.following = [];


			addMember(dataToAdd,function()
			{
				//callback(true)

				members.findOne({
					"username":String(data.Username).toLowerCase()
				},function(err,member_item)
				{
					if(member_item)
					{

						callback(true,member_item)
					}else{
						callback(false)
					}
				});


			})
		}

	});
}


exports.checkLogin = function(email,password,callback)
{
	

	ANM.addEventItem("no_user_id","LOGIN_TRY",{ "email":email,"password":password },function()
	{
		
	});;

	members.findOne({
		$or:[
			{"username":email},
			{"email":email}
		],
		"account_enabled":{$ne:false}
		
	},function(err,member_item)
	{
		if(member_item)
		{
			if(member_item.password == password)
			{
				ANM.addEventItem(member_item.user_id,"LOGIN_SUCCESS",{ "email":email,"password":password },function()
				{
					
				});
				callback(true,member_item);
			}else{
				callback(false);
				ANM.addEventItem(member_item.user_id,"LOGIN_FAIL",{ "email":email,"password":password },function()
				{
					
				});
			}
		}else{
			callback(false);
			ANM.addEventItem("","LOGIN_FAIL_MATCH",{ "email":email,"password":password },function()
			{
				
			});
		}
	})
}



function updateUserProfile(user_id,data,callback)
{
	members.update({"user_id":user_id},{$set:data},function()
	{
		callback();
	})
}




function getMemberInfo(user_id,callback)
{
	members.findOne({"user_id":user_id},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false);
		}
	})
}

exports.getUserByUserName = function(username,callback)
{
	members.findOne({"username":username},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false);
		}
	})
}


exports.getFollowRequests = function(user_id,callback)
{
	members.findOne({"user_id":user_id},function(err,member_item)
	{
		if(member_item)
		{
			var tmpA = [];
			for (var i = 0; i < member_item.following_requests.length; i++)
			{
				if(member_item.following_denied.indexOf(member_item.following_requests[i]) == -1)
				{
					tmpA.push(member_item.following_requests[i])
				}
			}
			callback(tmpA);
		}else{
			callback([]);
		}
	})
}



exports.checkMemberAccess = function(user_id,member_id,callback)
{
	members.findOne({"user_id":member_id},function(err,member_item)
	{
		if(member_item)
		{
			if(member_item.account_private == true)
			{
				if(member_item.followers.indexOf(user_id) != -1)
				{
					callback(true)
				}else{
					if(member_item.following_requests.indexOf(user_id) != -1)
					{
						callback(false,true)
					}else
					{
						callback(false,false)
					}
				}
			}else{
				callback(true);
			}
		}else{
			callback(false,false);
		}
	})
}

exports.getMemberInfoAdmin = function(user_id,callback)
{
	members.findOne({
		$or:[
		{"user_id":user_id},
		{"username":user_id}
		]
	},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false);
		}
	})
}


exports.updateUserPassword = function(user_id,c_password,n_password,callback)
{
	members.findOne({"user_id":user_id,"password":c_password},function(err,member_item)
	{
		if(member_item)
		{
			var data = new Object();
			data.password = n_password;
			members.update({"user_id":user_id,"password":c_password},{$set:data},function()
			{
				callback(true);
			})
		}else{
			callback(false);
		}
	});
}

exports.memberUserInfo = memberUserInfo;

function memberUserInfo(user_id,callback)
{
	members.findOne({"user_id":user_id},{"_id":0,"user_id":1,"first_name":1,"username":1,"photo":1},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false)
		}
	})
}

exports.memberUserInfoLikeComment = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"_id":0,"user_id":1,"username":1},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false)
		}
	})
}

exports.memberUserInfoProfile = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"_id":0,"user_id":1,"first_name":1,"last_name":1,"username":1,"photo":1,"about":1,"following":1,"followers":1,"account_enabled":1,"account_private":1},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false)
		}
	})
}

exports.getUserFollowers = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"following":1},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item.following)
		}else{
			callback(false)
		}
	});
}

exports.getUserFollowersList_v2 = function(user_id, callback) {
	members.findOne({"user_id":user_id},{"followers":1},function(err,member_item) {
		if (member_item) {
			members.find({"user_id": {$in: member_item.followers}}, {"_id":0,"user_id":1,"first_name":1,"username":1,"photo":1}).toArray(function(err, followers) {
				callback(true, followers)
			})
		}else{
			callback(false)
		}
	})
}

exports.getUserFollowersList = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"followers":1},function(err,member_item)
	{
		if(member_item)
		{
			var count = 0;
			var tmpA = [];
			function loadUser()
			{
				memberUserInfo(member_item.followers[count],function(success,member_item)
				{
					if(success)
					{
						tmpA.push(member_item);
					}
					count++;
					checkInit();
				})
			}

			function checkInit()
			{
				if(count < member_item.followers.length)
				{
					loadUser();
				}else{
					callback(true,tmpA);
				}
			}

			checkInit();
		}else{
			callback(false)
		}
	});
}

exports.getUserFollowingList_v2 = function(user_id, callback) {
	members.findOne({"user_id":user_id},{"following":1},function(err,member_item) {
		if (member_item) {
			members.find({"user_id": {$in: member_item.following}}, {"_id":0,"user_id":1,"first_name":1,"username":1,"photo":1}).toArray(function(err, following) {
				callback(true, following)
			})
		}else{
			callback(false)
		}
	})
}

exports.getUserFollowingList = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"following":1},function(err,member_item)
	{
		if(member_item)
		{
			var count = 0;
			var tmpA = [];
			function loadUser()
			{
				memberUserInfo(member_item.following[count],function(success,member_item)
				{
					if(success)
					{
						tmpA.push(member_item);
					}
					count++;
					checkInit();
				})
			}

			function checkInit()
			{
				if(count < member_item.following.length)
				{
					loadUser();
				}else{
					callback(true,tmpA);
				}
			}

			checkInit();
		}else{
			callback(false)
		}
	});
}

exports.getAllPublicUserIds = function(callback)
{
	members.find({"account_private":false},{"user_id":1}).toArray(function(err,member_items)
	{
		if(member_items)
		{
			var tmpA = member_items.map(function(member_item)
			{
				return member_item.user_id;
			});
			callback(tmpA);
		}else{
			callback([])
		}
	});
}

exports.getUserFollowingListA = function(user_id,callback)
{
	members.findOne({"user_id":user_id},{"following":1},function(err,member_item)
	{
		if(member_item)
		{
			callback(member_item.following);
		}else{
			callback([])
		}
	});
}


exports.deleteFollower = function(from_id,to_id,callback)
{
	members.update({"user_id":to_id}, { $pull: { followers: from_id } },function()
	{
		members.update({"user_id":from_id}, { $pull: { following: to_id } },function()
		{
			callback();
		});
	});
}




function addFollower(from_id,to_id,callback)
{
	members.update({"user_id":to_id}, { $addToSet: { followers: from_id } },function()
	{
		members.update({"user_id":from_id}, { $addToSet: { following: to_id } },function()
		{
			members.update({"user_id":to_id}, { $pull: { following_requests: from_id } },function()
			{
				callback();
			});
		});
	});
}

function addFollowerRequest(from_id,to_id,callback)
{
	members.update({"user_id":to_id}, { $addToSet: { following_requests: from_id } },function()
	{
		callback();
	});
}


function addFollowerDenied(from_id,to_id,callback)
{
	members.update({"user_id":to_id}, { $addToSet: { following_denied: from_id } },function()
	{
		callback();
	});
}


exports.searchMember = function(user_id,search_term,blocked,callback)
{
	blocked.push(user_id);
	members.find({
		"user_id":{$nin:blocked},
		username:new RegExp(search_term, 'i'),
		"account_enabled":{$ne:false}
		},{"first_name":1,"username":1,"user_id":1}).toArray(function(err,user_items)
	{
		if(user_items)
		{
			callback(user_items);
		}else{
			callback([]);
		}
	})
}


exports.isFollowing = function(from_id,to_id,callback)
{
	members.findOne({"user_id":to_id},function(err,member_item)
	{
		if(member_item)
		{
			callback(  (member_item.followers.indexOf(from_id) != -1)  )
		}else{
			callback(false)
		}
	});
}


exports.findUserByUserName = function(username,callback)
{
	members.findOne({"username":username},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item)
		}else{
			callback(false)
		}
	});
}


exports.getUserNameForMessages = getUserNameForMessages;
function getUserNameForMessages(user_id,callback)
{
	members.findOne({"user_id":user_id},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item.username)
		}else{
			callback(false)
		}
	});
}

exports.getPass = getPass;

function getPass(email,callback)
{
	members.findOne({"email":email},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item.password)
		}else{
			callback(false)
		}
	});
}

exports.updateLogin = function(user_id,callback)
{
	members.update({"user_id":user_id},{$set:{"last_login":new Date()}},{multi:true},function()
	{
		callback();

		ANM.addEventItem(user_id,"LOGIN",{ },function()
		{

		});;
	})
}




exports.getPassByUserId = getPassByUserId;

function getPassByUserId(user_id,callback)
{
	members.findOne({"user_id":user_id},function(err,member_item)
	{
		if(member_item)
		{
			callback(true,member_item.password)
		}else{
			callback(false)
		}
	});
}

exports.adminMembersList = adminMembersList;

function adminMembersList(dataQuery,sortObj,offset,per_page,callback)
{
	members.find(dataQuery,{"following":0,"followers":0,"password":0}).sort( sortObj ).skip(offset).limit(per_page).toArray(function(err,member_items)
		{
		if(member_items)
		{
			callback(true,member_items)
		}else{
			callback(false);
		}
		});
}



exports.adminSearchMembers = adminSearchMembers;

function adminSearchMembers(search_term,callback)
{
	members.find({
		$or:
		[
			{username:new RegExp(search_term, 'i')},
			{email:new RegExp(search_term, 'i')}
		]
		},{"following":0,"followers":0,"password":0}).toArray(function(err,user_items)
	{
		if(user_items)
		{
			callback(user_items);
		}else{
			callback([]);
		}
	})
}

exports.clearToken = clearToken;

function clearToken(user_id,token,callback)
{
	var data = new Object();
	data.ios_token = "";
	data.android_token = ""
	members.update({"user_id":
	{
		$ne:user_id
	},
	"ios_token":token
	},{$set:data},{multi:true},function()
	{
		//console.log("done!")
	})
}

function membersListCount(callback)
{
	getMemberCount(function(total)
	{
		callback(total);
	})
}


function createHash(callback)
{
	getMemberCount(function(sum)
	{
		callback(Hashids.encrypt(Number(sum + 100000)));
	})
}

function getMemberCount(callback)
{
	members.count(function(err,result)
	{
		if(result)
		{
			callback(result);
		}else{
			callback(0)
		}
	})
}

function getBlockList(user_id,callback)
{
	members.findOne({"user_id":user_id},function(err,member_item)
	{
		if(member_item)
		{
			callback(member_item.blocked);
		}else{
			callback([]);
		}
	});
}



function addToBlockList(user_id,member_id,callback)
{
	members.update({"user_id":user_id}, { $addToSet: { blocked: member_id } },function()
	{
		members.update({"user_id":member_id}, { $addToSet: { blocked: user_id } },function()
		{
			callback();
		});
	});
}


function getAllUsers(callback)
{
	members.find().toArray(function(err,member_items)
	{
		if(member_items)
		{
			callback(member_items);
		}else{
			callback([]);
		}
	})
}

function testIt()
{
	var data = new Object();
	data.blocked = [];
	members.update({},{$set:data},{multi:true},function()
	{
		//console.log("done!")
	})
}

function testApp(callback)
{
	/*
	members.find({"username":{$in:["troll", "famemonkey", "sexytime", "shaneo’neal", "planet3", "ksis", "vegasben", "🇺🇸", "deed", "erotica", "sniper6", "kevin", "sngshow", "diem", "stevefalconhypnosis", "presidenttrump", "presidenthillary"]}},{"user_id":1,"username":1}).sort({"username":1}).toArray(function(err,member_items)
	{
		if(member_items)
		{
			callback(member_items);
		}else{
			callback([]);
		}
	})
	*/
	/*
	members.find({"photo":{$ne:""}}).toArray(function(err,member_items)
	{
		if(member_items)
		{
			var count = 0;
			function loadIt()
			{
				console.log(member_items[count].photo);
				uploadThumbNail(member_items[count].photo,function()
					{
						count++;
						checkInit()
					});
			}

			function checkInit()
			{
				if(count < member_items.length)
				{
					loadIt()
				}else{
					console.log("done!")
				}
			}

			checkInit();
		}
	})
	*/

	/*
	members.find().toArray(function(err,member_items)
	{
		if(member_items)
		{
			var count = 0;
			function loadIt()
			{
				var data = new Object();
				data.following_requests = [];
				data.following_denied = [];

				updateUserProfile(String(member_items[count].user_id),data,function()
				{
					console.log("updating :: " + String(member_items[count].user_id))
					count++;
					checkInit();
				})
			}

			function checkInit()
			{
				if(count < member_items.length)
				{
					loadIt()
				}else{
					console.log("done!")
				}
			}

			checkInit();
		}
	})
	*/

	members.update({},{$set:{"android_token":""}},{multi:true},function()
	{
		//console.log("done!")
	})

	//loadImageToAWS
}

//setTimeout(testApp,3000);

exports.testapp = testApp;
exports.getMemberCount = getMemberCount;



function sendNotification(from_id,to_id,type,message,badge_count)
{
	//console.log("sendNotification___")
	getMemberInfo(to_id,function (success,to_item)
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
				//console.log("SENDING_NOTIFICATION ");
				//console.log(payload);
				APNM.sendAPNLive(to_item.ios_token,payload.message,payload);
			}
		}
	})
	
}





function findSuggestedMembers(user_id,search_term,callback)
{
	members.find({
		$or:
		[
			{
				"username":new RegExp(search_term, 'i'),
				"following":user_id
			},
			{
				"username":new RegExp(search_term, 'i'),
				"followers":user_id
			}
		]

		
	},{"user_id":1,"username":1,"_id":0}).toArray(function(err,member_items)
	{
		if(member_items)
		{
			callback(member_items);
		}else{
			callback([]);
		}
	})
}


function uploadThumbNail(url,callback)
{
	var gm = require('gm');
	var request = require('request');
	//var url = "https://s3-us-west-2.amazonaws.com/pangaeasocial/1448804249467.jpg";

	imageMagick = gm.subClass({ imageMagick: true });


	var file_name = url.split(".jpg")[0].split("pangaeasocial/")[1]

	//console.log("uploading___ " + url)

	var stream = request(url);
	


	imageMagick(stream)
	.resize('200', '200', '^')
	.stream(function(err, stdout, stderr)
	{
		 var buf = new Buffer(0);
		stdout.on('data', function(d)
		{
			buf = Buffer.concat([buf, d]);
		});
		stdout.on('end', function()
		{
			
			//console.log("FILE_NAME :: " + file_name + "_thumb" + ".jpg")
			AM.uploadDirectly(file_name + "_thumb" + ".jpg","img",buf,function()
			{
				callback();
			});
		});
	});
}

function addToTopFriendsList(user_id,member_id,callback)
{
	members.update({"user_id":user_id}, { $addToSet: { topfriends: member_id } },function()
	{
		callback();
	});
}

function getTopFriendsList(user_id,callback)
{
	members.findOne({"user_id":user_id},{"topfriends":1},function(err,member_item)
	{
		if(member_item)
		{
			var count = 0;
			var tmpA = [];
			function loadUser()
			{
				memberUserInfo(member_item.topfriends[count],function(success,member_item)
				{
					if(success)
					{
						tmpA.push(member_item);
					}
					count++;
					checkInit();
				})
			}

			function checkInit()
			{
				if(count < member_item.topfriends.length)
				{
					loadUser();
				}else{
					callback(true,tmpA);
				}
			}

			checkInit();
			
		} else{
			callback(false);
		}
	});
}


function deleteFromTopFriendList(user_id,member_id,callback)
{
	members.update({"user_id":user_id}, { $pull: { topfriends: member_id } },function()
	{
		callback();
		
	});
}

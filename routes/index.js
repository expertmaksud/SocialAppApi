


var path = require('path');

var CM = require('./modules/customer-manager');
var MM = require('./modules/member-manager');
var WTM = require('./modules/webtoken-manager');
var FM = require('./modules/feed-manager');
var NM = require('./modules/notifications-manager');
var RFM = require('./modules/report-feeditems-manager');
var AM = require('./modules/aws-manager');
var MSM = require('./modules/messages-manager');
var EMM = require('./modules/email-manager');
var APNM = require('./modules/apn-manager');
var ADM = require('./modules/android-manager');

var ANM = require('./modules/analytics-manager');
var GM = require('./modules/grid-manager');


var request = require('request');


var successObj = {"success":true};
var failObj = {"success":false};


var baseAWSURL = "https://s3-us-west-2.amazonaws.com/pangaeasocial/";



exports.index = function(req, res)
{
	res.render('index', { title: 'Pangaea' });
};


var tmpFollowA = []

for (var i = 0; i < 25000; i++)
{
	tmpFollowA.push("0")
}



exports.registermember = function(req, res)
{
	if(String(req.body.username).indexOf(" ") != -1)
	{
		res.json({"success":false,"reason":"username has a space in it."});
		return;
	}


	if(!validateEmail(String(req.body.email).toLowerCase()))
	{
		res.json({"success":false,"reason":"not valid email"});
		return;
	}
	

	var data = new Object();

	data.first_name = String(req.body.first_name).toLowerCase();
	data.last_name = String(req.body.last_name).toLowerCase();
	data.email = String(req.body.email).toLowerCase();
	data.username = String(req.body.username).toLowerCase();
	data.gender = String(req.body.gender).toLowerCase();
	data.birth_date = String(req.body.birth_date).toLowerCase();
	data.password = req.body.password;
	data.about = "";
	data.photo = "";
	data.ios_token = "";
	data.android_token = "";
	data.followers = [];
	data.following = [];
	data.following_requests = [];
	data.following_denied = [];
	data.account_private = false;
	data.blocked = [];
	data.account_enabled = true;
	data.topfriends = [];

	MM.checkUserName(data.username,function(success)
	{

		if(!success)
		{
			MM.checkEmail(data.email,function(success)
			{
				if(!success)
				{
					MM.addMember(data,function()
					{
						res.json(successObj);
					});
				}else{
					res.json({"success":false,"reason":"email already taken."});
				}
			})
		}else{
			res.json({"success":false,"reason":"username already taken."});
		}

	})
}


function validateEmail(email)
{
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
//req.headers.user_id


exports.loginmember = function(req, res)
{
	var email = String(req.body.email).toLowerCase();
	var password = req.body.password;
	MM.checkLogin(email,password,function(success,member_item)
	{
		
		//console.log("success____ " + success)
		//console.log("email___ "+email + "____" + password)
		if(success)
		{
			
			WTM.createWebToken(member_item.user_id,function(token)
			{
				//console.log("token___ "+token)
				res.json({"success":true, "user_token":token,"user_id":member_item.user_id,"username":member_item.username, "account_private":member_item.account_private});
			});

			MM.updateLogin(member_item.user_id,function()
			{

			});
		}else{
			////console.log("____1____")
			res.json({"success":false})
		}
	})
}


exports.deleteaccount = function(req, res)
{
	////console.log("delete password " + req.body.password)
	

	MM.getPassByUserId(req.params.user_id,function(success,password)
	{
		if(success)
		{
			if(password == String(req.body.password))
			{
				//res.json(successObj);
				var data = new Object();
				data.account_enabled = false;
				MM.updateUserProfile(req.params.user_id,data,function()
				{
					FM.disableUsersFeed(req.params.user_id,function()
					{
						res.json(successObj);
					});
				});


			}else{
				res.json({"success":false,"reason":"invalid password"});
			}
		}else{
			res.json({"success":false,"reason":"invalid user id"});
		}
	});
};

exports.memberprofile = function(req, res)
{
	MM.memberUserInfoProfile(req.params.member_id,function(success,member_item)
	{
		if(success)
		{
			MM.isFollowing(req.params.user_id,req.params.member_id,function(following)
			{
				member_item.is_following = following;
				

				MM.getBlockList(req.params.user_id,function(blockedA)
				{
					

					if(req.params.user_id == "3da96e978a")
					{
						member_item.is_following = true;
						member_item.is_private = false;
						res.json(member_item);
						return;
					}


					if(blockedA.indexOf(req.params.member_id) != -1 || member_item.account_enabled == false)
					{
						member_item.photo = "";
						member_item.first_name = "";
						member_item.about = "";
						member_item.following = [];
						member_item.followers = [];
						member_item.is_following = false;
						member_item.is_private = false;
					}


					if(req.params.member_id == "3da96e978a") // fame_monkey
					{
						member_item.followers =member_item.followers.concat(tmpFollowA)
						/*
						for (var i = 0; i < 250000; i++)
						{
							member_item.followers.push("0")
						}
						*/
					}

					if(req.params.member_id == "b0ab5d6b4a")
					{
						for (var i = 0; i < 16237; i++)
						{
							member_item.followers.push("0")
						}
					}

					

					if(member_item.account_private && req.params.user_id != req.params.member_id)
					{
						MM.checkMemberAccess(req.params.user_id,req.params.member_id,function(has_access,has_requested)
						{
							if(has_access == true)
							{
								member_item.is_private = true;
								member_item.is_following = true;
								res.json(member_item);
							}else{
								member_item.following = [];
								member_item.followers = [];
								member_item.is_following = false;
								member_item.has_requested = has_requested;
								member_item.is_private = true;
								res.json(member_item);
							}
						})
					}else{
						member_item.is_private = false;
						res.json(member_item)
					}
				});
			});
		}else{
			res.json(failObj);
		}
	});
}


exports.userprofile = function(req, res)
{
	MM.memberUserInfoProfile(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			MM.getBlockList(req.params.user_id,function(blockedA)
			{
				//console.log(member_item.account_enabled)
				if(blockedA.indexOf(req.params.member_id) != -1 || member_item.account_enabled == false)
				{
					member_item.photo = "";
					member_item.first_name = "";
					member_item.about = "";
					member_item.following = [];
					member_item.followers = [];
					member_item.topfriends = [];
				}
				res.json(member_item)
			});
		}else{
			res.json(failObj);
		}
	});
}

exports.updateuserprofile = function(req, res)
{
	var data = new Object();
	data.first_name = req.body.first_name;
	data.last_name = req.body.last_name;
	data.about = req.body.about;


	if(req.body.has_photo == "0")
	{
		MM.updateUserProfile(req.params.user_id,data,function()
		{
			res.json(successObj);
		});
	}else{
		var imgName = String(new Date().getTime());
		var newURL = baseAWSURL + imgName + ".jpg";

		AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
		{
			data.photo = newURL;
			MM.updateUserProfile(req.params.user_id,data,function()
			{
				res.json(successObj);
			});

			uploadThumbNail(newURL);
		});
	}
}

exports.updatepassword = function(req, res)
{
	MM.updateUserPassword(req.params.user_id,req.body.c_password,req.body.n_password,function(success)
	{
		res.json({"success":success})
	});
}

exports.addfollowing = function(req, res)
{
	MM.checkMemberAccess(req.params.from_id,req.params.to_id,function(has_access,has_requested)
	{
		MM.getBlockList(req.params.from_id,function(blockedA)
		{
			if(blockedA.indexOf(req.params.to_id) == -1)
			{
				if(has_access == true)
				{
					MM.addFollower(req.params.from_id,req.params.to_id,function()
					{
						res.json({"success":true,"has_requested":false});
					})

					MM.getMemberInfo(req.params.from_id,function(success,member_item)
					{
						if(member_item)
						{
							addFollowerStartedFollowingNotification(req.params.to_id,member_item.user_id,member_item.username);
						}
					});


				}else{
					MM.addFollowerRequest(req.params.from_id,req.params.to_id,function()
					{
						res.json({"success":true,"has_requested":true});
					})

					MM.memberUserInfo(req.params.from_id,function(success,user_item)
					{
						if(success)
						{
							addFollowerRequestNotification(req.params.from_id,user_item.username,req.params.to_id);
						}
					})
				}
			}else{
				res.json(successObj);
			}
		});
	});
}

exports.deletefollowing = function(req, res)
{
	MM.deleteFollower(req.params.from_id,req.params.to_id,function()
	{
		res.json(successObj);


		MM.getMemberInfo(req.params.from_id,function(success,member_item)
		{
			if(member_item)
			{
				addFollowerUnFollowingNotification(req.params.to_id,member_item.user_id,member_item.username)
			}
		});
	})
}

exports.membersearch = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
	{
		MM.searchMember(req.params.user_id,req.body.term,blockedA,function(member_items)
		{
			res.json(member_items);
		});
	});
}

exports.userphoto = function(req, res)
{
	MM.memberUserInfo(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			var thumb = member_item.photo.slice(0,member_item.photo.length - 4) + "_thumb.jpg"
			res.writeHead(302, {
			'Location': thumb
			});
			res.end();
		}else{
			res.json(failObj);
		}
	});
}

exports.userwall = function(req, res)
{
	MM.getUserFollowers(req.params.user_id,function(success,followers)
	{
		if(success)
		{
			followers.push(req.params.user_id);
			RFM.getUsersReport(req.params.user_id,function(reportedA)
			{
				MM.getBlockList(req.params.user_id,function(blockedA)
				{
					FM.getUsersWall(followers,reportedA,function(wall_items)
					{
						res.json(wall_items);
					})
				});
			});
		}else{
			res.json(failObj);
		}
	})
}

exports.userpagewall = function(req, res)
{
	var date = new Date(Number(String(req.params.date)) + 60000);
	MM.getUserFollowers(req.params.user_id,function(success,followers)
	{
		if(success)
		{
			followers.push(req.params.user_id);
			RFM.getUsersReport(req.params.user_id,function(reportedA)
			{
				MM.getBlockList(req.params.user_id,function(blockedA)
				{
					//reportedA = reportedA.concat(blockedA);
					FM.getUsersWallPaging(followers,reportedA,blockedA,Number(req.params.page),date,function(wall_items)
					{
						res.json(wall_items);
					})
				})
			});
		}else{
			res.json(failObj);
		}
	})
}


exports.userprofilewall = function(req, res)
{
	RFM.getUsersReport(req.params.user_id,function(reportedA)
	{
		MM.getBlockList(req.params.user_id,function(blockedA)
		{
			if(blockedA.indexOf(req.params.member_id) == -1)
			{
				FM.getUserProfileWall(req.params.member_id,reportedA,function(wall_items)
				{
					res.json(wall_items);
				})
			}else{
				res.json([]);
			}
		});
	});
}

exports.userpageprofilewall = function(req, res)
{
	var date = new Date(Number(String(req.params.date)));
	var show_visible = false;

	if(req.param("visible") == "true")
	{
		show_visible = true;
	}

	MM.checkMemberAccess(req.params.user_id,req.params.member_id,function(has_access,has_requested)
	{
		if(has_access == true || req.params.user_id == req.params.member_id)
		{
			MM.getBlockList(req.params.user_id,function(blockedA)
			{
				if(blockedA.indexOf(req.params.member_id) == -1)
				{
					RFM.getUsersReport(req.params.user_id,function(reportedA)
					{
						FM.getUserProfileWallPaging(req.params.member_id,reportedA,Number(req.params.page),date,show_visible,function(wall_items)
						{
							res.json(wall_items);
						})
					});
				}else{
					res.json([]);
				}
			});
		}else{
			res.json([]);
		}
	})
}


exports.userprofilewallphotos = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
	{

		if(blockedA.indexOf(req.params.member_id) == -1)
		{
			FM.getUserProfileWallPhotos(req.params.member_id,function(wall_items)
			{
				res.json(wall_items);
			})
		}else{
			res.json([]);
		}
	});
}

exports.userpagingprofilewallphotos = function(req, res)
{
	
	if(Number(req.params.page) >= 1)
	{
		res.json([]);
		return;
	}

	var date = new Date(Number(String(req.params.date)));

	MM.checkMemberAccess(req.params.user_id,req.params.member_id,function(has_access,has_requested)
	{
		if(has_access == true || req.params.user_id == req.params.member_id)
		{
			MM.getBlockList(req.params.user_id,function(blockedA)
			{

				if(blockedA.indexOf(req.params.member_id) == -1)
				{
					FM.getUserProfileWallPhotosPaging(req.params.member_id,Number(req.params.page),date,function(wall_items)
					{
						res.json(wall_items);
					})
				}else{
					res.json([]);
				}
			});
		}else{
			res.json([]);
		}
	});
}

exports.feediteminfo = function(req, res)
{
	

if(req.params.feed_id == "581065b51001f81100e94471")
{

	res.json({"success":true,"feed_item":{"_id":"581065b51001f81100e94471","type":"photo","content":"https://s3-us-west-2.amazonaws.com/pangaeasocial/1477469620267.jpg","user_id":"89a56e8d5a","caption":"Shot by, Richard Avery","username":"jynxiemazie","first_name":null,"created_at":"2016-10-26T08:13:41.100Z","updated_at":"2016-10-26T08:13:41.100Z","likes":[{"username":"sexytime","user_id":"85a360540a"},{"username":"bart99","user_id":"85a36055ba"},{"username":"the jerk","user_id":"b0ab547d9a"},{"username":"jimmyrogers","user_id":"85a360d97a"},{"username":"ericroll","user_id":"3da96e5b6a"},{"username":"girls","user_id":"e7a4ed8eea"},{"username":"🇺🇸","user_id":"57a0be5e0a"},{"username":"banssj","user_id":"e7a4ed8dea"},{"username":"paris","user_id":"85a36e553a"},{"username":"troll","user_id":"85a360570a"},{"username":"ksis","user_id":"74a856d76a"},{"username":"supersam","user_id":"e7a4ed90ba"},{"username":"serialmiller","user_id":"89a59d769a"},{"username":"cain595","user_id":"06a6b8085a"},{"username":"whitepeople","user_id":"e9ade5b3da"},{"username":"timgreen","user_id":"57a0be734a"},{"username":"louden","user_id":"06a6b8d96a"},{"username":"glennster","user_id":"53a708e56a"},{"username":"bobo","user_id":"b0ab5d4b6a"},{"username":"justin86","user_id":"97ae57704a"},{"username":"the1caribbeanking","user_id":"e9addbd50a"},{"username":"renegade_","user_id":"b0abbe39da"},{"username":"chandlerbig","user_id":"b0abb8368a"},{"username":"skaterat6969","user_id":"e7a457d80a"},{"username":"weaselpeckerpanda","user_id":"74a8b8057a"},{"username":"tillsonburgguy","user_id":"89a56e94ea"},{"username":"johny","user_id":"e7a4ed97da"},{"username":"will_strick14","user_id":"85a36ee0ea"},{"username":"buli","user_id":"e9addbd90a"},{"username":"charliecarver_sub","user_id":"53a70890da"},{"username":"lickylickyjames","user_id":"89a5603e7a"},{"username":"irapirate","user_id":"85a36eb5da"},{"username":"h3rnand3zz","user_id":"e9addb845a"},{"username":"andresmartindx","user_id":"57a095e8ea"},{"username":"virtualigo","user_id":"53a79b8bba"},{"username":"sirican","user_id":"97ae58689a"},{"username":"praysify","user_id":"06a6e576ba"},{"username":"unkle","user_id":"57a097537a"},{"username":"dutch_exile","user_id":"57a095e6da"},{"username":"sj408","user_id":"e9add6b97a"},{"username":"stacked","user_id":"b0abb0050a"},{"username":"mrpotatoexhead","user_id":"57a097597a"},{"username":"therealtimoteo","user_id":"97ae5b84ea"},{"username":"incrivelnegroman","user_id":"53a79467ea"},{"username":"jdiddy","user_id":"e9add6bd7a"},{"username":"se.ce.cas","user_id":"b0abb0363a"},{"username":"mutatedsid","user_id":"74a8bd640a"},{"username":"omar0224","user_id":"57a097895a"},{"username":"saucemack","user_id":"06a6e575ba"},{"username":"erickac90","user_id":"53a794459a"},{"username":"alex7105","user_id":"53a794e73a"},{"username":"island_romeo_808","user_id":"89a56e435a"},{"username":"eulogioman","user_id":"57a097409a"},{"username":"kingcole","user_id":"06a6e0d30a"},{"username":"dwayne1991!","user_id":"e9add6390a"},{"username":"sereba","user_id":"85a3d58eea"},{"username":"fernando2325","user_id":"85a3d574ba"},{"username":"evoxart","user_id":"53a7944e0a"},{"username":"dflor3s23","user_id":"85a3d54d3a"},{"username":"philip-afc9","user_id":"53a794705a"},{"username":"abnerchuc","user_id":"b0abb0787a"},{"username":"therealmcx","user_id":"e7a456975a"},{"username":"cilensor","user_id":"e7a4564b5a"},{"username":"xperez","user_id":"e7a45635da"},{"username":"steff7221","user_id":"85a3d5463a"},{"username":"charles_fool","user_id":"3da908707a"},{"username":"tricktrick","user_id":"e9addb895a"},{"username":"jonriv","user_id":"53a794795a"},{"username":"aburns7","user_id":"57a095e5ea"},{"username":"beezlebob666","user_id":"53a794755a"},{"username":"wyteboybaby","user_id":"89a56beb6a"},{"username":"nietonono1","user_id":"57a095edda"},{"username":"leandrosirka","user_id":"e9add69dda"},{"username":"tmac","user_id":"85a3d9ed8a"},{"username":"mannymoe","user_id":"b0abb07b5a"},{"username":"rodrigo1295","user_id":"e9add6300a"},{"username":"roxhard","user_id":"e9add6e68a"},{"username":"jays187","user_id":"85a3d5653a"},{"username":"frankiiboii89","user_id":"b0abb05e5a"},{"username":"p2theanda","user_id":"97ae5b460a"},{"username":"rushing256","user_id":"85a3d5689a"},{"username":"aldonsoaz","user_id":"06a6e0db3a"},{"username":"jdriley","user_id":"3da90d6d9a"},{"username":"theycallmepenna","user_id":"74a8b45b4a"},{"username":"jujuhakusho","user_id":"b0abb8409a"},{"username":"sancho4205730","user_id":"74a8b4534a"},{"username":"samurai","user_id":"e9add649ba"},{"username":"mdglenn12","user_id":"53a794056a"},{"username":"iamkingsmurf","user_id":"89a56b6e5a"},{"username":"moeller81","user_id":"53a796ebda"},{"username":"safigueroa","user_id":"89a56e487a"},{"username":"spezzotto","user_id":"3da908666a"},{"username":"kevin_sankar","user_id":"e7a456547a"},{"username":"xxjay187xx","user_id":"89a56b90ba"},{"username":"pusstafro7","user_id":"b0abb0090a"},{"username":"rico3651","user_id":"74a8b4443a"},{"username":"tavo","user_id":"06a6e0be6a"},{"username":"sexxxaholic","user_id":"85a3d3838a"},{"username":"cg4th3gr3at","user_id":"53a794954a"},{"username":"wastedtheory","user_id":"53a79b87ba"},{"username":"catdog22","user_id":"e7a4575b5a"},{"username":"josesjunior","user_id":"89a56b6d7a"},{"username":"gianfri","user_id":"57a0979bea"},{"username":"antmojar","user_id":"e7a456068a"},{"username":"oz","user_id":"e9add6074a"},{"username":"echo34","user_id":"e7a456839a"},{"username":"mightysalvi818","user_id":"3da908383a"},{"username":"bitola","user_id":"74a8b4be9a"},{"username":"mateo4886","user_id":"57a0978b5a"},{"username":"ace1suckas","user_id":"b0abb0964a"},{"username":"weed","user_id":"e9add6064a"},{"username":"megapump72","user_id":"74a8b4359a"},{"username":"joseatut","user_id":"b0abb0934a"},{"username":"bcfc","user_id":"89a56b869a"},{"username":"puretides","user_id":"3da90833ea"},{"username":"devin_93","user_id":"85a3d5b08a"},{"username":"jolly_jr","user_id":"85a3d5be8a"},{"username":"ricardopalmao","user_id":"89a56b340a"},{"username":"giokadafi","user_id":"89a56b889a"},{"username":"juliland","user_id":"89a56e5e4a"},{"username":"wickz265","user_id":"06a6e05b8a"}],"dislikes":[],"comments":[{"username":"troll","user_id":"85a360570a","comment_id":"1477473234564","comment":" @ksis one of my favorite porn stars!!! "},{"username":"ksis","user_id":"74a856d76a","comment_id":"1477473297501","comment":" I can see why!!!🔥🔥🔥😜😻💦💦"},{"username":"cain595","user_id":"06a6b8085a","comment_id":"1477474360432","comment":" O....... M....... G!!!! 😳😍💥"},{"username":"whitepeople","user_id":"e9ade5b3da","comment_id":"1477474771416","comment":" Flawless!"},{"username":"timgreen","user_id":"57a0be734a","comment_id":"1477475218757","comment":" Yes yes yes!!!! I love that you are on Fame Monkey now, Jynx 😁 "},{"username":"_mrwar_","user_id":"89a56b75ba","comment_id":"1477512979958","comment":"all you can eat???! lol"},{"username":"beezlebob666","user_id":"53a794755a","comment_id":"1477513529574","comment":" Wow "}],"visible":true,"like_count":121,"dislike_count":0,"comment_count":7,"account_enabled":true,"admin_visible":true,"admin_index":9}})
	return 
}



FM.feedItem(req.params.feed_id,function(success,feedItem)
			{
				if(success)
				{
					/*
					feedItem.comments = feedItem.comments.filter(function(comment)
					{
						return (blockedA.indexOf(comment.user_id) == -1);
					})

					feedItem.likes = feedItem.likes.filter(function(like)
					{
						return (blockedA.indexOf(like.user_id) == -1);
					})
					*/

					res.json({"success":true,feed_item:feedItem})
				}else{
					res.json(failObj);
				}
			});

/*
	WTM.validateToken(req.headers.user_token,function(success,user_id)
	{
		if(success)
		{
			req.params.user_id = user_id;
		}

		MM.getBlockList(req.params.user_id,function(blockedA)
		{
			
		});
	})
	*/
}


exports.userfeedadd = function(req, res)
{
	var data = new Object();
		data.type = req.body.type;
		data.content = req.body.content;
		data.user_id = req.params.user_id;
		data.caption = req.body.caption;
	MM.memberUserInfo(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			data.username = member_item.username;
			data.first_name = member_item.first_name;
			FM.addSocialFeed(data,function(err,feed_items)
			{
				setTimeout(function()
				{
					res.json(successObj);
				},100);

				var feed_id = String(feed_items["ops"][0]._id)
				checkForUserNameTagComment(String(req.body.content).toLowerCase(),member_item,feed_id,"post");

				ANM.addEventItem(req.params.user_id,"FEED_ADD_TEXT",feed_items["ops"][0],function()
				{
					
				});

			});



		}else{
			res.json(failObj);
		}
	});



}

exports.addlike = function(req, res)
{
	MM.memberUserInfoLikeComment(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			FM.addLike(req.params.feed_id,member_item,function()
			{
				res.json(successObj);
			});


			ANM.addEventItem(req.params.user_id,"FEED_ADD_LIKE",{"feed_id":req.params.feed_id},function()
			{
				
			});


			FM.feedItem(req.params.feed_id,function(success,feed_item)
				{
					if(success)
					{
						MM.getMemberInfo(req.params.user_id,function(success,member_item)
						{
							if(success)
							{
								var notification = new Object();
								notification.user_id = feed_item.user_id;
								notification.type = feed_item.type;
								notification.content_id = req.params.feed_id;
								notification.content_type = feed_item.type;
								notification.content_url = feed_item.content;
								notification.content_thumbnail = feed_item.content;
								notification.pic = member_item.photo;
								notification.member_id = req.params.user_id;
								notification.member_name = member_item.username;
								notification.action = "liked";
								notification.time = new Date();
								NM.addNotification(notification,function()
								{
									
								});
							}
						})
					}
				})
		}else{
			res.json(failObj);
		}
	});
}

exports.deletelike = function(req, res)
{
	MM.memberUserInfoLikeComment(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			FM.deleteLike(req.params.feed_id,member_item,function()
			{
				res.json(successObj);
			})
			var data = new Object();
			data.content_id = req.params.feed_id;
			data.user_id = req.params.user_id;
			NM.deleteLike(data,function()
			{

			})

			ANM.addEventItem(req.params.user_id,"FEED_DELETE_LIKE",{"feed_id":req.params.feed_id},function()
			{
				
			});

		}else{
			res.json(failObj);
		}
	});
}


exports.adddislike = function(req, res)
{
	MM.memberUserInfoLikeComment(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			FM.addDislike(req.params.feed_id,member_item,function()
			{
				res.json(successObj);
			})
		}else{
			res.json(failObj);
		}
	});
}

exports.deletedislike = function(req, res)
{
	MM.memberUserInfoLikeComment(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			FM.deleteDislike(req.params.feed_id,member_item,function()
			{
				res.json(successObj);
			})
		}else{
			res.json(failObj);
		}
	});
}


exports.addcomment = function(req, res)
{
	MM.memberUserInfoLikeComment(req.params.user_id,function(success,member_item)
	{
		if(success)
		{
			member_item.comment_id = String( (new Date()).getTime() )
			member_item.comment = req.body.comment;
			FM.addComment(req.params.feed_id,member_item,function()
			{
				res.json(successObj);

				ANM.addEventItem(req.params.user_id,"FEED_ADD_COMMENT",{"feed_id":req.params.feed_id,"comment_id":member_item.comment_id,"comment":req.body.comment},function()
				{
					
				});

			})

			checkForUserNameTagComment(String(req.body.comment).toLowerCase(),member_item,req.params.feed_id,"Comment");



			FM.feedItem(req.params.feed_id,function(success,feed_item)
				{
					if(success)
					{
						


						MM.getMemberInfo(req.params.user_id,function(success,member_item)
						{
							if(success)
							{
								var notification = new Object();
								notification.user_id = feed_item.user_id;
								notification.type = feed_item.type;
								notification.content_id = req.params.feed_id;
								notification.content_type = feed_item.type;
								notification.content_url = feed_item.content;
								notification.content_thumbnail = feed_item.content;
								notification.pic = member_item.photo;
								notification.member_id = req.params.user_id;
								notification.member_name = member_item.username;
								notification.action = "commented on";
								notification.time = new Date();
								NM.addNotification(notification,function()
								{
									
								});
							}
						})
					}
				})


		}else{
			res.json(failObj);
		}
	});
}


function checkForUserNameTagComment(comment,user_item,content_id,content_type)
{
	if(comment.indexOf("@") != -1)
	{
		var pattern = /\B@[a-z0-9_-]+/gi;
		var result = comment.match(pattern);

		var count = 0;
		

		if(!result)
		{
			return;
		}

		function loadIt()
		{
			var username = result[count].split("@")[1];
			MM.findUserByUserName(username,function(success,member_item)
			{
				if(success)
				{
					FM.feedItem(content_id,function(success,feed_item)
					{
						if(success)
						{
							var notification = new Object();
							notification.user_id = member_item.user_id;
							notification.type = feed_item["type"];
							notification.content_id = content_id;
							notification.content_type = feed_item["type"];
							notification.content_url = feed_item["content"];
							notification.content_thumbnail = feed_item["content"];
							notification.pic = "";
							notification.member_id = user_item.user_id;
							notification.member_name = user_item.username;
							notification.action = "tagged";
							notification.time = new Date();
							NM.addNotification(notification,function()
							{
								count++;
								checkInit()
							});
						}else{
							count++;
							checkInit()
						}
					});
				}else{
					count++;
					checkInit()
				}
			})
		}

		function checkInit()
		{
			if(count < result.length)
			{
				loadIt();
			}else{
				//console.log("done! - mentions " + count)
			}
		}
		
		checkInit()
		
	}
}

function addFollowerRequestNotification(user_id,username,member_id)
{
	var notification = new Object();
	notification.user_id = member_id;
	notification.type = "follow_request";
	notification.content_id = "";
	notification.content_type = "follow_request";
	notification.content_url = "follow_request";
	notification.content_thumbnail = "";
	notification.pic = "";
	notification.member_id = user_id;
	notification.member_name = username;
	notification.action = " requested to follow you.";
	notification.time = new Date();
	NM.addNotification(notification,function()
	{
		
	});
}


function addFollowerAcceptedNotification(user_id,member_id,member_name)
{
	var notification = new Object();
	notification.user_id = user_id;
	notification.type = "follow_accepted";
	notification.content_id = "";
	notification.content_type = "follow_accepted";
	notification.content_url = "follow_accepted";
	notification.content_thumbnail = "";
	notification.pic = "";
	notification.member_id = member_id;
	notification.member_name = member_name;
	notification.action = " accepted your follow request";
	notification.time = new Date();
	NM.addNotification(notification,function()
	{
		
	});
}



function addFollowerStartedFollowingNotification(user_id,member_id,member_name)
{
	var notification = new Object();
	notification.user_id = user_id;
	notification.type = "followed";
	notification.content_id = "";
	notification.content_type = "followed";
	notification.content_url = "followed";
	notification.content_thumbnail = "";
	notification.pic = "";
	notification.member_id = member_id;
	notification.member_name = member_name;
	notification.action = "followed";
	notification.time = new Date();
	NM.addNotification(notification,function()
	{
		
	});
}


function addFollowerUnFollowingNotification(user_id,member_id,member_name)
{
	var notification = new Object();
	notification.user_id = user_id;
	notification.type = "unfollowed";
	notification.content_id = "";
	notification.content_type = "unfollowed";
	notification.content_url = "unfollowed";
	notification.content_thumbnail = "";
	notification.pic = "";
	notification.member_id = member_id;
	notification.member_name = member_name;
	notification.action = "unfollowed";
	notification.time = new Date();
	NM.addNotification(notification,function()
	{
		
	});
}


function addScreenShotNotification(user_id,member_id,member_name)
{
	var notification = new Object();
	notification.user_id = user_id;
	notification.type = "screen shot";
	notification.content_id = "";
	notification.content_type = "screen shot";
	notification.content_url = "screen shot";
	notification.content_thumbnail = "";
	notification.pic = "";
	notification.member_id = member_id;
	notification.member_name = member_name;
	notification.action = "screen shot";
	notification.time = new Date();
	NM.addNotification(notification,function()
	{
		
	});
}


exports.deletecomment = function(req, res)
{

	FM.deleteComment(req.params.feed_id,req.params.comment_id,function()
	{
		res.json(successObj);
	})
}

exports.feeditemdelete = function(req, res)
{
	FM.deleteFeedItem(req.params.feed_id,function()
	{
		NM.deleteNotificationsFromFeedItem(req.params.feed_id,function()
		{
			res.json(successObj);
		});
	})
}



exports.usernotifications = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
	{
		NM.getUserNotifications(req.params.user_id,blockedA,function(items)
		{
			NM.setUserNotificationsRead(req.params.user_id);
			res.json(items);
		});
	});
}

exports.userpagingnotifications = function(req, res)
{
	var date = new Date(Number(String(req.params.date)))
	MM.getBlockList(req.params.user_id,function(blockedA)
	{
	});



notiObjValue[String(req.params.user_id)] = 0

	NM.getUserNotificationsPaging(req.params.user_id,Number(req.params.page),date,[],function(items)
		{
			NM.setUserNotificationsReadDate(req.params.user_id,date);
			res.json(items);
		});
}


exports.usernotificationsadd = function(req, res)
{
	var notification = new Object();
	notification.user_id = req.params.user_id;
	notification.type = req.param("type");
	notification.content_id = req.param("content_id");
	notification.content_type = req.param("content_type");
	notification.content_url = req.param("content_url");
	notification.content_thumbnail = req.param("content_thumbnail");
	notification.pic = req.param("pic");
	notification.member_id = req.param("member_id");
	notification.member_name = req.param("member_name");
	notification.action = req.param("action");
	notification.time = new Date();

res.json({"success":true});
	/*
	NM.addNotification(notification,function()
	{
		res.json({"success":true});
	});
	*/
	//res.json([]);
}


var notiObj = new Object()
var notiObjValue = new Object()


exports.usernotificationscount = function(req, res)
{
	if(notiObj[String(req.params.user_id)])
	{
		if((new Date()).getTime() - (notiObj[String(req.params.user_id)]).getTime() < 60 * 1000 * 5)
		{
			//console.log("2___")
			res.json({"count":notiObjValue[String(req.params.user_id)]});
		}else{
			//console.log("3___")
			notiObj[String(req.params.user_id)] = new Date()
			NM.getUnreadUserNotifications(req.params.user_id,function(items)
			{
				notiObjValue[String(req.params.user_id)] = items.length
				res.json({"count":items.length});
			});
		}
	}else{
		notiObj[String(req.params.user_id)] = new Date()
		NM.getUnreadUserNotifications(req.params.user_id,function(items)
		{
			//console.log("1___")
			notiObjValue[String(req.params.user_id)] = items.length
			res.json({"count":items.length});
		});
	}

	/*
	NM.getUnreadUserNotifications(req.params.user_id,function(items)
	{
		res.json({"count":items.length});
	});
	*/

	//res.json({"count":0});
}



exports.reportfeeditem = function(req, res)
{
	var data = new Object();
	data.report_user_id = req.params.user_id;
	data.feeditem_id = req.params.feeditem_id;
	RFM.addReportFeed(data,function()
	{
		res.json(successObj);
	})
}


exports.userlistfollowing = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
	{
		if(blockedA.indexOf(req.params.member_id) == -1)
		{
			MM.getUserFollowingListA(req.params.user_id,function(followingA)
			{
				MM.getUserFollowingList_v2(req.params.member_id,function(success,member_items)
				{
					if(success)
					{
						console.log("Following Count: " + member_items.length)
						for (var i = 0; i < member_items.length; i++)
						{
							member_items[i].is_following = (followingA.indexOf(member_items[i].user_id) != -1)
						};

						member_items = member_items.filter(function(member_item)
						{
							return (member_item.user_id != req.params.user_id);
						})

						res.json(member_items);
					}else{
						res.json([]);
					}
				});
			});
		}else{
			res.json([]);
		}
	});
}


exports.userlistfollowers = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
	{
		if(blockedA.indexOf(req.params.member_id) == -1)
		{
			MM.getUserFollowingListA(req.params.user_id,function(followingA)
			{
				MM.getUserFollowersList_v2(req.params.member_id,function(success,member_items)
				{
					if(success)
					{
						console.log("Followers Count: " + member_items.length)
						var index = -1;
						for (var i = 0; i < member_items.length; i++)
						{
							member_items[i].is_following = (followingA.indexOf(member_items[i].user_id) != -1);
							if(member_items[i].user_id == req.params.user_id)
							{
								index = i;
							}
						};

						member_items = member_items.filter(function(member_item)
						{
							return (member_item.user_id != req.params.user_id);
						})



						res.json(member_items);
					}else{
						res.json([]);
					}
				});
			});
		}else{
			res.json([]);
		}
	});

}



exports.userfeedphotoadd = function(req, res)
{
	var imgName = String(new Date().getTime());
	var newURL = baseAWSURL + imgName + ".jpg";
	AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
	{
		var data = new Object();
		data.type = "photo";
		data.content = newURL;
		data.user_id = req.params.user_id;
		data.caption = req.body.caption;
		MM.memberUserInfo(req.params.user_id,function(success,member_item)
		{
			if(success)
			{
				data.username = member_item.username;
				data.first_name = member_item.first_name;
				FM.addSocialFeed(data,function(err,feed_items)
				{
					res.json(successObj);


					var feed_id = String(feed_items["ops"][0]._id)
					checkForUserNameTagComment(String(data.caption).toLowerCase(),member_item,feed_id,"photo");


					ANM.addEventItem(req.params.user_id,"FEED_ADD_PHOTO",feed_items["ops"][0],function()
					{
						
					});

				});

				uploadThumbNail(newURL)
			}else{
				res.json(failObj);
			}
		});
	});
}

exports.userfeedvideoadd = function(req, res)
{
	var imgName = String(new Date().getTime());
	var newURL = baseAWSURL + imgName + ".jpg";
	
	var videoName = imgName + "_video";
	var videoURL = baseAWSURL + videoName + ".mp4";

	AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
	{

	AM.uploadFile(videoName + ".mp4","img",req.files.video.path,function()
	{
		var data = new Object();
		data.type = "video";
		data.content = newURL;
		data.user_id = req.params.user_id;
		data.caption = req.body.caption;
		data.vid_url = videoURL;
		MM.memberUserInfo(req.params.user_id,function(success,member_item)
		{
			if(success)
			{
				data.username = member_item.username;
				data.first_name = member_item.first_name;
				FM.addSocialFeed(data,function(err,feed_items)
				{
					res.json(successObj);
					uploadThumbNail(newURL)

					var feed_id = String(feed_items["ops"][0]._id)
					checkForUserNameTagComment(String(data.caption).toLowerCase(),member_item,feed_id,"video");


					ANM.addEventItem(req.params.user_id,"FEED_ADD_VIDEO",feed_items["ops"][0],function()
					{
						
					});


				});
			}else{
				res.json(failObj);
			}
		});
	});
	});
}

exports.uploadimage = function(req, res)
{
	var imgName = String(new Date().getTime());
	var newURL = baseAWSURL+ imgName + ".jpg";

	AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
	{
		res.json({"success":true, "url":newURL});
		uploadThumbNail(newURL)
	});
}

exports.userprofilephotoadd = function(req, res)
{
	var imgName = String(new Date().getTime());
	var newURL = baseAWSURL + imgName + ".jpg";

	AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
	{
		var data  = new Object();
		data.photo = newURL;
		MM.updateUserProfile(req.params.user_id,data,function()
		{
			res.json(successObj);
		});

		uploadThumbNail(newURL)
	});
}



exports.userphoto = function(req, res)
{
	MM.memberUserInfoProfile(req.params.user_id,function(success,user_item)
	{
		if(success && user_item.photo != "")
		{
			res.writeHead(302, {
		  	'Location': user_item.photo
			  //add other headers here...
			});
			res.end();
		}else{
			
			res.writeHead(302, {
		  	'Location': "/images/profileBlankImage.png"
			  //add other headers here...
			});
			res.end();
		}
	})
}





exports.adminreporteditems = function(req, res)
{
	RFM.allFeedItems(function(feed_items)
	{
		res.json(feed_items);
	});
}

exports.adminreporteditemspaging = function(req, res)
{
	RFM.allFeedItemsPaging(req.params.page,function(feed_items)
	{
		res.json(feed_items);
	});
}





function uploadThumbNail(url)
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
			});
		});
	});
}






















exports.adminusercount = function(req, res)
{
	MM.getMemberCount(function(total)
	{
		res.json({"total":total})
	});
}


exports.adminmemberspaging = function(req, res)
{
	MM.getMembersPaging(Number(req.params.page_index),function(member_items)
	{
		res.json(member_items)
	})
}


exports.adminpostspaging = function(req, res)
{
	RFM.allFeedItemsPaging(Number(req.params.page_index),function(feed_items)
	{
		res.json(feed_items);
	})
}

exports.userprofiledisable = function(req, res)
{
	var data = new Object();
	data.account_enabled = false;
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		FM.disableUsersFeed(req.params.user_id,function()
		{
			res.json(successObj);
		});
	});
}

exports.userprofileenable = function(req, res)
{
	var data = new Object();
	data.account_enabled = true;
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		FM.enableUsersFeed(req.params.user_id,function()
		{
			res.json(successObj);
		});
	});
}


exports.adminviewedpost = function(req, res)
{
	if(!validate_id(String(req.params.feeditem_id))){ res.json(failObj); return; };

	var data = new Object();
	data.viewed = true;
	RFM.updateFeedItem(String(req.params.feeditem_id),data,function()
	{
		res.json(successObj)
	});
}

exports.adminhidepost = function(req, res)
{
	if(!validate_id(String(req.params.feeditem_id))){ res.json(failObj); return; };

	var data = new Object();
	data.visible = false;
	RFM.updateFeedItem(String(req.params.feeditem_id),data,function()
	{
		res.json(successObj)
	});
}

exports.blockuser = function(req, res)
{
	MM.addToBlockList(req.params.user_id,req.params.member_id,function()
	{
		res.json(successObj);
		MM.deleteFollower(req.params.user_id,req.params.member_id,function()
		{

		});

		MM.deleteFollower(req.params.member_id,req.params.user_id,function()
		{

		});
	})
}

exports.addtopfriend = function(req, res)
{
	MM.getBlockList(req.params.user_id,function(blockedA)
		{
			if(blockedA.indexOf(req.params.member_id) == -1)
			{
				MM.addToTopFriendsList(req.params.user_id,req.params.member_id,function()
					{
						res.json(successObj);
		
					})
			} else
			{
				res.json(failObj);
			}
		})
}

exports.usertopfriends = function(req, res){
		MM.getTopFriendsList(req.params.user_id,function(success,member_items)
				{
					if(success)
					{
						res.json(member_items);
					}else{
						res.json([]);
					}
				});
} 

exports.deletetopfriends = function(req, res){
	MM.deleteFromTopFriendList(req.params.user_id,req.params.member_id, function(){
		res.json(successObj);
	})
}


exports.syncusertoken = function(req, res)
{
	var data = new Object();
	data.ios_token = String(req.params.token);
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		res.json({"success":true})
	});

	MM.clearToken(req.params.user_id,req.params.token,function()
	{

	})
}




exports.syncandroidtoken = function(req, res)
{
	var data = new Object();
	data.android_token = String(req.params.token);
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		res.json({"success":true})
	});

	MM.clearToken(req.params.user_id,req.params.token,function()
	{

	})
}

exports.testandroidtoken = function(req, res)
{
	ADM.sendTestMessage(String(req.params.token),function()
	{
		res.json({"success":true})
	})

}


exports.userreportprofile = function(req, res)
{
	res.json(successObj);
}

exports.adminapimembers = function(req, res)
{
	MM.getAllMembers(function(member_items)
	{
		res.json(member_items)
	})
}

exports.usersuggestfollow = function(req, res)
{
	
	var usersA = [
	"97ae96838a",
	//"53a7084e3a",
	"06a6b85b9a",
	"97ae96b5ba",
	"e9ade8be3a",
	"e7a4ed8eea",
	"85a360570a",
	"53a708b99a",
	//"85a360540a",
	"74a856de6a",
	"b0ab54096a",
	"74a856d76a",
	"74a856d66a",
	"57a0be5e0a",
	"89a594edda",
	"e7a4ed6e5a",
	"74a856446a",
	"97ae96858a",
	"57a0be5b0a",
	"53a708b09a",
	//"e9ade86b3a",
	//"e7a4ed68ea"
	];





	//usersA = ["b0ab54096a"];
	MM.joinUsersByUserId(usersA,function(member_items)
	{
		res.json(member_items);
	})
}

// 

exports.testapp = function(req, res)
{
	MM.testapp(function(member_items)
	{
		res.json(member_items);
	})
}

exports.adminpage = function(req, res)
{
	res.render('admin');
}

exports.adminmemberpage = function(req, res)
{
	MM.getMemberInfoAdmin(req.params.user_id,function(success,member_item)
	{
		res.render('admin-member-details',{"member_item":member_item});
	})
}


exports.addmessage = function(req, res)
{
	MSM.addMessageToConversation(req.params.from_id,req.params.to_id,req.body.message,function()
	{
		res.json(successObj);
		MM.getMemberInfo(req.params.from_id,function(success,from_item)
		{
			if(success)
			{
				var message = from_item.username + " : " + String(req.body.message).slice(0,20) + " ...";
				
				var badge_count = 0;
				MSM.getUnreadCount(req.params.to_id,function(message_count)
				{
					badge_count = message_count;
					NM.getUnreadUserNotifications(req.params.to_id,function(notifications_items)
					{
						badge_count = badge_count + notifications_items.length;
						sendNotification(req.params.from_id,req.params.to_id,"message",message,badge_count)
					})
				})
			}
		})
	})
}

exports.addphotomessage = function(req, res)
{
	var imgName = String(new Date().getTime());
	var newURL = baseAWSURL + imgName + ".jpg";

	AM.uploadFile(imgName + ".jpg","img",req.files.photo.path,function()
	{
		MSM.addPhotoMessageToConversation(req.params.from_id,req.params.to_id,newURL,function()
		{
			res.json(successObj);
		});
		uploadThumbNail(newURL)
	});

	ANM.addEventItem(req.params.from_id,"ADD_PHOTO_MESSAGE",{ "url":newURL },function()
	{
		
	});
}


exports.userconversationslist = function(req, res)
{
	MSM.getConversationList(req.params.user_id,function(message_items)
	{
		res.json(message_items);
	});
}

exports.userconversation = function(req, res)
{
	MSM.getConversation(req.params.from_id,req.params.to_id,function(success,messages)
	{
		if(success)
		{
			res.json(messages);
		}else
		{
			res.json([]);
		}
	});
}



exports.userprofileprivate = function(req, res)
{
	var data = new Object();
	data.account_private = (req.params.private == "true")?true:false;
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		res.json(successObj);

		if(data.account_private == true)
		{

		}
	})
}


exports.userfollowingrequests = function(req, res)
{
	MM.getFollowRequests(req.params.user_id,function(request_items)
	{
		MM.joinUsersByUserId(request_items,function(final_items)
		{
			res.json(final_items);
		})
	})
}

exports.userdeleteconversation = function(req, res)
{
	MSM.deleteConversation(req.params.from_id,req.params.to_id,function()
	{
		res.json(successObj)
	});
}



exports.userfollowingforceadd  = function(req, res)
{
	MM.addFollower(req.params.from_id,req.params.to_id,function()
	{
		NM.removeFollowRequest(req.params.from_id,req.params.to_id,function()
		{
			res.json({"success":true,"has_requested":false});

			MM.getMemberInfo(req.params.to_id,function(success,member_item)
			{
				if(member_item)
				{
					addFollowerAcceptedNotification(req.params.from_id,member_item.user_id,member_item.username);
				}
			});

			MM.getMemberInfo(req.params.from_id,function(success,member_item)
			{
				if(member_item)
				{
					addFollowerStartedFollowingNotification(req.params.to_id,member_item.user_id,member_item.username);
				}
			});
		})
	})
}

exports.userfollowingforcedeny  = function(req, res)
{
	MM.addFollowerDenied(req.params.from_id,req.params.to_id,function()
	{
		NM.removeFollowRequest(req.params.from_id,req.params.to_id,function()
		{
			res.json({"success":true,"has_requested":false});
		});
	})
}


exports.userdeletemessage  = function(req, res)
{
	var message = req.body.message;
	MSM.deleteMessage(req.params.user_id,req.params.member_id,Number(String(req.params.date)),message,function()
	{
		res.json(successObj);
	})
}

exports.userscreenshot = function(req, res)
{
	//console.log("user_id " + String(req.params.user_id))
	//console.log("member_id " + String(req.params.member_id))
	res.json({"success":true});

	/*
	MM.getMemberInfo(req.params.user_id,function(success,member_item)
	{
		if(member_item)
		{
			addScreenShotNotification(String(req.params.member_id),member_item.user_id,member_item.username);
		}
	});
	*/

}





exports.syncadnroidusertoken = function(req, res)
{
	// ekWZ4_VrJWo:APA91bEPrNSim6BkkwF3H0bfp0UmLbStgv4wY_y4svH5UDZKmc_JtowwpCnPLgpjC-K_99QP1ltYW3qEJZLsCwjr99hEdAFBOeD7rofbVFs-pZ7Bylxi-XWglCffZWJcGkGRzAaDZq8q


	console.log("syncadnroidusertoken____________________", req.params.token, "  ____user_id____",req.params.user_id)
	var data = new Object();
	data.android_token = req.params.token;
	MM.updateUserProfile(req.params.user_id,data,function()
	{
		res.json({"success":true})
	});
}


exports.recentwall = function(req, res)
{
	
	FM.getSearchWall(function(grid_items)
	{
		res.json(grid_items)
	})

	// GM.getAllGridItems(function(grid_items)
	// {
	// 	res.json(grid_items)
	// })


	// FM.superRecentWall(0,240,function(feed_items)
	// {
	// 	res.json(feed_items);
	// });
}


exports.suggestedposts = function(req, res)
{
	
	FM.superRecentWall(0,240,function(feed_items)
	{
		res.json(feed_items);
	});
}

exports.suggestedpostliked = function(req, res)
{

	var followersA = String(req.body.users).split(",");

	for (var i = 0; i < followersA.length; i++)
	{
		MM.addFollower(req.params.user_id,followersA[i],function()
		{
			
		})
	}

	res. json({"success":true});
}



exports.usernametouserid = function(req, res)
{
	MM.getUserByUserName(req.params.username,function(success,member_item)
	{
		if(success)
		{
			res.json({"success":success, "user_id":member_item.user_id})
		}else{
			res.json({"success":success})
		}
	})
}

exports.usernamesuggest  = function(req, res)
{
	MM.findSuggestedMembers(String(req.params.user_id),String(req.params.search_term),function(member_items)
	{
		res.json(member_items);
	});
}

exports.usernamessuggest  = function(req, res)
{
	
	var tmpA = [];
	FM.feedItem(req.params.feed_id,function(success,feedItem)
	{
		if(success)
		{
			for (var i = 0; i < feedItem.comments.length; i++)
			{
				var object = new Object();
				object.username = feedItem.comments[i].username;
				object.user_id = feedItem.comments[i].user_id;
				tmpA.push(object);
			}
		}

		MM.findSuggestedMembers(String(req.params.user_id),String(req.body.search_term),function(member_items)
		{
			for (var i = 0; i < member_items.length; i++)
			{
				var canDo = true;
				for (var j = 0; j < tmpA.length; j++)
				{
					if(member_items[i].user_id == tmpA[j].user_id)
					{
						canDo = false;
					}
				}
				if(canDo)
				{
					tmpA.push(member_items[i])
				}
			}

			res.json(tmpA);
		});

	});



}

exports.appinstall = function(req, res)
{
	res.json({"success":true});

	ANM.addEventItem("no_user_id","APP_INSTALL",{  },function()
	{
		
	});
}


exports.terms  = function(req, res)
{
	res.render('terms');
}

exports.privacy  = function(req, res)
{
	res.render('privacy');
}

exports.rules  = function(req, res)
{
	res.render('rules');
}

exports.validateusername = function(req, res)
{
	MM.checkUserName(String(req.params.username).toLowerCase(),function(success)
	{
		res.json({"success":success})
	});
}

exports.validateemail = function(req, res)
{
	MM.checkEmail(String(req.params.email).toLowerCase(),function(success)
	{
		res.json({"success":success})
	});
}

exports.forgotpassword = function(req, res)
{
	MM.getPass(String(req.body.email).toLowerCase(),function(success,password)
	{
		if(success)
		{
			EMM.sendReminderEmail(String(req.body.email).toLowerCase(),password,function()
			{
				res.json(successObj);
			})
		}else{
			res.json(successObj)
		}
	});
}


exports.analyticstutorialstep = function(req, res)
{
	ANM.addTutorialEvent(String(req.params.user_id),String(req.params.step),function()
	{
		res.json({"success":true});
	})
}


exports.specs = function(req, res)
{
	res.render('specs');
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




/*
Dave
Sarclayton
Yoshi
jessica
Anthony cools
Sakerok
Girls
Troll
Famemonkey
Sexytime
Shaneo’neal
Planet3
ksis
Vegasben
(american flag emoji)
Deed
erotica
Sniper6
Kevin
Sngshow
Diem
SteveFalconHypnosis
presidenttrump
presidenthillary
*/






function validate_id(id)
{
  if(id == undefined){return false;};
  return !(id !== null && (id.length != 12 && id.length != 24));
}




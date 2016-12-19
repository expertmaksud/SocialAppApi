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
var AM = require('./modules/admin-manager');
var GM = require('./modules/grid-manager');

var ANM = require('./modules/analytics-manager');

var request = require('request');


var successObj = {"success":true};
var failObj = {"success":false};





exports.login = function (req,res)
{
	res.render('admin/login');
}

exports.index = function (req,res)
{
	res.render('admin/index');
}

exports.members = function (req,res)
{
	res.render('admin/members');
}


exports.grid  = function (req,res)
{
	/*
	GM.allGridItems(function(grid_items)
	{
		var data = new Object();
		data.grid_items = grid_items
		res.render('admin/grid',data);
	});
	*/

	FM.getSearchWall(function(grid_items)
	{
		var data = new Object();
		data.grid_items = grid_items;
		res.render('admin/grid',data);
	})
}

exports.feed = function (req,res)
{
	res.render('admin/main-feed');
}

exports.reportedfeed = function (req,res)
{
	res.render('admin/reported-feed');
}


exports.adminreporteditemspaging = function(req, res)
{
	RFM.allFeedItemsPaging(req.params.page,function(feed_items)
	{
		FM.joinFeedItemsAdmin(feed_items,function(feed_items)
		{
			res.json(feed_items);
		})
	});
}

exports.admindismissreporteditem = function(req, res)
{
	RFM.dismissItem(String(req.params.feeditem_id),function()
	{
		res.json({"success":true});
	})
}

exports.admindeletereporteditem = function(req, res)
{
	RFM.dismissItem(String(req.params.report_id),function()
	{
		FM.deleteFeedItem(req.params.feeditem_id,function()
		{
			NM.deleteNotificationsFromFeedItem(req.params.feeditem_id,function()
			{
				res.json(successObj);
			});
		})
	})
}

exports.adminreporteditems = function(req, res)
{
	RFM.allFeedItems(function(feed_items)
	{
		res.json(feed_items);
	});
}


exports.logout = function (req,res)
{
	WTM.clearToken(String(req.params.user_id),function()
	{
		goLogin(res)
	})
}

exports.apilogin = function (req,res)
{
	AM.checkLogin(String(req.body.username),String(req.body.password),function(success,admin_item)
	{
		if(success)
		{
			WTM.createWebToken(admin_item.user_id,function(token)
			{
				res.json({"success":true,token:token, "user_id":admin_item.user_id});
			});
		}else{
			res.json({"success":false})
		}
	})
}


exports.apimembers = function (req,res)
{
	var sort = {"created_at":-1};
	var per_page = Number(req.params.per_page);
	per_page = (per_page < 10)?10:per_page;
	per_page = (per_page > 100)?100:per_page;
	var offset = Number(req.params.offset) * per_page;


	MM.adminMembersList({},sort,offset,per_page,function(success,member_items)
	{
		if(success)
		{
			res.json(member_items);
		}else{
			res.json({"success":false})
		}
	})
}


exports.apimemberstotal = function (req,res)
{
	MM.membersListCount(function(total)
	{
		res.json({"total":total});
	});
}


exports.apimembersearch = function (req,res)
{
	MM.adminSearchMembers(String(req.body.search_term),function(member_items)
	{
		res.json(member_items)
	});
}

exports.memberdetails = function (req,res)
{
	MM.getMemberInfo(String(req.params.member_id),function(success,member_item)
	{
		if(success)
		{
			member_item.member_id = member_item.user_id;
			res.render("admin/member-details",member_item)
		}else{
			goLogin(res)
		}
	});
}


exports.superwall = function (req,res)
{
	var offset = Number(req.params.offset);
	var per_page = Number(req.params.per_page);
	per_page = (per_page < 10)?10:per_page;
	per_page = (per_page > 100)?100:per_page;
	FM.superWall(offset,per_page,function(feed_items)
	{
		res.json(feed_items)
	})
}


exports.apilogins = function (req,res)
{
	var start_date = String(req.params.start_date);
	var end_date = String(req.params.end_date);
	ANM.getLogins(start_date,end_date,function(response_data)
	{
		res.json(response_data);
	})
}

exports.apianalytics = function (req,res)
{
	var start_date = new Date(Number(req.params.start_date));
	var end_date = new Date(Number(req.params.end_date));
	ANM.getEventNames(start_date,end_date,String(req.body.event_name),function(response_data)
	{
		if(req.params.unique == "unique")
		{
			//response_data = filterData(response_data)
		}
		//console.log("LENGTH_______" + response_data.length)

		res.json(response_data);
	})
}


exports.addgrid = function (req,res)
{
	

	//updateFeedItem
	var data = new Object();
	data.admin_visible = true
	data.admin_index = (new Date()).getTime() * -1;

	FM.updateFeedItem(String(req.params.feeditem_id),data,function()
	{
		res.json({"success":true})
	})

	/*
	var data = new Object();
	data.img_url = String(req.body.img_url)
	
	GM.checkIfExists(String(req.body.img_url),function(success)
	{
		if(!success)
		{
			GM.addGridItem(data,function()
			{
				res.json({"success":true});
			})
		}else{
			res.json({"success":true});
		}
	})
	*/
}

exports.allgrid  = function (req,res)
{
	FM.getSearchWall(function(grid_items)
	{
		res.json(grid_items)
	})
	/*
	GM.allGridItems(function(grid_items)
	{
		res.json(grid_items)
	})
	*/
}

exports.updategrid = function(req,res)
{
//res.json({"success":true})
	
	var data = new Object();
	data.admin_index = Number(req.params.index);
	//data.admin_index = (new Date()).getTime() * -1;

	FM.updateFeedItem(String(req.params.feeditem_id),data,function()
	{
		res.json({"success":true})
	})



	/*
	GM.updateGridItem(String(req.params.grid_id),data,function()
	{
		res.json({"success":true});
	})
	*/
}

exports.deletegriditem = function(req,res)
{
	
	var data = new Object();
	data.admin_visible = false
	//data.admin_index = (new Date()).getTime() * -1;

	FM.updateFeedItem(String(req.params.feeditem_id),data,function()
	{
		res.json({"success":true})
	})

	/*
	var data = new Object();
	data.visible = false;

	GM.updateGridItem(String(req.params.grid_id),data,function()
	{
		res.json({"success":true});
	})
	*/
	//GM.getAllMergedGridItems()
}

exports.forceupdate = function(req,res)
{
	GM.getAllMergedGridItems()
	res.json({"success":true});
}


function goLogin(res)
{
	res.writeHead(302,
	{
		'Location': '/adminfm/login'
	});
	res.end();
}



function filterData(dataA)
{
	var unique = {};
	var distinct = [];
	for( var i in dataA ){
	 if( typeof(unique[dataA[i].user_id]) == "undefined"){
	  distinct.push(dataA[i]);
	 }
	 unique[dataA[i].user_id] = 0;
	}

	return distinct
}


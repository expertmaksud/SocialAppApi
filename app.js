
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var admin = require('./routes/admin');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var connect = require('connect');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('jfhsvjfvsjdfvfjhvjhfdvhjfsdfj'));
app.use(express.session());
app.use(express.methodOverride());
app.use(express.bodyParser());




app.use(app.router);


app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env'))
{
	app.use(express.errorHandler());
}

var NM = require('./routes/modules/notifications-manager');
var MM = require('./routes/modules/member-manager');
var FM = require('./routes/modules/feed-manager');
var MSM = require('./routes/modules/messages-manager');
var RFM = require('./routes/modules/report-feeditems-manager');
var EMM = require('./routes/modules/email-manager');
var APNM = require('./routes/modules/apn-manager');
var AM = require('./routes/modules/admin-manager');
var WTM = require('./routes/modules/webtoken-manager');
var AM = require('./routes/modules/aws-manager');

var GM = require('./routes/modules/grid-manager');



var ADM = require('./routes/modules/android-manager');



var DM = require('./routes/modules/db-manager');

app.get('/', routes.index);



var app_token = "lgfwilgfieugiVUKYvjvoz9y89ZJBKbkdjbj3bkkbdv39aoKAKUSB028bskbhjbs";


app.get('/app/*',function(req, res, next)
{
	//console.log("headers____" + req.headers.user_token)
	next();
});



app.post('/app/registermember', routes.registermember);


app.post('/registermember', routes.registermember);

app.post('/app/loginmember', routes.loginmember);

app.post('/loginmember', routes.loginmember);






app.get('/appinstall', routes.appinstall);

app.post('/app/member/search/:user_id',routes.membersearch);


app.get('/app/wall/:user_id',routes.userwall);



app.get('/app/wall/paging/:user_id/:date/:page',routes.userpagewall);


app.get('/app/profile/:user_id',routes.userprofile);



app.get('/app/memberprofile/:user_id/:member_id',routes.memberprofile);


app.get('/app/member/profile/:user_id/:member_id',routes.memberprofile);



app.post('/app/updateprofile/:user_id',routes.updateuserprofile);


app.post('/app/user/profile/update/:user_id',routes.updateuserprofile);




app.post('/app/updatepassword/:user_id',routes.updatepassword);



app.get('/app/user/wall/:user_id/:member_id',routes.userprofilewall);


app.get('/app/user/wall/paging/:user_id/:member_id/:date/:page',routes.userpageprofilewall);



app.get('/app/user/wall/photos/:user_id/:member_id',routes.userprofilewallphotos);


app.get('/app/user/wall/paging/photos/:user_id/:member_id/:date/:page',routes.userpagingprofilewallphotos);



app.get('/app/search/wall/recent/:user_id',routes.recentwall);

app.get('/app/wall/suggested/view/:user_id',routes.suggestedposts);
app.post('/app/wall/suggested/liked/:user_id',routes.suggestedpostliked);








//app.get('/app/user/following/list/:user_id',routes.userlistfollowing);
//app.get('/app/user/followers/list/:user_id',routes.userlistfollowers);


app.get('/app/user/following/list/:user_id/:member_id',routes.userlistfollowing);
app.get('/app/user/followers/list/:user_id/:member_id',routes.userlistfollowers);
app.get('/app/following/add/:from_id/:to_id',routes.addfollowing);
app.get('/app/following/delete/:from_id/:to_id',routes.deletefollowing);
app.get('/app/like/add/:feed_id/:user_id',routes.addlike);
app.get('/app/like/delete/:feed_id/:user_id',routes.deletelike);
app.get('/app/dislike/add/:feed_id/:user_id',routes.adddislike);
app.get('/app/dislike/delete/:feed_id/:user_id',routes.deletedislike);
app.post('/app/comment/add/:feed_id/:user_id',routes.addcomment);
app.get('/app/comment/delete/:feed_id/:comment_id',routes.deletecomment);
app.get('/app/userphoto/:user_id',routes.userphoto);
app.get('/app/user/image/:user_id',routes.userphoto);
app.get('/app/blockuser/:user_id/:member_id',routes.blockuser);
app.get('/app/feeditem/view/:feed_id',routes.feediteminfo);
app.get('/app/feeditem/delete/:feed_id',routes.feeditemdelete);
app.post('/app/feeditem/add/:user_id',routes.userfeedadd);
app.get('/app/feeditem/report/:user_id/:feeditem_id',routes.reportfeeditem);
app.post('/app/topfriends/add/:user_id/:member_id',routes.addtopfriend);
app.get('/app/topfriends/:user_id',routes.usertopfriends);
app.post('/app/topfriends/delete/:user_id/:member_id',routes.deletetopfriends);


app.post('/app/account/delete/:user_id',routes.deleteaccount);


app.get('/app/notifications/:user_id',routes.usernotifications);
app.get('/app/notifications/paging/:user_id/:date/:page',routes.userpagingnotifications);
app.post('/app/notifications/add/:user_id',routes.usernotificationsadd);
app.get('/app/notifications/count/:user_id',routes.usernotificationscount);
app.post('/app/feeditem/add/photo/:user_id',routes.userfeedphotoadd);
app.post('/app/feeditem/add/video/:user_id',routes.userfeedvideoadd);
app.post('/app/user/profile/photo/add/:user_id',routes.userprofilephotoadd);
app.get('/app/user/report/:user_id/:member_id',routes.userreportprofile);
app.get('/app/userphoto/:user_id',routes.userphoto);
app.post('/app/user/message/add/:from_id/:to_id',routes.addmessage);

app.post('/app/user/message/photo/add/:from_id/:to_id',routes.addphotomessage);

app.get('/app/user/conversations/:user_id',routes.userconversationslist);
app.get('/app/user/conversation/:from_id/:to_id',routes.userconversation);


app.get('/app/user/follow/suggest/list/:user_id',routes.recentwall);




app.get('/app/user_id/:username',routes.usernametouserid);



app.get('/app/synctoken/:user_id/:token',routes.syncusertoken);



app.get('/app/sync/android/token/:user_id/:token',routes.syncadnroidusertoken);


app.get('/app/synctoken/android/:user_id/:token',routes.syncadnroidusertoken);


app.get('/app/android/notifications/test/:token',routes.testandroidtoken);


app.get('/app/user/screenshot/:user_id/:member_id',routes.userscreenshot);




app.post('/app/uploadimage',routes.uploadimage);



app.get('/app/user/conversation/delete/:from_id/:to_id',routes.userdeleteconversation);
app.get('/app/user/profile/private/:user_id/:private',routes.userprofileprivate);
app.get('/app/user/following/requests/:user_id',routes.userfollowingrequests);
app.get('/app/user/following/force/add/:from_id/:to_id',routes.userfollowingforceadd);
app.get('/app/user/following/force/deny/:from_id/:to_id',routes.userfollowingforcedeny);


app.post('/app/user/conversation/message/delete/:user_id/:member_id/:date',routes.userdeletemessage);


app.get('/testapp',routes.testapp);


app.post('/forgotpassword',routes.forgotpassword);


app.get('/validateusername/:username',routes.validateusername);


app.get('/validateemail/:email',routes.validateemail);



app.get('/specs',routes.specs);



app.get('/analytics/tutorial/:user_id/:step',routes.analyticstutorialstep);



app.get('/app/friends/suggest/:user_id/:search_term',routes.usernamesuggest);


app.post('/app/friends/suggest/:user_id/:feed_id',routes.usernamessuggest);


app.get('/terms',routes.terms);
app.get('/privacy',routes.privacy);
app.get('/rules',routes.rules);


app.get('/admin/*',function(req, res, next)
{
	next();
});




app.get('/adminfm/*',function(req, res, next)
{
	next();
});



app.get('/admin/user/count',routes.adminusercount);
app.get('/admin/members/paging/:page_index',routes.adminmemberspaging);
app.get('/admin/posts/paging/:page_index',routes.adminpostspaging);
app.get('/admin/profile/:user_id',routes.userprofile);
app.get('/admin/disable/:user_id',routes.userprofiledisable);
app.get('/admin/enable/:user_id',routes.userprofileenable);
app.get('/admin/report/viewed/:feeditem_id',routes.adminviewedpost);
app.get('/admin/report/disable/:feeditem_id',routes.adminhidepost);
app.get('/admin/api/members/list',routes.adminapimembers);
app.get('/admin/index',routes.adminpage);
app.get('/admin/member/details/:user_id',routes.adminmemberpage);



app.get('/admin/api/reported-feed/item/dismiss/:feeditem_id',admin.admindismissreporteditem);
app.get('/admin/api/reported-feed/item/delete/:report_id/:feeditem_id',admin.admindeletereporteditem);







app.get('/adminfm/*',function(req,res,next)
{


	if(req.path == "/adminfm/login")
	{
		next();
	}else{
		if(req.cookies.admin_token)
		{
			WTM.validateUserToken(req.cookies.user_id,req.cookies.admin_token,function(success)
			{
				if(success)
				{
					next();
				}else{
					res.writeHead(302,
					{
						'Location': '/adminfm/login'
					});
					res.end();
				}
			});
		}else{
			res.writeHead(302,
			{
				'Location': '/adminfm/login'
			});
			res.end();
		}

		
	}
	

	//next();
});


app.get('/adminfm/login',admin.login);
app.get('/adminfm/:user_id/logout',admin.logout);
app.get('/adminfm/index',admin.index);



app.get('/adminfm/grid',admin.grid);

app.get('/adminfm/members',admin.members);

app.get('/adminfm/feed',admin.feed);
app.get('/adminfm/reported-feed',admin.reportedfeed);
app.get('/adminfm/member/details/:member_id',admin.memberdetails);





app.get('/adminfm/api/reporteditems/all',admin.adminreporteditems);
app.get('/adminfm/api/reporteditems/page/:page',admin.adminreporteditemspaging);
app.post('/adminfm/api/login',admin.apilogin);
app.get('/adminfm/api/members/:per_page/:offset',admin.apimembers);
app.get('/adminfm/api/members/total',admin.apimemberstotal);
app.get('/adminfm/api/superwall/:offset/:per_page',admin.superwall);
app.post('/adminfm/api/search',admin.apimembersearch);








app.get('/adminfm/api/analytics/logins/:start_date/:end_date',admin.apilogins);


app.post('/adminfm/api/analytics/event/:start_date/:end_date/:unique',admin.apianalytics);



app.get('/admin/api/analytics/logins/:start_date/:end_date',admin.apilogins);


app.post('/admin/api/analytics/event/:start_date/:end_date/:unique',admin.apianalytics);



app.get('/adminfm/api/gridupdate',admin.forceupdate);
app.get('/adminfm/api/grid/add/:feeditem_id',admin.addgrid);

app.get('/adminfm/api/grid/all',admin.allgrid);


app.get('/adminfm/api/grid/update/:feeditem_id/:index',admin.updategrid);


app.get('/adminfm/api/grid/delete/:feeditem_id',admin.deletegriditem);


http.createServer(app).listen(app.get('port'), function()
{
  console.log('Express server listening on port ' + app.get('port'));
});

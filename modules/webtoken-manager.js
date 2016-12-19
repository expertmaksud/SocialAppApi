var moment = require('moment');
var crypto = require('crypto')
var mongo = require('mongodb');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var DM = require('./db-manager');
var CM = require('./customer-manager');
var CalM = require('./calendar-manager');
var webtokens;
var eventEmitter = DM.eventEmitter;
var path = require('path');
var fs = require('fs');
var util = require('util');
//var clone = require('clone');


var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("jkhsfdkjhsdfkljhfBklkjfsjkfskjflsueksekbcksjcb",64,"1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");


eventEmitter.on('database_connected', function()
{
	DM.getCollection('webtokens',function(collection)
	{
		webtokens = collection;
		console.log("webtokens connected");
	});
});


exports.validateUserToken = validateUserToken;
exports.validateToken = validateToken;
exports.createWebToken = createWebToken;
exports.clearToken = clearToken;

function createWebToken(user_id,callback)
{
	var expirationDate = new Date( (new Date()).getTime() + CalM.getOneDayTime() );
	var token = Hashids.encrypt( (new Date()).getTime() );

	var data = new Object();
	data.expiration = expirationDate;
	data.token = token;
	data.user_id = user_id;
	webtokens.update({user_id:user_id}, data,{upsert:true},function()
	{
		callback(token);
	});
}



function validateUserToken(user_id,token,callback)
{
	webtokens.findOne({user_id:user_id,token:token},function(err,webtoken_item)
	{
		if(webtoken_item)
		{
			callback((webtoken_item.expiration > new Date()));
		}else{
			callback(false);
		}
	});
}


function validateToken(token,callback)
{
	webtokens.findOne(
	{
		token:token
	},
	function(err,webtoken_item)
	{
		if(webtoken_item)
		{
			callback(true,webtoken_item.user_id);
		}else{
			callback(false);
		}
	});
}



function clearToken(user_id,callback)
{
	var expirationDate = new Date( (new Date()).getTime() - CalM.getOneDayTime() );
	var data = new Object();
	data.expiration = expirationDate;
	webtokens.update({user_id:user_id}, {$set:data},function()
	{
		callback();
	});
}

















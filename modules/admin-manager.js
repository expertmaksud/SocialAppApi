var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var DM = require('./db-manager');
var AM = require('./aws-manager');
var admin_members;
var eventEmitter = DM.eventEmitter;
var path = require('path');
var util = require('util');


var HashidsNPM = require("hashids");
var Hashids = new HashidsNPM("bldsfkbsuiebfibulb2iubiueksjbcd",10,"1234567890abcdef");

eventEmitter.on('database_connected', function()
{
    DM.getCollection('admin_members',function(collection)
   {
    admin_members = collection;
    console.log("admin_members connected");
   });
});


exports.checkLogin = checkLogin;

function addMember(data, callback)
{
	data.created_at = new Date();
	data.update_at = new Date();

	createHash(function(hash)
	{
		data.user_id = hash;
		admin_members.insert(data, function()
		{
			
			callback();
		});
	});
}


function checkLogin(username,password,callback)
{
	admin_members.findOne(
	{
		"username":username
	},
	function(err,admin_item)
	{
		if(admin_item)
		{
			if(admin_item.password == password)
			{
				callback(true,admin_item);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	})
}




function testIt()
{
	var data = { 
    "username" : "john", 
    "password" : "orangecounty" 
}

addMember(data,function()
{
	console.log("done!")
})
}


//setTimeout(testIt,3000)

function createHash(callback)
{
	getMemberCount(function(sum)
	{
		callback(Hashids.encrypt(Number(sum + 100000)));
	})
}

function getMemberCount(callback)
{
	admin_members.count(function(err,result)
	{
		if(result)
		{
			callback(result);
		}else{
			callback(0)
		}
	})
}
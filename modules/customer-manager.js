var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var DM = require('./db-manager');
var customers;
var events = require('events');
var eventEmitter = DM.eventEmitter;
var path = require('path');

eventEmitter.on('database_connected', function()
{
	DM.getCollection('customers',function(collection)
	{
		customers = collection;
		console.log("customers connected");
	});
});


exports.addCustomerSync = function(data, callback)
{
    data.created_at = new Date();
    data.update_at = new Date();

    customers.insert(data,
    {
        safe: true
    }, callback);
}

exports.getCustomerByEmail = function(email,callback)
{
	customers.findOne({"email":email},function(err,result)
	{

	})
}


exports.upsertCustomer = function(data, callback)
{
	data.last_login = new Date();
	customers.find({"fb_id":data.fb_id},function(err,item)
	{
		if(item)
		{
			customers.update({fb_id:item.fb_id}, {$set: data},callback);
		}else{
			data.created_at = new Date();
			data.update_at = new Date();
			data.type = "none";
			customers.insert(data, callback);
		}
	})
}

exports.customersList = function(callback)
{
	customers.find().toArray(function(err, items)
    {
        callback(items);
    });
}
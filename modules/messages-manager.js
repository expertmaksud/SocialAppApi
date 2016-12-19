var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var database = null;
var DM = require('./db-manager');
var MM = require('./member-manager');
var messages;
var eventEmitter = DM.eventEmitter;
eventEmitter.on('database_connected', function()
{
    DM.getCollection('messages',function(collection)
   {
    messages = collection;
    console.log("messages connected");
   });
});





exports.addMessageToConversation = addMessageToConversation;
exports.getConversation = getConversation;
exports.getConversationList = getConversationList;
exports.deleteConversation = deleteConversation;
exports.upsertMember = upsertMember;
exports.deleteMessage = deleteMessage;
exports.getUnreadCount = getUnreadCount

exports.addPhotoMessageToConversation = addPhotoMessageToConversation;


function upsertMember(user_id,callback)
{
	var data = new Object();
	data.user_id = user_id;
	data.conversations = [];
	data.created_at = new Date();
	data.last_updated = new Date();

	messages.update({"user_id":user_id},{$set:data},{upsert:true},function()
	{
		callback();
	});
}


function addPhotoMessageToConversation(from_id,to_id,url,callback)
{
	var message_data = new Object();
	message_data.created_at = new Date();
	

	message_data.from_id = from_id;
	message_data.to_id = to_id;
	message_data.message = url;
	message_data.type = "photo"



	var from_username = "";
	var to_username = "";

	MM.getUserNameForMessages(from_id,function(success,_from_username)
	{
		from_username = _from_username;
	MM.getUserNameForMessages(to_id,function(success,_to_username)
	{
		to_username = _to_username;
	

		message_data.from_username = from_username;
		message_data.to_username = to_username;


	addMessageToUser(from_id,to_id,message_data,function()
	{

	addMessageToUser(to_id,from_id,message_data,function()
	{

		callback();
	});

	});

	});
	});
}



function addMessageToConversation(from_id,to_id,message,callback)
{
	var message_data = new Object();
	message_data.created_at = new Date();
	

	message_data.from_id = from_id;
	message_data.to_id = to_id;
	message_data.message = message;
	message_data.type = "text"



	var from_username = "";
	var to_username = "";

	MM.getUserNameForMessages(from_id,function(success,_from_username)
	{
		from_username = _from_username;
	MM.getUserNameForMessages(to_id,function(success,_to_username)
	{
		to_username = _to_username;
	

		message_data.from_username = from_username;
		message_data.to_username = to_username;


	addMessageToUser(from_id,to_id,message_data,function()
	{

	addMessageToUser(to_id,from_id,message_data,function()
	{

		callback();
	});

	});

	});
	});
}

function addMessageToUser(user_id,to_id,data,callback)
{
	messages.findOne({user_id:user_id},function(err,message_item)
	{
		if(message_item)
		{
			var didFind = false;
			var messagesA = [];
			for (var i = 0; i < message_item.conversations.length; i++)
			{
				if(message_item.conversations[i].user_id == to_id)
				{
					didFind = true;
					messagesA = messagesA.concat(message_item.conversations[i].messages);
				}
			};

			messagesA.push(data);

			var last_message = (data.type == "text")?data.message:data.type;

			if(didFind)
			{
				messages.update({"user_id":user_id,"conversations.user_id":to_id}, 
					{ 
						$push: { "conversations.$.messages": data },
						$set: { "conversations.$.last_message":last_message, 
								"conversations.$.last_updated":new Date()} 
					},function()
				{
					incReadCountConversation(user_id,to_id,function()
					{
						callback();
					});
				});
			}else{

				var convoData = new Object();
				convoData.user_id = to_id;
				convoData.username = (data.from_id == user_id)?data.to_username:data.from_username;
				convoData.last_updated = new Date();
				convoData.unread_count = 1;
				convoData.last_message = last_message;
				convoData.messages = [];

				convoData.messages.push(data);

				messages.update(
				{
					user_id:user_id
				},
				{ 
					$addToSet:
					{
						conversations: convoData
					} 
				},
				{
					upsert:true
				},function()
					{
						callback();
					});
				}
		}else{
			callback()
		}
	});
}


function deleteMessage(user_id,member_id,date,message,callback)
{
	var MS_PER_MINUTE = 60000;
	var start_date = new Date(date - MS_PER_MINUTE);
	var end_date = new Date(date + MS_PER_MINUTE);

	messages.findOne({"user_id":user_id},function(err,user_item)
	{
		var convo_index = -1;
		for (var i = 0; i < user_item.conversations.length; i++)
		{
			if(user_item.conversations[i].user_id == member_id)
			{
				convo_index = i;
			}
		}

		if(convo_index == -1)
		{
			callback();
			return;
		}

		var index = -1;
		for (var j = 0; j < user_item.conversations[convo_index].messages.length; j++)
		{
			if(user_item.conversations[convo_index].messages[j].message == message)
			{
				index = j;
			}
		}

		if(index == -1)
		{
			callback();
			return;
		}

		user_item.conversations[convo_index].messages.splice(index,1);
		var data = new Object();
		data.conversations = user_item.conversations;

		messages.update({"user_id":user_id},{$set:data},function()
		{
			deleteToMessage(member_id,user_id,date,message,function()
			{
				callback();
			})
		})
	});

	/*
	messages.update({"user_id":user_id,"conversations.user_id":member_id}, { $pull: { "conversations.$.messages":{"message":message, "created_at":{
		$gte:start_date,
		$lte:end_date
	}} }  },function()
	{
		messages.update({"user_id":member_id,"conversations.user_id":user_id}, { $pull: { "conversations.$.messages":{"message":message, "created_at":{
		$gte:start_date,
		$lte:end_date
	}} }  },function()
		{
			callback();
		});
	});
	*/
}

function deleteToMessage(user_id,member_id,date,message,callback)
{
	messages.findOne({"user_id":user_id},function(err,user_item)
	{
		var convo_index = -1;
		for (var i = 0; i < user_item.conversations.length; i++)
		{
			if(user_item.conversations[i].user_id == member_id)
			{
				convo_index = i;
			}
		}

		if(convo_index == -1)
		{
			callback();
			return;
		}

		var index = -1;
		for (var j = 0; j < user_item.conversations[convo_index].messages.length; j++)
		{
			if(user_item.conversations[convo_index].messages[j].message == message)
			{
				index = j;
			}
		}

		if(index == -1)
		{
			callback();
			return;
		}

		user_item.conversations[convo_index].messages.splice(index,1);
		var data = new Object();
		data.conversations = user_item.conversations;

		messages.update({"user_id":user_id},{$set:data},function()
		{
			callback();
		})

	});
}

function deleteConversation(user_id,member_id,callback)
{
	
	messages.update({"user_id":user_id}, { $pull: { "conversations":{"user_id":member_id} }  },function()
	{
		messages.update({"user_id":member_id}, { $pull: { "conversations":{"user_id":user_id} }  },function()
		{
			callback();
		});
	});

	/*
	deleteConversationAgain(to_id,user_id,function()
	{



	messages.findOne({"user_id":user_id},function(err,message_item)
	{
		if(message_item)
		{
			var index = -1;
			for (var i = 0; i < message_item.conversations.length; i++)
			{
				if(message_item.conversations[i].user_id == to_id)
				{
					index = i;
					console.log("found!!" + index)
				}
			};
			if(index > -1)
			{
				console.log("inside!!")
				message_item.conversations.slice(index,1);
				var data = new Object();
				data.conversations = message_item.conversations;
				updateMessageItem(user_id,data,function()
				{
					callback();
				})
			}else{
				callback();
			}
			
		}else{
			callback();
		}
	});

	})
	*/
}

function deleteConversationAgain(user_id,to_id,callback)
{
	messages.findOne({"user_id":user_id},function(err,message_item)
	{
		if(message_item)
		{
			var index = -1;
			for (var i = 0; i < message_item.conversations.length; i++)
			{
				if(message_item.conversations[i].user_id == to_id)
				{
					index = i;
				}
			};
			if(index > -1)
			{
				message_item.conversations.slice(index,1);
				var data = new Object();
				data.conversations = message_item.conversations;
				updateMessageItem(user_id,data,function()
				{
					callback();
				})
			}else{
				callback();
			}
			
		}else{
			callback();
		}
	});
}


exports.updateMessageItem = updateMessageItem;

function updateMessageItem(user_id,data,callback)
{
	messages.update({"user_id":user_id},{$set:data},function()
	{
		callback();
	})
}

function getConversation(user_id,to_id,callback)
{
	messages.findOne({"user_id":user_id},function(err,message_item)
	{
		if(message_item)
		{
			var messagesA = [];
			for (var i = 0; i < message_item.conversations.length; i++)
			{
				if(message_item.conversations[i].user_id == to_id)
				{
					messagesA = messagesA.concat(message_item.conversations[i].messages);
				}
			};

			setReadConversation(user_id,to_id,function()
			{
				callback(true,messagesA);
			});
		}else{
			callback(false);
		}
	});
}

function getConversationList(user_id,callback)
{
	messages.findOne({"user_id":user_id},{"conversations.messages":0},function(err,message_item)
	{
		if(message_item)
		{
			message_item.conversations.sort(function(a,b)
			{
				if(a.last_updated > b.last_updated)
				{
					return -1;
				}else{
					return 1;
				}
			});


			callback(message_item.conversations);
		}else{
			callback([]);
		}
	});
}

function getUnreadCount(user_id,callback)
{
	getConversationList(user_id,function(message_items)
	{
		var chat_count = 0;
         
         for (var  i = 0; i < message_items.length; i++)
         {
             chat_count += (Number(message_items[i]["unread_count"]) > 0)?1:0;
         }

         callback(chat_count);
	})
}

function setReadConversation(user_id,to_id,callback)
{
	messages.update({"user_id":user_id,"conversations.user_id":to_id}, { $set: { "conversations.$.unread_count": 0 } },function()
	{
		callback();
	});
}

function incReadCountConversation(user_id,to_id,callback)
{
	messages.update({"user_id":user_id,"conversations.user_id":to_id}, { $inc: { "conversations.$.unread_count": 1 } },function()
	{
		callback();
	});
}







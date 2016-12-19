var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var DM = require('./db-manager');
var AM = require('./aws-manager');
var FM = require('./feed-manager');
var search_grid;
var eventEmitter = DM.eventEmitter;
var path = require('path');
var util = require('util');


var main_grid;

eventEmitter.on('database_connected', function()
{
    DM.getCollection('pic_grid',function(collection)
   {
    search_grid = collection;
    console.log("grid connected");
   });


     DM.getCollection('main_pic_grid',function(collection)
   {
    main_grid = collection;
    console.log("grid connected");
   });

    
});


function testIt()
{
	var data = new Object()
	data.data = {}
	data.main_id = "123"
	main_grid.insert(data, function(err,grid_items)
		{
			console.log("done!")
		});
}

//setTimeout(testIt,4000)

exports.addGridItem = addGridItem;
exports.allGridItems = allGridItems;
exports.checkIfExists = checkIfExists;
exports.updateGridItem = updateGridItem;

function addGridItem(data, callback)
{
	data.created_at = new Date();
	data.update_at = new Date();
	data.visible = true
	getGridCount(function(count)
	{
		data.index = (new Date()).getTime() * -1;
		
		search_grid.insert(data, function(err,grid_items)
		{
			callback();
		});
	})
}

function checkIfExists(img_url, callback)
{
	search_grid.find({"img_url":img_url,"visible":true}).toArray(function(err, grid_items)
	{
		if(grid_items)
		{
			callback( (grid_items.length > 0) )
		}else{
			callback(false)
		}
	})
}


function allGridItems(callback)
{
	main_grid.findOne({_id:new ObjectId("57ed7fcf402d78da231ae8dc")},function(err,grid_item)
	{
		if(grid_item)
		{
			



			function compare(a,b) {
  if (a.index < b.index)
    return -1;
  if (a.index > b.index)
    return 1;
  return 0;
}
	

	var result = grid_item.data.sort(compare);

			callback(result)
		}else{
			callback([])
		}
	});

	/*
	search_grid.find({"visible":true}).sort({"index":1}).toArray(function(err,grid_items)
	{
		if(grid_items)
		{
			callback(grid_items)
		}else{
			callback([])
		}
	})
	*/
}



function getGridCount(callback)
{
	search_grid.count({"visible":true},function(err,result)
	{
		if(result)
		{
			callback(result);
		}else{
			callback(0)
		}
	});
}


function updateGridItem(grid_id,data,callback)
{
	search_grid.update({_id:new ObjectId(grid_id)},{$set:data},function()
	{
		callback();
	})
}





function testApp()
{
	//joinGridItem
	//console.log("start")
search_grid.find().toArray(function(err, grid_items)
{
	if(grid_items)
	{
		//console.log("?????")
		var count = 0;
		function loadIt()
		{
			
			var data = new Object();
			data.grid_id = String(grid_items[count]._id)


			/*
			updateGridItem(String(grid_items[count]._id),data,function()
			{
				console.log("______________________________",count)
				count++;
				checkInit()
			})
			*/
			
			//console.log("grid_id",grid_items[count]._id)
			FM.joinGridItem(grid_items[count].img_url, function(success,feed_item)
			{
				if(success)
				{
					//console.log(feed_item)
					feed_item.grid_id = String(grid_items[count]._id)
					updateGridItem(String(grid_items[count]._id),feed_item,function()
					{
						//console.log("______________________________",count)
						count++;
						checkInit()
					})

				}
			})
			
		}

		function checkInit()
		{
			if(count < grid_items.length)
			{
				loadIt()
			}else{
				console.log("done!")
			}
		}

		checkInit()
	}else{

	}
})
}


exports.getAllMergedGridItems = getAllMergedGridItems

function getAllMergedGridItems()
{
	
	console.log("getAllMergedGridItems")
	search_grid.find({"visible":true}).sort({"index":1}).toArray(function(err, grid_items)
	{
		if(grid_items)
		{
			FM.joinFeedItemsByImage(grid_items,function(grid_items)
			{
				saveToDisk(grid_items)
			})
		}
	});
}


function saveToDisk(tmpA)
{
	var fs = require('fs');
	

	/*
events_details.update({_id:new ObjectId(_id),"hosters.fb_id":user_item.fb_id}, { $set: {"hosters.$": user_item}},{upsert:true},function()
					{
	*/
	//https://s3-us-west-2.amazonaws.com/pangaeasocial/1475150352679.jpg
	console.log(tmpA[0].content)


	/*
	main_grid.update({_id:new ObjectId("57ed7fcf402d78da231ae8dc"),"main_id":"123"}, { $set: {"data": tmpA}},{upsert:true},
	function()
	{
	
		console.log("updated!")
	});	
	*/
	/*

	fs.writeFile(path.join(__dirname, '/search_grid_main.json'), JSON.stringify(tmpA), function (err)
	{
	  	//console.log("done!!!")
	});
	*/
}

exports.getAllGridItems = getAllGridItems

function getAllGridItems(callback)
{
	


	main_grid.findOne({_id:new ObjectId("57ed7fcf402d78da231ae8dc")},function(err,grid_item)
	{
		if(grid_item)
		{
			


			function compare(a,b) {
  if (a.index < b.index)
    return -1;
  if (a.index > b.index)
    return 1;
  return 0;
}
	

	var result = grid_item.data.sort(compare);

			callback(result)
		}else{
			callback([])
		}
	});


/*
	var fs = require('fs');
	var obj;
	fs.readFile(path.join(__dirname, '/search_grid.json'), 'utf8', function (err, data) {
	  if (err) throw err;
	  obj = JSON.parse(data);

	  //console.log(obj)

	  callback(obj)

	});
*/
}


//setTimeout(getAllMergedGridItems,3000)




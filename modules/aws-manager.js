var AWS = require('aws-sdk');
var path = require('path');
var fs = require('fs');
AWS.config.region = 'us-west-2';
var request = require("request");

var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY ;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY ;
var S3_BUCKET = process.env.S3_BUCKET ;
AWS.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});

/*


AKIAJVV757BNCV3ZXU5Q
Secret Access Key:
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

s3-us-west-2
//AWSAccessKeyId=AKIAJ23U6RMSWUO2ZZTQ
//AWSSecretKey=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
heroku config:set AWS_ACCESS_KEY=AKIAJ23U6RMSWUO2ZZTQ AWS_SECRET_KEY=pOxC0KS2VRpc2GG/ByBEq+azftsbe9gBjuxri5+6
heroku config:set S3_BUCKET = yourpartycdn
https://s3-us-west-2.amazonaws.com/yourpartycdn/testfile.txt

*/


exports.uploadImg = function(filename,folder,callback)
{
	uploadFile(filename,folder,function()
	{
		callback();
	});
}

exports.uploadFile = function(filename,folder,path,callback)
{
	fs.readFile(path, function(err, imgData)
	{
			var s3bucket = new AWS.S3({params: {Bucket: S3_BUCKET + "/" + folder}});
			var data = {Key: filename,
			ACL: 'public-read',
			ContentType:"image/jpg",
			Body:imgData,
			Bucket: 'pangaeasocial'};
			
			s3bucket.putObject(data, function(err, data)
			{
				if (err)
				{
					console.log("Error uploading data: ", err);
				} else
				{
					console.log("Successfully uploaded data to myBucket/myKey");
				}
				callback()
			});
			
		
	});
	
}


exports.uploadDirectly = function(filename,folder,imgData,callback)
{
	var s3bucket = new AWS.S3({params: {Bucket: S3_BUCKET + "/" + folder}});
			var data = {Key: filename,
			ACL: 'public-read',
			ContentType:"image/jpg",
			Body:imgData,
			Bucket: 'pangaeasocial'};
			
			s3bucket.putObject(data, function(err, data)
			{
				if (err)
				{
					console.log("Error uploading data: ", err);
				} else
				{
					console.log("Successfully uploaded data to myBucket/myKey");
				}
				callback()
			});
}




exports.loadImageToAWS = function(url,new_file_name,callback)
{
	request.get({ url: url, encoding: null, timeout:5000 }, 
	function(_err, _res, _body)
	{
		if(_err)
		{
			callback(false);
			return;
		}


		var magic =
		{
		    jpg: 'ffd8ffe0',
		    png: '89504e47',
		    gif: '47494638'
		};
		if(!_err && _res.statusCode == 200)
		{
	        var magicNumberInBody = _body.toString('hex',0,4);
	        if (magicNumberInBody == magic.jpg || 
	            magicNumberInBody == magic.png ||
	            magicNumberInBody == magic.gif)
	        {
	        	
	        	var ext = "png";
	        	ext = (magicNumberInBody == magic.jpg)?"jpg":ext;
	        	ext = (magicNumberInBody == magic.png)?"png":ext;
	        	ext = (magicNumberInBody == magic.gif)?"gif":ext;

	        	



	        	var s3bucket = new AWS.S3({params: {Bucket: S3_BUCKET + "/" + "img"}});
				var data = {Key: new_file_name,
				ACL: 'public-read',
				ContentType:"image/" + ext,
				Body:_body,
				Bucket: 'pangaeasocial'};
				
				s3bucket.putObject(data, function(err, data)
				{
					if (err)
					{
						console.log("Error uploading data: ", err);
					} else
					{
						console.log("Successfully uploaded data to myBucket/myKey");
					}
					callback(true)
				});
	        }else{
	        	callback(false);
	        }
	    }
	});
}
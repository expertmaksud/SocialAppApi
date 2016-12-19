var moment = require('moment');
var crypto = require('crypto')
var mongo = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var mongoUri = process.env.MONGOLAB_URI ;








var database = null;
var events = require('events');
var eventEmitter = new events.EventEmitter();
exports.eventEmitter = eventEmitter;
eventEmitter.setMaxListeners(0)
function connectToDb()
{
    mongo.connect(mongoUri, {}, function(error, db)
    {       
            console.log("db connected, db: " + db);
            database = db;

            //customers = database.collection('customers');
            if(mongoUri.getUsername != null)
            {
                database.authenticate(mongoUri.getUsername(), mongoUri.getPassword());
            }
            database.addListener("error", function(error)
            {
                console.log("Error connecting to MongoLab");
            });
            eventEmitter.emit('database_connected');
});
}

exports.getCollection = function(name, callback)
{
    collection = database.collection(name);
    callback(collection)
}
exports.getDB = function()
{
    return database;
}

exports.getMongoUri = function()
{
    return mongoUri;
}

setTimeout(connectToDb,10);
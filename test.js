
var MongoClient = require("mongodb").MongoClient;
var assert = require('assert');

 let uri = 'mongodb://Admin:root95@ds137634.mlab.com:37634/nba';


 // set up a command function
 function getDbStats(db, callback) {
   db.command({'top': 1}, function(err, results) {
     console.log(results);
     callback();
   });
 };


// Database Name
const dbName = 'nba';

// Create a new MongoClient
const client = new MongoClient(uri);

const findDocuments = function(db, callback) {
  // Get the documents collection
  const collection = db.collection('Actions');
  // Find some documents

var myrequest = {"TeamName" : "New York Knicks"}

    collection.find(myrequest).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

// Use connect method to connect to the Server
  client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);

 getDbStats(db, function() {
    client.close();
  });
});

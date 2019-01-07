const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const bodyParser= require('body-parser');
const MongoClient = require('mongodb').MongoClient;

var db

let uri = 'mongodb://Admin:root95@ds137634.mlab.com:37634/nba';

MongoClient.connect(uri, (err, database) => {
	if (err) return console.log(err)
  	db = database.db('nba')
  	app.listen(process.env.PORT || 3000, () => {
    console.log('listening on 3000')
  })
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')));


app.get("/", (req, res) => {
    //res.sendFile(__dirname + "/index.html");
    var result = []
    res.render('index.ejs', {Actions: result})
});

app.get("/getMinutes", (req, res) => {
    //res.sendFile(__dirname + "/index.html");
    var result = []
    res.render('index.ejs', {ActionsMin: result})
});


app.post('/', (req, res) => {
  var teamName = req.body.TeamName;
  var PlayerName = req.body.PlayerName;


    var query = {"TeamName" : teamName};


		console.log(query)
    //{"title" : {'$regex': title, '$options': 'i'}, "type" : {'$regex': type, '$options': 'i'},"authors" : {'$regex': author, '$options': 'i'}};


  db.collection('Actions').find(query).toArray((err, result) => {
    if (err) return console.log(err)
    db.collection('Actions').find(query).count().then(numItems => {
      console.log(numItems);
    })
    res.render('index.ejs', {Actions: result})
  //console.log(result);
  });

});

app.post('/getMinutes', (req, res) => {
  var teamName = req.body.TeamName;
  var minutes = req.body.Minutes;


    var query = {"TeamName" : teamName};


		console.log(query)
    //{"title" : {'$regex': title, '$options': 'i'}, "type" : {'$regex': type, '$options': 'i'},"authors" : {'$regex': author, '$options': 'i'}};


  db.collection('Actions').find(query).toArray((err, result) => {
    if (err) return console.log(err)
    db.collection('Actions').find(query).count().then(numItems => {
      console.log(numItems);
    })
    res.render('index.ejs', {ActionsMin: result})
  //console.log(result);
  });

});

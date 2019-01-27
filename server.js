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
    res.render('index.ejs', {Actions: result})
});

app.get("/classementJoueur", (req, res) => {

	if(req.query.PlayerName) // HELP OSSAMA
 	{
		db.collection('Actions').aggregate([ { $match : {

			"PlayerName":  req.query.PlayerName
			 }},

			{
				$group : {
					 _id :{id: "$Game.GameId" , game:"$Game"},
					 Pts:{$sum:"$Points"},
					 Rebounds:{$sum:"$TotalRebounds"},
					 Assists:{$sum:"$Assists"}

					 // ... rajouter toutes les autres stats
				}
			}

		]).toArray((err, result) => {
		if (err) return console.log(err)
		result.SearchedPlayer = req.query.PlayerName;
		res.render('classementJoueur.ejs', {Players: [],Player: result})
		console.log(result);
		});
 	}


 	else
 			{
    var query =
      {
        $group : {
           _id : "$PlayerName",
           Pts:{$sum:"$Points"},
           count: { $sum: 1 }

           // ... rajouter toutes les autres stats
        }
      };

    var sort =   {
         Pts:-1
      };

    db.collection('Actions').aggregate([{
        $group : {
           _id : "$PlayerName",
           Pts:{$sum:"$Points"},
           Rebounds:{$sum:"$TotalRebounds"},
           Assists:{$sum:"$Assists"},
           count: { $sum: 1 }

           // ... rajouter toutes les autres stats
        }
      }]).sort(sort).toArray((err, result) => {
    if (err) return console.log(err)
    res.render('classementJoueur.ejs', {Players: result, Player: []})
  console.log(result);
  });

}
});


app.get("/classementEquipe", (req, res) => {

   if(req.query.TeamName)
    {
        db.collection('Actions').aggregate([ { $match : {

          "TeamName":  req.query.TeamName
       }},

      {
        $group : {
           _id :{id: "$Game.GameId" , game:"$Game"},
           Pts:{$sum:"$Points"}
           // ... rajouter toutes les autres stats
        }
      }

   ]).toArray((err, result) => {
    if (err) return console.log(err)
		result.SearchedTeamName = req.query.TeamName;
    res.render('classementEquipe.ejs', {Teams: [],Team: result})
  console.log(result);
  });
    }


    else
        {
db.collection('Actions').mapReduce(
    function () {
        emit(this.TeamName,this.Points)
    },
    function (k, v) {
    return Array.sum(v);

    },
    { out: { inline: 1 } },
    function (err, result) {

        if (result) {
            res.render('classementEquipe.ejs', {Teams: result, Team:[]});
        }
    }
);
        }
});


app.get("/JoueurSaison", (req, res) => {

	if(req.query.PlayerName) 
 	{
		db.collection('Actions').aggregate([   
      { $match : { 
           "PlayerName":req.query.PlayerName
       }},
       {
        $group : {
           _id : "$PlayerName", 
           Games: { $sum: 1 },
           Pts:{$sum:"$Points"},
           TotalRebounds:{ $sum: "$TotalRebounds" },
           TotalAssists:{ $sum: "$Assists" },
           TotalSteals:{ $sum: "$Steals" },
           TotalBlockedShots:{ $sum: "$BlockedShots" },
        }
    },
     { "$addFields": {
         Pts:{$sum:"$Points"},

        "Pts Per Game": { "$divide": ["$Pts", "$Games"] },
        "Rebounds Per Game": { "$divide": ["$TotalRebounds", "$Games"] },
        "Assists Per Game": { "$divide": ["$TotalAssists", "$Games"] },
        "Steals Per Game": { "$divide": ["$TotalSteals", "$Games"] },
        "BlockedShots Per Game": { "$divide": ["$TotalBlockedShots", "$Games"] },

    }}
    
 ]).toArray((err, result) => {
		if (err) return console.log(err)
		result.SearchedPlayer = req.query.PlayerName;
		res.render('JoueurSaison.ejs', {Player: result})
		console.log(result);
		});
 	}


 	else
 			{
    res.render('JoueurSaison.ejs', {Players: [], Player: []})


            }
});

app.get("/EquipeSaison", (req, res) => {

    if(req.query.TeamName)
        {
            db.collection('Actions').mapReduce(
    function () {
               k = {GameId:this.TeamName};
       v = {
           Points:this.Points,
           OffensiveRebounds:this.OffensiveRebounds,
           DefensiveRebounds:this.DefensiveRebounds,
           TotalRebounds:this.TotalRebounds,
           BlockedShots:this.BlockedShots,
           ThreePointMade:this.ThreePointMade,
           };
       emit(k,v);
    },
    function (key, values) {
    reducedVal = { Points: 0, 
                   Actions: 0,
                   OffensiveRebounds:0,
                   DefensiveRebounds:0,
                   TotalRebounds:0,
                   BlockedShots:0,
                   ThreePointMade:0 };
    for (var idx = 0; idx < values.length; idx++) {
     reducedVal.Points += values[idx].Points;
     reducedVal.OffensiveRebounds += values[idx].OffensiveRebounds;
     reducedVal.DefensiveRebounds += values[idx].DefensiveRebounds;
     reducedVal.TotalRebounds += values[idx].TotalRebounds;
     reducedVal.BlockedShots += values[idx].BlockedShots;
     reducedVal.ThreePointMade += values[idx].ThreePointMade;
     reducedVal.Actions += 1; 
    }
    reducedVal.PtsGame = reducedVal.Points /( reducedVal.Actions / 13 ) ;
    reducedVal.OffensiveReboundsGame = reducedVal.OffensiveRebounds /( reducedVal.Actions / 13 ) ;
    reducedVal.DefensiveReboundsGame = reducedVal.DefensiveRebounds /( reducedVal.Actions / 13 ) ;
    reducedVal.TotalReboundsGame = reducedVal.TotalRebounds /( reducedVal.Actions / 13 ) ;
    reducedVal.BlockedShotsGame = reducedVal.BlockedShots /( reducedVal.Actions / 13 ) ;
    reducedVal.ThreePointMadeGame = reducedVal.ThreePointMade /( reducedVal.Actions / 13 ) ;

    return reducedVal;

    },
    {query:{TeamName:req.query.TeamName}, out: { inline: 1 } },
    function (err, result) {

        if (result) {
            res.render('EquipeSaison.ejs', {Team: result});
        }
    }
);
        }
    else
        {
            res.render('EquipeSaison.ejs', {Team:[]});
        }
});


app.get("/Admin", (req, res) => {

 db.command({ dbStats: 1 }, function (err, result) {
         console.log(result);
         res.render('Admin.ejs', {Server: result})

        });


});

app.get("/Mvp", (req, res) => {

  
db.collection('Actions').aggregate([   
       {
        $group : {
           _id : "$PlayerName", 
           count: { $sum: 1 },
           Pts:{$sum:"$Points"},
           TotalRebounds:{ $sum: "$TotalRebounds" },
           TotalAssists:{ $sum: "$Assists" },
           TotalSteals:{ $sum: "$Steals" },
           TotalBlockedShots:{ $sum: "$BlockedShots" },
        }
    },
     { "$addFields": {
         
        "PtsGame": { "$divide": ["$Pts", "$count"] },
        "ReboundsGame": { "$divide": ["$TotalRebounds", "$count"] },
        "AssistsGame": { "$divide": ["$TotalAssists", "$count"] },
        "StealsGame": { "$divide": ["$TotalSteals", "$count"] },
        "BlockedShotsGame": { "$divide": ["$TotalBlockedShots", "$count"] },
    }},
    {"$addFields":{
     "GlobalStats": { "$add": [ "$PtsGame", "$ReboundsGame", "$AssistsGame","$StealsGame","$ReboundsGame", "$BlockedShotsGame"] } 

    }},
    {
        "$sort":{GlobalStats:-1}
        },
    {
        "$limit":1
        }
    
 ]).toArray((err, result) => {
		if (err) return console.log(err)
		result.SearchedPlayer = req.query.PlayerName;
		res.render('Mvp.ejs', {Player: result})
		console.log(result);
		});

});

/* Post */


app.post('/', (req, res) => {
  var teamName = req.body.TeamName;
  var PlayerName = req.body.PlayerName;


    var query = {"TeamName" : teamName};

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
    res.render('index.ejs', {Actions: result})
  //console.log(result);
  });

});

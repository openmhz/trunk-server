var ObjectID = require('mongodb').ObjectID;
var db = require('./db');
const express = require("express");
const path = require("path");
const secrets = require("./config/secrets");
const configureExpress = require("./config/express");


// -------------------------------------------

const app = express()

// -------------------------------------------

// -------------------------------------------

// Connect to Mongo on start
db.connect(function (err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  }
})
// -------------------------------------------

const isDev = process.env.NODE_ENV === "development"








// -------------------------------------------


configureExpress(app)


function getCard(req, res, next) {
  var objectId = req.params.id;
  try {
    var o_id = ObjectID.createFromHexString(objectId);
  } catch (err) {
    console.warn("Error - /card/:id generating ObjectID " + err);
    res.status(500);
    res.send(JSON.stringify({
      error: err,
      "_id": objectId
    }));
    return;
  }

  db.get().collection('calls', function (err, transCollection) {
    transCollection.findOne({
      '_id': o_id
    },
      function (err, item) {
        if (item) {
          var time = new Date(item.time);
          var timeString = time.toLocaleTimeString("en-US");
          var dateString = time.toDateString();
          res.render('card.ejs', {
            item: item,
            url: item.url,
            time: timeString,
            date: dateString
          });
        } else {
          console.warn("Error - /card/:id Could not find Item " + err);
          res.send(404, 'Sorry, we cannot find that!');
        }
      });
  });
}

/*
exports.get_card = function(req, res) {
  var objectId = req.params.id;
  try {
      var o_id = ObjectID.createFromHexString(objectId);
  } catch (err) {
      console.warn("Error - /card/:id generating ObjectID " + err);
      res.status(500);
      res.send(JSON.stringify({
          error: err,
          "_id": objectId
      }));
      return;
  }
  db.get().collection('calls', function(err, transCollection) {
      transCollection.findOne({
              '_id': o_id
          },
          function(err, item) {
              //console.log(util.inspect(item));
              if (item) {
                  var time = new Date(item.time);
                  var timeString = time.toLocaleTimeString("en-US");
                  var dateString = time.toDateString();
                  res.render('card', {
                      item: item,
                      channel: channels[item.talkgroupNum],
                      time: timeString,
                      date: dateString
                  });
              } else {
                  console.warn("Error - /card/:id Could not find Item " + err);
                  res.send(404, 'Sorry, we cannot find that!');
              }
          });
  });
}
*/

function getCalls(req, res, next) {
  for (const key in req.query) {
    console.log(key, req.query[key])
  }
  if (req.query && req.query["call-id"]) {
    const callId = req.query["call-id"];
    res.render("index.ejs", { PUBLIC_URL: "/", REACT_APP_SITE_NAME: process.env["REACT_APP_SITE_NAME"], REACT_APP_BACKEND_SERVER: process.env["REACT_APP_BACKEND_SERVER"], CALL_ID: callId, CALL_URL: "https://s3.us-west-1.wasabisys.com/openmhz-west/media/dcfd-1039-1613917169.m4a" })
  } else {
    next()
  }

}
// -------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

app.get("/systems/:shortName", getCalls)
app.get("/cards/:id", getCard)

app.get("*", (req, res, next) => {
  res.sendFile(__dirname + '/public/index.html');
});

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
  if (err) {
    console.err(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})

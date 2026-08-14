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
          var timeString = time.toLocaleTimeString('en-US', { timeZone: "America/New_York" });
          var dateString = time.toLocaleDateString('en-US', { timeZone: "America/New_York" });
          //console.log(item)
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
/*
*/
const dateRange = (start, end) => {
  if (start.getYear() != end.getYear()) {
    return { "part1": start.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", year: "numeric", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };
  } else if (start.getMonth() != end.getMonth()) {
    return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

  } else if (start.getDay() != end.getDay()) {
    return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleDateString('en-us', { weekday: "short", day: "numeric" }) + " " + end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

  } else {
    return { "part1": start.toLocaleDateString('en-us', { weekday: "short", month: "short", day: "numeric" }) + " " + start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), "part2": end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) };

  }
}

async function getCalls(req, res, next) {

  if (req.query && req.query["call-id"]) {

    var objectId = req.query["call-id"];
    try {
      var o_id = ObjectID.createFromHexString(objectId);
    } catch (err) {
      next()
      return;
    }

    try {
      db.get().collection('calls', function (err, transCollection) {
        transCollection.findOne({
          '_id': o_id
        },
          async function (err, item) {
            if (item) {
              var time = new Date(item.time);
              var timeString = time.toLocaleTimeString('en-US', { timeZone: "America/New_York" });
              var dateString = time.toDateString('en-US', { timeZone: "America/New_York" });
              //console.log(item)
              const tg_coll = db.get().collection('talkgroups');
              const tg = await tg_coll.findOne({ "num": item.talkgroupNum, 'shortName': req.params.shortName.toLowerCase() })
              var title = item.len + " second transmission"

              if (tg) {
                //console.log(tg)
                title = tg.description;
              }
              const callId = req.query["call-id"];
              const callUrl = "https://s3.us-west-1.wasabisys.com/openmhz-west/media/dcfd-1039-1613917169.m4a"
              const twitterMeta = `
            <meta name="twitter:card" content="player"/>
            <meta name="twitter:site" content="@openmhz"/>

            <meta name="twitter:title" content="${title}"/>
            <meta name="twitter:description" content="${timeString} ${dateString}" />
            <meta name="twitter:image" content="https://openmhz.com/radio-400x400.jpg"/>
            <meta name="twitter:player" content="${process.env['REACT_APP_FRONTEND_SERVER']}/cards/${callId}"/>
            <meta name="twitter:player:stream" content="${item.url}"/>
            <meta name="twitter:player:stream:content_type" content="audio/mp4"/>
            <meta name="twitter:player:width" content="425"/>
            <meta name="twitter:player:height" content="165"/>`
              res.render("index.ejs", { TWITTER_META: twitterMeta })
            } else {
              console.warn("Error - /card/:id Could not find Item " + err);
              res.send(404, 'Sorry, we cannot find that!');
            }
          });
      });

    } catch (err) {
      console.error(err);
      next()
      return;
    }


  } else {
    next()
  }

}
// -------------------------------------------
// index.html must never come from cache. It is the file that names the current
// hashed bundle, so a stale copy pins the browser to an old build of the app -
// the deploy looks correct on the server while the browser keeps running the
// previous code, and a normal reload will not necessarily notice. The hashed
// files under /static are content-addressed, so those can cache hard.
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    } else if (filePath.includes(path.sep + "static" + path.sep)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  }
}));

//app.get("/system/:shortName", getCalls)
//app.get("/cards/:id", getCard)



app.get("*", (req, res, next) => {
  // Same reasoning as above: this SPA fallback serves that same index.html.
  // cacheControl must be off, otherwise sendFile writes its own Cache-Control
  // header and overwrites the one set here.
  res.sendFile(__dirname + '/public/index.html', {
    cacheControl: false,
    headers: { "Cache-Control": "no-cache, must-revalidate" }
  });
});

// start listening to incoming requests
app.listen(app.get("port"), app.get("host"), (err) => {
  if (err) {
    console.err(err.stack)
  } else {
    console.log(`App listening on port ${app.get("port")} [${process.env.NODE_ENV} mode]`)
  }
})

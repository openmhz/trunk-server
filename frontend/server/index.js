var ObjectID = require('mongodb').ObjectID;
var db = require('./db');
const express = require("express");
const path = require("path");
const secrets = require("./config/secrets");
const configureExpress = require("./config/express");
const { Podcast, Item, FeedOptions } = require('podcast');

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
async function getPodcast(req, res, next) {
  const now = new Date().toLocaleString();

  const feedStart = `
  <rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:psc="http://podlove.org/simple-chapters" xmlns:podcast="https://podcastindex.org/namespace/1.0" version="2.0">
  <channel>
  <title>
  <![CDATA[ OpenMHz ]]>
  </title>
  <description>
  <![CDATA[ Real public safety radio recordings, from across the country. <a href="hhtps://openmhz.com">OpenMHz</a> is a website that makes it easy to share recordings of public safety radio system. This podcast is a collection of interesting events that has been curated by the OpenMHz community. ]]>
  </description>
  <link>https://openmhz.com</link>
  <generator>Podcast for Node</generator>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="https://openmhz.com/rss.xml" rel="self" type="application/rss+xml"/>
  <author>
  <![CDATA[ OpenMHz ]]>
  </author>
  <pubDate>${now}</pubDate>
  <copyright>
  <![CDATA[ &#169; 2023 Robotastic ]]>
  </copyright>
  <language>
  <![CDATA[ en ]]>
  </language>
  <ttl>60</ttl>
  <itunes:author>OpenMHz</itunes:author>
  <itunes:subtitle>I am a sub title</itunes:subtitle>
  <itunes:summary>Real public safety radio recordings, from across the country. OpenMHz is a website that makes it easy to share recordings of public safety radio system. This podcast is a collection of interesting events that has been curated by the OpenMHz community.</itunes:summary>
  <itunes:owner>
  <itunes:name>Luke Berndt</itunes:name>
  <itunes:email>luke@robotastic.com</itunes:email>
  </itunes:owner>
  <itunes:explicit>false</itunes:explicit>
  <itunes:category text="Government"/>
  <itunes:category text="Daily News"/>
  <itunes:category text="True Crime"/>
  <itunes:image href="https://openmhz.com/podcast/cover.png"/>
  `



  const feedEnd = `
</channel>
</rss>
`
  let xml = feedStart;
  try {
    const podcastsCollection = db.get().collection('podcasts');
    podcastsCollection.find().toArray(function (err, podcasts) {


      for (const podcast of podcasts) {
        let description = podcast.description + "\n\nRadio Systems: \n";
        for (const system of podcast.systems) {
          description = description + " - " + system + "\n";
        }
        xml = xml + `
<item>
<title>
<![CDATA[ ${podcast.title} ]]>
</title>
<description>
<![CDATA[ ${description} ]]>
</description>
<guid isPermaLink="false">${podcast.downloadUrl}</guid>
<dc:creator>
<![CDATA[ OpenMHz ]]>
</dc:creator>
<url>${podcast.eventUrl}</url>
<pubDate>${podcast.startTime}</pubDate>
<enclosure url="${podcast.downloadUrl}" length="0" type="audio/mp4"/>
<itunes:author>OpenMHz</itunes:author>
<itunes:summary>${description}</itunes:summary>
<itunes:explicit>false</itunes:explicit>
</item> 
`
      }


      xml = xml + feedEnd;
      res.set('Content-Type', 'text/xml');
      res.send(xml);
    });

  } catch (err) {
    console.error(err);
    return;
  }
}*/


async function getPodcast(req, res, next) {
  const now = new Date();
  try {
    const podcastsCollection = db.get().collection('podcasts');
    podcastsCollection.find().toArray(function (err, podcasts) {
      const feed = new Podcast({
        title: 'OpenMHz',
        description: 'Real public safety radio recordings, from across the country. OpenMHz is a website that makes it easy to share recordings of public safety radio system. This podcast is a collection of interesting events that has been curated by the OpenMHz community.',
        feedUrl: 'https://openmhz.com/rss.xml',
        siteUrl: 'https://openmhz.com',
        imageUrl: 'https://openmhz.com/podcast/cover.png',
        author: 'OpenMHz',
        copyright: '&#169; 2022 Robotastic',
        language: 'en',
        pubDate: 'May 20, 2012 04:00:00 GMT',
        ttl: 60,
        itunesAuthor: 'OpenMHz',
        itunesSubtitle: 'I am a sub title',
        itunesSummary: 'Real public safety radio recordings, from across the country. OpenMHz is a website that makes it easy to share recordings of public safety radio system. This podcast is a collection of interesting events that has been curated by the OpenMHz community.',
        itunesOwner: { name: 'Luke Berndt', email: 'luke@robotastic.com' },
        itunesExplicit: false,
        itunesCategory: [{
          text: 'Government'
        }, { text: "Daily News" }, { text: "True Crime" }],
        itunesImage: 'https://openmhz.com/podcast/cover.png'
      });
      for (const podcast of podcasts) {
        let description = podcast.description + `

Radio Systems:
`;
        for (const system of podcast.systems) {
          description = description + " - " + system + "\n"
        }
        feed.addItem({
          title: podcast.title,
          description: description,
          enclosure: {
            url: podcast.downloadUrl, // link to the item
          },
          author: 'OpenMHz', // optional - defaults to feed author property
          url: podcast.eventUrl,
          date: podcast.startTime, // any format that js Date can parse.
          itunesAuthor: 'OpenMHz',
          itunesExplicit: false,
          itunesSummary: description,
          itunesDuration: podcast.len
        });
      }
      const xml = feed.buildXml();
      res.set('Content-Type', 'text/xml');
      res.send(xml);
    });

  } catch (err) {
    console.error(err);
    return;
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
app.use(express.static(path.join(__dirname, "public")));

//app.get("/system/:shortName", getCalls)
//app.get("/cards/:id", getCard)


app.get("/rss.xml", getPodcast);

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

const Talkgroup = require("../models/talkgroup");
const System = require("../models/system");
const fs = require('fs-extra');
const {parse} = require('csv-parse');

exports.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect(account_server + "/login");
};

//router.get("/tg_export/:shortName", isLoggedIn, function(req, res) {
exports.exportTalkgroups = function (req, res, next) {
  process.nextTick(async function () {
    const system = await System.findOne({ shortName: req.params.shortName.toLowerCase() });
    if (!system) {
      res.status(404);
      res.json({
        success: false,
        message: "That Short Name does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      res.status(401);
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }
    const talkgroups = await Talkgroup.find({ shortName: req.params.shortName.toLowerCase() })

    if (!talkgroups || !Array.isArray(talkgroups)) {
      console.error(err);
      res.json({
        success: false,
        message: "Talkgroups were not found."
      });
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv");
    talkgroups.forEach(function (item) {
      /*  res.write('"' + item.num + '", "'
                      + item.mode + '", "'
                      + item.alpha + '", "'
                      + item.description + '", "'
                      + item.tag + '", "'
                      + item.group + '", "'
                      + item.priority+ '"\r\n');*/
      if (item) {
        var sending = "";
        sending = item.num + ", ";
        if (item.mode) {
          sending = sending + item.mode.toString().replace(/\,/g, "") + ", ";
        } else {
          sending = sending + " ,";
        }
        if (item.alpa) {
          sending = sending + item.alpha.toString().replace(/\,/g, "") + ", ";
        } else {
          sending = sending + " ,";
        }
        if (item.description) {
          sending = sending + item.description.toString().replace(/\,/g, "") + ", ";
        } else {
          sending = sending + " ,";
        }
        if (item.tag) {
          sending = sending + item.tag.toString().replace(/\,/g, "") + ", ";
        } else {
          sending = sending + " ,";
        }
        if (item.group) {
          sending = sending + item.group.toString().replace(/\,/g, "") + ", ";
        } else {
          sending = sending + " ,";
        }
        if (item.priority) {
          sending = sending + item.priority.toString().replace(/\,/g, "") + "\r\n";
        } else {
          sending = sending + "\r\n";
        }
        res.write(sending);

      }
    });

    res.end();
  }
  );
}

async function csv_import(shortName, filename, callback) {
  var talkgroups = [];
  const count = await Talkgroup.deleteMany({ shortName: shortName });

  var parser = parse(
    {
      columns: [
        "num",
        "mode",
        "alpha",
        "description",
        "tag",
        "group",
        "priority"
      ]
    },
    async function (err, data) {
      if (err) {
        console.error("Error: csv import 2: " + err);
        callback(err, null);
      } else {
        var response = [];
        for (var i = 0; i < data.length; i++) {
          var row = data[i];
          row.num = parseInt(row.num);
          row.tag = row.tag.toLowerCase();
          row.group = row.group.toLowerCase();
          var newTg = new Talkgroup();
          newTg.num = row.num;
          newTg.alpha = row.alpha;
          newTg.mode = row.mode;
          newTg.description = row.description;
          newTg.tag = row.tag;
          newTg.group = row.group;
          newTg.priority = row.priority;
          newTg.shortName = shortName;

          await newTg.save().catch(err => {
            console.log("Error: CSV import: " + err);
            callback(err, null);
          });

          response.push(row);
        }
        callback(null, response);
      }
    }
  );
  fs.createReadStream(filename).pipe(parser);
}


//router.post("/tg_import/:shortName", isLoggedIn, upload.single('file'), function(req, res, next) {
exports.importTalkgroups = function (req, res, next) {
  process.nextTick(async function () {
    const system = await System.findOne({ shortName: req.params.shortName.toLowerCase() }).catch(err => {
      res.status(500);
      console.error("Error - importTalkgroups: " + err);
      res.json({ success: false, message: err });
      return;
    });

    if (!system) {
      console.error("Error - importTalkgroups: System not found - " + req.params.shortName.toLowerCase());
      res.status(404);
      res.json({
        success: false,
        message: "That Short Name does not exist."
      });
      return;
    }
    if (!system.userId.equals(req.user._id)) {
      console.error("Error - importTalkgroups: you are not the user for hte system: " + req.user._id);
      res.status(401);
      res.json({
        success: false,
        message: "You are not the user associated with this system."
      });
      return;
    }
    if (!req.file || req.file.size === 0) {
      console.error("Error - File is bad. Size");
      res.status(500);
      res.json({ success: false, message: "Please select a file." });
      return;
    }

    fs.exists(req.file.path, function (exists) {
      if (exists) {
        csv_import(system.shortName, req.file.path, function (err, data) {
          if (err) {
            console.error("Erorr - CSV import, callback: " + err);
            res.status(500);
            res.json({ success: false, message: err });
            res.end();
            return;
          } else {
            res.json( data );
            return;
          }
        });
      } else {
        res.status(500);
        console.error("Error - importTalkgroups: no file");
        res.end(
          "Well, there is no magic for those who don’t believe in it!"
        );
      }
    });
  }
  );
};


// -------------------------------------------

exports.fetchTalkgroups = async function (req, res, next) {
  const talkgroups = await Talkgroup.find({ shortName: req.params.shortName.toLowerCase() }).catch(err => {
    console.error(err);
    res.status(500);
    res.json({ success: false, message: err });
    return;
  });

  res.json(talkgroups );
  return;
}

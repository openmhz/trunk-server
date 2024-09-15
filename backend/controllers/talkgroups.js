const Talkgroup = require("../models/talkgroup");
const Group = require("../models/group");

let groups = {};
let talkgroups = {};

async function load_talkgroups(shortName) {
    const tg_results = await Talkgroup.find({ 'shortName': shortName }).catch(err => {
        console.error(err);
        res.status(500);
        res.json({ success: false, message: err });
        return;
    });

    let temp = {}
    for (var tg in tg_results) {
        var talkgroup = { _id: tg_results[tg]._id, num: tg_results[tg].num, alpha: tg_results[tg].alpha, description: tg_results[tg].description }
        temp[tg_results[tg].num] = talkgroup;
    }

    return temp;
}

exports.get_talkgroups = async function (req, res) {
    const shortName = req.params.shortName.toLowerCase();
/*
    if (talkgroups.hasOwnProperty(shortName)) {
        talkgroups = talkgroups[shortName];
    } else {
    }*/
       
    let talkgroups = await load_talkgroups(shortName);

    res.contentType('json');
    res.send(JSON.stringify({
        talkgroups: talkgroups
    }));
}


exports.get_groups = async function (req, res) {
    const shortName = req.params.shortName.toLowerCase();

    const grp_results = await Group.find({ shortName: req.params.shortName.toLowerCase() }).sort("position").catch(err => {
        console.error(err);
        res.status(500);
        res.json({ success: false, message: err });
        return;
    });

    res.contentType('json');
    res.send(JSON.stringify(grp_results));
}

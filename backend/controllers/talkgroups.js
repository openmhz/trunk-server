const Talkgroup = require("../models/talkgroup");

exports.get_talkgroups = async function (req, res) {
    const tg_results = await Talkgroup.find({ 'shortName': req.params.shortName.toLowerCase()}).catch(err => {
        console.error(err);
        res.status(500);
        res.json({ success: false, message: err });
        return;
      });
      
    var talkgroups = {};
    for (var tg in tg_results) {
        talkgroups[tg_results[tg].num] = tg_results[tg];
    }
    res.contentType('json');
    res.send(JSON.stringify({
        talkgroups: talkgroups
    }));
}

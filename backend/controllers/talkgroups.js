var db = require('../db');

exports.get_talkgroups = async function (req, res) {
    const tg_coll = db.get().collection('talkgroups');
    const cursor = tg_coll.find({ 'shortName': req.params.shortName.toLowerCase() })
    const tg_results = await cursor.toArray();
    var talkgroups = {};
    for (var tg in tg_results) {
        talkgroups[tg_results[tg].num] = tg_results[tg];
    }
    res.contentType('json');
    res.send(JSON.stringify({
        talkgroups: talkgroups
    }));
}

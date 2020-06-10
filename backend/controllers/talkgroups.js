var db = require('../db');

exports.get_talkgroups = function(req, res) {
            db.get().collection('talkgroups', function(err, tg_coll) {
                tg_coll.find({
                    'shortName': req.params.shortName.toLowerCase()
                }).toArray(function(err, tg_results) {
                    var talkgroups = {};
                    for (var tg in tg_results) {
                        talkgroups[tg_results[tg].num] = tg_results[tg];
                    }
                    res.contentType('json');
                    res.send(JSON.stringify({
                        talkgroups: talkgroups
                    }));
                });
            });
}

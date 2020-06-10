var db = require('../db');

exports.get_groups = function(req, res) {
            db.get().collection('groups', function(err, grp_coll) {
                grp_coll.find({
                    'shortName': req.params.shortName.toLowerCase()
                }).toArray(function(err, grp_results) {
                    res.contentType('json');
                    res.send(JSON.stringify(grp_results));
                });
            });
}

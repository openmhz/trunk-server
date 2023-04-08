var db = require('../db');

exports.get_groups = async function (req, res) {

    const grp_coll = db.get().collection('groups');
    const cursor = grp_coll.find({ 'shortName': req.params.shortName.toLowerCase() });
    const grp_results = await cursor.toArray();

    res.contentType('json');
    res.send(JSON.stringify(grp_results));
}

const Group = require("../models/group");

exports.get_groups = async function (req, res) {
    const grp_results = await Group.find({ shortName: req.params.shortName.toLowerCase()}).sort("position").exec();

    res.contentType('json');
    res.send(JSON.stringify(grp_results));
}

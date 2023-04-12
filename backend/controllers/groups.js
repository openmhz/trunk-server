const Group = require("../models/group");

exports.get_groups = async function (req, res) {
    const grp_results = await Group.find({ shortName: req.params.shortName.toLowerCase()}).sort("position").catch(err => {
        console.error(err);
        res.status(500);
        res.json({ success: false, message: err });
        return;
      });

    res.contentType('json');
    res.send(JSON.stringify(grp_results));
}

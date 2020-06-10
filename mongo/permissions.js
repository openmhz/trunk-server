db = db.getMongo().getDB( "scanner" );
var requests = [];
var permissions = [];
db.systems.find().forEach(system => {

    printjson(system);
   if (system && system.user) {
    var user = db.users.findOne({'local.email': system.user})
      if (user) {
        requests.push( {
            'updateOne': {
                'filter': { '_id': system._id },
                'update': { '$set': { 'owner': user._id } }
            }
        });
        permissions.push({
            'replaceOne':
      {
         "filter": {'userId':user._id, 'systemId': system._id},
         "replacement" : { '$set': {'userId': user._id, 'systemId': system._id, 'shortName': system.shortName, 'role': 20}},
         "upsert" : true
      }

          }
        )
      }
    }
});

if(requests.length > 0) {
    db.systems.bulkWrite(requests);
    db.permissions.bulkWrite(permissions);
}

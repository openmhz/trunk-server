db = db.getMongo().getDB( "scanner" );

db.users.insertOne({  "email" : "test@test.com", "admin" : true, "location" : "somewhere", "lastName" : "Account", "firstName" : "Test", "lastLogin" : ISODate("2017-01-15T13:31:02.148Z"), "local" : { "password" : "$2a$08$8F/8dlU4XJUSMe4OcGVVAeCVAlygxerXteLRXB5SsbkQkoS8l2xG6", "email" : "test@test.com" } });
db.systems.insertOne({ "key" : "ed8b444011047a67445f16d73088ef34ecec2b46b959a3b6857dd004a5d17bc7", "user" : "test@test.com", "description" : "Radio system for DC Fire", "state" : "DC", "city" : "Washingtond", "shortName" : "dcfd", "name" : "DC Fire and EMS", "active" : true });

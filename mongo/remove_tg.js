const B2 = require('backblaze-b2');
const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);



const b2 = new B2({
    applicationKeyId: '', // or accountId: 'accountId'
    applicationKey: '' // or masterApplicationKey
  });


  async function GetBucket() {
  try {
    await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
    let response = await b2.getBucket({ bucketName: 'openmhz-s3' });
    console.log(response.data);
    bucketId = response.data.buckets[0].bucketId;
    console.log(bucketId)
    return bucketId;
  } catch (err) {
    console.log('Error getting bucket:', err);
  }
}

async function run() {
  try {
    let bucketId = await GetBucket();
    const database = client.db('scanner');
    const calls = database.collection('calls');
    await b2.authorize(); 
    // Query for a movie that has the title 'Back to the Future'
    const query = {
        shortName: "hennearmer",
        talkgroupNum: 3423};
    // Execute query 
    const cursor = calls.find(query);
    // Print a message if no documents were found
    if ((await calls.countDocuments(query)) === 0) {
      console.log("No documents found!");
    }
    // Print returned documents
    for await (const doc of cursor) {
      console.dir(doc);
      let response = await b2.hideFile({
        bucketId: bucketId,
        fileName: doc.objectKey
        // ...common arguments (optional)

    });
    console.log(response.data);
    }
    const result = await calls.deleteMany(query);
    // Print the number of deleted documents
    console.log("Deleted " + result.deletedCount + " documents");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);

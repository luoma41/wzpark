const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const options = { maxPoolSize: 10 };

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

async function getDb() {
  const client = await clientPromise;
  return client.db('wzpark');
}

module.exports = { getDb, clientPromise };

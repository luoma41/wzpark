const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('FATAL: MONGODB_URI environment variable is required');
}

const options = { maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE, 10) || 10 };

let clientPromise;

if (!global.__wzpark_mongoClientPromise) {
  const client = new MongoClient(uri || 'mongodb://localhost:27017', options);
  global.__wzpark_mongoClientPromise = client.connect().catch(err => {
    console.error('MongoDB connection failed:', err.message);
    throw err;
  });
}
clientPromise = global.__wzpark_mongoClientPromise;

async function getDb() {
  const client = await clientPromise;
  return client.db('wzpark');
}

module.exports = { getDb, clientPromise };

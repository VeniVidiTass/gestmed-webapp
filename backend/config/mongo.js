// backend/config/mongo.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useUnifiedTopology: true });

let db;
async function connect() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME || 'gestmed_appointments_db');
    console.log(`Connected to MongoDB: ${uri}/${db.databaseName}`);
  }
  return db;
}

module.exports = { connect };

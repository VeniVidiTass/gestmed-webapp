const mongoose = require('mongoose');

const host = process.env.MONGO_HOST || 'appointments-mongo';
const port = process.env.MONGO_PORT || 27017;
const db = process.env.MONGO_DB || 'gestmed_appointments_db';
const user = process.env.MONGO_USER || 'gestmed_user';
const password = process.env.MONGO_PASSWORD || 'gestmed_password';
const uri = process.env.MONGO_URI || `mongodb://${user}:${password}@${host}:${port}/${db}`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB', uri))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = mongoose;

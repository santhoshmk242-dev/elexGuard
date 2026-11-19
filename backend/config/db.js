
'use strict';

const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

let transactionsSupported = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB(uri = config.mongoUri) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[db] MongoDB connection attempt ${attempt}/${maxAttempts}`);

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
      });

      transactionsSupported = await detectTransactions();

      console.log('[db] MongoDB connected successfully');

      return mongoose.connection;
    } catch (error) {
      console.error(`[db] Connection attempt ${attempt} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw error;
      }

      await delay(5000);
    }
  }
}

async function detectTransactions() {
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    return Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch (_error) {
    return false;
  }
}

function supportsTransactions() {
  return transactionsSupported;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = {
  connectDB,
  disconnectDB,
  supportsTransactions,
  mongoose,
};

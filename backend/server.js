'use strict';
const config = require('./config/env');
const createApp = require('./app');
const { connectDB, supportsTransactions, disconnectDB } = require('./config/db');
const { tickElections } = require('./services/voting/electionService');

async function main() {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log(`[db] connected. Multi-document transactions: ${supportsTransactions() ? 'ENABLED' : 'not available (using atomic findOneAndUpdate + compensation)'}`);

  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] ElexGuard API listening on http://localhost:${config.port} (${config.env})`);
  });

  // Auto-start scheduled elections and auto-close expired ones.
  const timer = setInterval(() => tickElections().catch((e) => console.error('[scheduler]', e.message)), 30 * 1000);
  timer.unref();

  const shutdown = async (sig) => {
    // eslint-disable-next-line no-console
    console.log(`[server] ${sig} received, shutting down…`);
    clearInterval(timer);
    server.close(async () => { await disconnectDB(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});

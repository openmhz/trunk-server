/**
 * Entrypoint for the transcriber service.
 *
 * Runs the same image as the backend with a different command, so there is no
 * second Dockerfile and no second lockfile to keep in step.
 */
const mongoose = require('mongoose');
const callSchema = require('./models/callSchema');
const worker = require('./transcription/worker');

const host = process.env['MONGO_NODE_DRIVER_HOST'] ?? 'mongo';
const port = process.env['MONGO_NODE_DRIVER_PORT'] ?? 27017;
const mongoUrl = `mongodb://${host}:${port}/scanner`;

async function main() {
  await mongoose.connect(mongoUrl);
  console.log(new Date().toISOString(), '[transcriber]', `connected to ${mongoUrl}`);

  const Call = mongoose.model('Call', callSchema);

  // Build the partial index before claiming anything. Without it the claim
  // query is a full collection scan every poll, forever - invisible except as
  // unexplained mongo CPU.
  await Call.syncIndexes();
  console.log(new Date().toISOString(), '[transcriber]', 'indexes ready');

  await worker.run(Call);
  await mongoose.disconnect();
}

// Compose sends SIGTERM on stop. Finish the call in flight rather than leaving
// a claim behind for the TTL to clean up ten minutes later.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(new Date().toISOString(), '[transcriber]', `${signal} - finishing current call`);
    worker.stop();
  });
}

main().catch((err) => {
  console.error(new Date().toISOString(), '[transcriber]', 'fatal:', err);
  process.exit(1);
});

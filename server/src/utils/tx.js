const mongoose = require("mongoose");

// Per-key mutex to ensure concurrent requests for the same vehicle serialize cleanly in Node.js
// preventing phantom reads under MongoDB snapshot isolation or standalone deployments.
const vehicleLocks = new Map();
const financeLocks = new Map();

async function withVehicleLock(vehicleId, callback) {
  const key = vehicleId.toString();
  const prior = vehicleLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  vehicleLocks.set(key, prior.then(() => current));

  try {
    await prior;
    return await callback();
  } finally {
    release();
    if (vehicleLocks.get(key) === prior.then(() => current)) {
      vehicleLocks.delete(key);
    }
  }
}

async function withFinanceLock(offerId, callback) {
  const key = offerId.toString();
  const prior = financeLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  financeLocks.set(key, prior.then(() => current));

  try {
    await prior;
    return await callback();
  } finally {
    release();
    if (financeLocks.get(key) === prior.then(() => current)) {
      financeLocks.delete(key);
    }
  }
}

/**
 * Executes a callback within a MongoDB transaction if the connected cluster supports transactions
 * (ReplicaSet or Mongos). If running on a standalone server, executes the callback directly
 * without transaction wrappers so dev/test/standalone deployments run safely.
 */
async function runInTransaction(callback) {
  const session = await mongoose.startSession();
  try {
    let isReplSet = false;
    try {
      const topology = mongoose.connection.client?.topology?.description?.type;
      if (topology && (topology.includes("ReplicaSet") || topology.includes("Mongos") || topology.includes("Sharded"))) {
        isReplSet = true;
      }
    } catch (_e) {
      // Fallback
    }

    if (isReplSet) {
      let result;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result;
    } else {
      return await callback(null);
    }
  } finally {
    session.endSession();
  }
}

module.exports = { runInTransaction, withVehicleLock, withFinanceLock };

const mongoose = require("mongoose");
const StockEvent = require("../models/StockEvent");
const AlertEvent = require("../models/AlertEvent");
const MonitoringLog = require("../models/MonitoringLog");

async function safeWrite(label, operation) {
  if (mongoose.connection.readyState !== 1) {
    console.warn(`MongoDB unavailable; ${label} event was not saved`);
    return false;
  }
  try { await operation(); return true; }
  catch (error) { console.error(`MongoDB ${label} event write failed:`, error.message); return false; }
}

const recordStockEvent = (data) => safeWrite("stock", () => StockEvent.create(data));
const recordAlertEvent = (data) => safeWrite("alert", () => AlertEvent.create(data));
const recordMonitoring = (data) => safeWrite("monitoring", () => MonitoringLog.create(data));

module.exports = { recordStockEvent, recordAlertEvent, recordMonitoring };

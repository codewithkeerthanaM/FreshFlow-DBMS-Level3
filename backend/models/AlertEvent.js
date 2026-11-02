const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  alertId: Number,
  inventoryId: Number,
  description: String,
  performedBy: { userId: Number, name: String, email: String },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true, collection: "alert_events" });
module.exports = mongoose.models.AlertEvent || mongoose.model("AlertEvent", schema);

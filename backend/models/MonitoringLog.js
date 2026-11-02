const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  level: { type: String, default: "info" },
  action: { type: String, required: true, index: true },
  description: String,
  userId: Number,
  userEmail: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true, collection: "monitoring_logs" });
module.exports = mongoose.models.MonitoringLog || mongoose.model("MonitoringLog", schema);

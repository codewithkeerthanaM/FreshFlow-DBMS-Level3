const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  inventoryId: Number,
  productId: Number,
  batchNumber: String,
  quantity: Number,
  description: String,
  performedBy: { userId: Number, name: String, email: String },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true, collection: "stock_events" });
module.exports = mongoose.models.StockEvent || mongoose.model("StockEvent", schema);

const StockEvent=require("../models/StockEvent");
const AlertEvent=require("../models/AlertEvent");
const MonitoringLog=require("../models/MonitoringLog");
const {ok}=require("../utils/response");
async function stock(req,res){return ok(res,await StockEvent.find().sort({createdAt:-1}).limit(100).lean());}
async function alerts(req,res){return ok(res,await AlertEvent.find().sort({createdAt:-1}).limit(100).lean());}
async function monitoring(req,res){return ok(res,await MonitoringLog.find().sort({createdAt:-1}).limit(100).lean());}
module.exports={stock,alerts,monitoring};

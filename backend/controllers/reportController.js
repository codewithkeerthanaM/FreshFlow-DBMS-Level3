const {getPool}=require("../config/mysql");
const {ok,fail}=require("../utils/response");
async function dashboard(req,res){
 const pool=getPool();
 const [[p]] = await pool.query("SELECT COUNT(*) AS totalProducts FROM product");
 const [[s]] = await pool.query("SELECT COALESCE(SUM(Quantity_On_Hand),0) AS totalStock FROM inventory");
 const [[a]] = await pool.query("SELECT COUNT(*) AS activeAlerts FROM alert WHERE Status='Active'");
 const [[w]] = await pool.query("SELECT COALESCE(SUM(Quantity_Wasted),0) AS totalWaste FROM waste");
 return ok(res,{totalProducts:Number(p.totalProducts),totalStock:Number(s.totalStock),activeAlerts:Number(a.activeAlerts),totalWaste:Number(w.totalWaste)});
}
async function list(req,res){
 const [rows]=await getPool().query(`SELECT r.*,u.Full_Name AS Generated_By_Name FROM report r JOIN \`user\` u ON u.User_ID=r.Generated_By ORDER BY r.Generated_Date DESC`);
 return ok(res,rows);
}
async function create(req,res){
 const b=req.body||{};
 if(!b.Report_Type||!b.Generated_By)return fail(res,400,"Report_Type and Generated_By are required");
 const [r]=await getPool().execute("INSERT INTO report (Report_Type,Generated_By,From_Date,To_Date,File_Path) VALUES (?,?,?,?,?)",[b.Report_Type,b.Generated_By,b.From_Date||null,b.To_Date||null,b.File_Path||null]);
 return ok(res,{id:r.insertId},201,"Report record created");
}
module.exports={dashboard,list,create};

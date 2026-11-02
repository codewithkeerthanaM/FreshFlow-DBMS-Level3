require("dotenv").config();
const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const {connectMySQL}=require("./config/mysql");
const {connectMongoDB}=require("./config/mongodb");
const {notFound,errorHandler}=require("./middleware/errorMiddleware");
const {recordMonitoring}=require("./services/eventService");

const app=express();
app.use(helmet());
app.use(cors({origin:process.env.CLIENT_ORIGIN||"http://localhost:3000",credentials:true}));
app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.get("/api/health",async(req,res)=>{
 res.json({success:true,message:"FreshFlow API is running",services:{
  mysql:"connected after startup check",
  mongodb:require("mongoose").connection.readyState===1?"connected":"disconnected"
 }});
});
app.use("/api/auth/login",rateLimit({windowMs:15*60*1000,max:20,standardHeaders:true,legacyHeaders:false}));
app.use("/api/auth",require("./routes/authRoutes"));
app.use("/api/products",require("./routes/crudRoutes").build("products"));
app.use("/api/suppliers",require("./routes/crudRoutes").build("suppliers"));
app.use("/api/locations",require("./routes/locationRoutes"));
app.use("/api/inventory",require("./routes/inventoryRoutes"));
app.use("/api/waste",require("./routes/wasteRoutes"));
app.use("/api/purchases",require("./routes/purchaseRoutes"));
app.use("/api/alerts",require("./routes/alertRoutes"));
app.use("/api/reports",require("./routes/reportRoutes"));
app.use("/api/history",require("./routes/historyRoutes"));
app.use(notFound);
app.use(errorHandler);

const port=Number(process.env.PORT||5000);
async function start(){
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32) throw new Error("JWT_SECRET must contain at least 32 characters");
 await connectMySQL();
 try{await connectMongoDB();}catch(e){console.error("MongoDB connection failed; SQL APIs will remain available:",e.message);}
 app.listen(port,()=>console.log(`FreshFlow API listening at http://localhost:${port}`));
}
if(require.main===module)start().catch(e=>{console.error("Startup failed:",e);process.exit(1)});
module.exports=app;

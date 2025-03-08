import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();
app.use(cors({
    origin:process.env.CORS_LINK,
    credentials:true
}))
app.use(express.static('views'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(bodyParser.json()); // Parse JSON data
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

import { userRouter } from "./routes/user.router.js";
app.use('/user',userRouter);
import { trainerRouter } from "./routes/trainer.router.js";
app.use('/trainer',trainerRouter);
import { adminRouter } from "./routes/admin.router.js";
app.use('/gh4g453j5',adminRouter);
app.get('/',(req,res)=>{
    res.render('index');
})
export {app};
import express from "express";
import bodyParser from "body-parser";
const app=express();
app.use(express.static('views'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
//app.use(bodyParser.json()); // Parse JSON data
app.use(express.urlencoded({ extended: true }));
//app.use(bodyParser.urlencoded({ extended: true }));


export {app};
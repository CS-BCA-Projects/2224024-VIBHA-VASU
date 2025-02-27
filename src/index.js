import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 9000, () => {
      console.log(`Server is runing at port : ${process.env.PORT}`);
      console.log(`http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB connection failed", err);
  });


import { Router } from "express";
import { registerUserPage,registerUser,loginUserPage,loginUser, logoutUser,getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyUser,verifyTrainer} from "../middlewares/authenticate.middleware.js"

const userRouter=Router();

userRouter.route("/register-user").get(registerUserPage);
userRouter.route("/register-user").post(
    upload.fields([
    {
        name:"profileImage",
        maxCount: 1
    }
]),registerUser);

userRouter.route("/login-user").get(loginUserPage);
userRouter.route("/login-user").post(loginUser);

//secured routes
userRouter.route("/logout-user").get(verifyUser,logoutUser);
userRouter.route("/user-data").get(verifyUser, getCurrentUser);


export {userRouter};
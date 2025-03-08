import { Router } from "express";
import {
    verifyAdmin,
  } from "../middlewares/authenticate.middleware.js";

import {
    registerAdmin,
    loginAdmin,
    registerAdminPage,
    loginAdminPage,
    trainerverificationPage,
    trainerpage,
    trainerVerification
  } from "../controllers/admin.controller.js";

const adminRouter = Router();

adminRouter.route("/register-admin").get(registerAdminPage);
adminRouter.route("/register-admin").post(registerAdmin);
adminRouter.route("/login-admin").get(loginAdminPage);
adminRouter.route("/login-admin").post(loginAdmin);

//secured routes
adminRouter.route("/trainer-verification").get(verifyAdmin,trainerverificationPage);
adminRouter.route("/trainer-verification/:userName").get(verifyAdmin,trainerpage);
adminRouter.route("/trainer-verified/:userId").get(verifyAdmin,trainerVerification);

export { adminRouter };

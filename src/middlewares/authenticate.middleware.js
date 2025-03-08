import { User } from "../models/user.model.js";
import { Trainer } from "../models/trainer.model.js"
import { Admin } from "../models/admin.model.js"
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const verifyUser =asyncHandler( async (req, res, next) => {
    
        const token = req.cookies?.userAccessToken;
        if (!token) {
            throw new ApiError(401, "Token not found");
        }
        const decordedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decordedToken._id);
        if(!user){
            throw new ApiError(401,"Unauthorized access");
        }
        req.user=user;
        next();
    
});
const verifyTrainer=asyncHandler(async (req, res, next) => {
    const token = req.cookies?.trainerAccessToken;
    if (!token) {
        throw new ApiError(401, "Token not found");
    }
    const decordedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const trainer=await Trainer.findById(decordedToken._id);
    if(!trainer){
        throw new ApiError(401,"Unauthorized access");
    }
    req.trainer=trainer;
    next();
});

const verifyAdmin=asyncHandler(async (req, res, next) => {
    const token = req.cookies?.adminAccessToken;
    if (!token) {
        throw new ApiError(401, "Token not found");
    }
    const decordedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const admin=await Admin.findById(decordedToken._id);
    if(!admin){
        throw new ApiError(401,"Unauthorized access");
    }
    req.admin=admin;
    next();
});
export {verifyUser,verifyTrainer,verifyAdmin};
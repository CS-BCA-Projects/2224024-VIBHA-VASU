import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { dobToAgeFinder } from "../utils/dobToAge.js";
import { User } from "../models/user.model.js";
import { Trainer } from "../models/trainer.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateAccessandRefreshToken = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token"
    );
  }
};
const registerAdminPage = asyncHandler(async (req, res) => {
  res.render("registerAdmin");
});
const registerAdmin = asyncHandler(async (req, res) => {
  const { userName, password, securityKey } = req.body;
  if (!userName || !password) {
    throw new ApiError(400, "All fields are required");
  }
  let existedUser = await Admin.findOne({ userName });
  if (existedUser) {
    throw new ApiError(409, "Username allready exists");
  }
  if (securityKey !== process.env.ADMIN_SEQURITY_KEY) {
    throw new ApiError(401, "Sequrity key is invalid");
  }
  try {
    const admin = await Admin.create({
      userName: userName,
      password,
    });
    if (!admin) {
      throw new ApiError(500, "Admin not created");
    }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating Admin");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, "Admin created successfully"));
});

const loginAdminPage = asyncHandler(async (req, res) => {
  res.render("loginAdmin");
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;
  if (!userName || !password) {
    throw new ApiError(400, "All fields are required");
  }
  const admin = await Admin.findOne({ userName });
  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }
  const isPasswordCorrect = await admin.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    admin._id
  );
  const updatedAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("adminAccessToken", accessToken, options)
    .cookie("adminRefreshToken", refreshToken, options)
    .redirect('/gh4g453j5/trainer-verification');
});

const trainerverificationPage = asyncHandler(async (req, res) => {
  if (!req.admin) {
    throw new ApiError(401, "Unauthorized access");
  }
  const trainers = await Trainer.find({ verified: false });
  res.render("trainerVerification", { trainers });
});
const trainerpage=asyncHandler(async(req,res)=>{
  if (!req.admin) {
    throw new ApiError(401, "Unauthorized access");
  }
  const {userName}=req.params;
  const trainer=await Trainer.findOne({userName});
  if(!trainer){
    throw new ApiError(404,"Trainer not found");
  }
  const age=dobToAgeFinder(trainer.dob);
  const trainerData={
    id:trainer._id,
    userName:trainer.userName,
    fullName:trainer.fullName,
    age:age,
    profileImage:trainer.profileImage,
    gender:trainer.gender,
    bio:trainer.bio,
    certificate:trainer.certificate,
  }
  res.render("trainerPage",{trainerData});
}); 
const trainerVerification = asyncHandler(async (req, res) => {
  
  if (!req.admin) {
    throw new ApiError(401, "Unauthorized access");
  }
  const { userId } = req.params;
  console.log(userId);
  const trainer = await Trainer.findByIdAndUpdate(
    userId,
    { verified: true },
    { new: true }
  );
  if (!trainer) {
    throw new ApiError(404, "Trainer not found");
  }
  return res
    .status(200)
    .redirect('/gh4g453j5/trainer-verification');
});

export {
  registerAdmin,
  loginAdmin,
  registerAdminPage,
  loginAdminPage,
  trainerverificationPage,
  trainerpage,
  trainerVerification
};

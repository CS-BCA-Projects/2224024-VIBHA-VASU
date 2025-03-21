import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"; 
import { Trainer } from "../models/trainer.model.js";
import { Video } from "../models/video.model.js";
import { dobToAgeFinder } from "../utils/dobToAge.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (trainerId) => {
  try {
    const trainer = await Trainer.findById(trainerId);
    const accessToken = await trainer.generateAccessToken();
    const refreshToken = await trainer.generateRefreshToken();
    trainer.refreshToken = refreshToken;
    await trainer.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token"
    );
  }
};

const registerTrainerPage = asyncHandler(async (req, res) => {
  res.render("registerTrainer");
});

const registerTrainer = asyncHandler(async (req, res) => {
  const { userName, fullName, dob, gender,bio, password } = req.body;
  if (!userName || !fullName || !dob || !gender || !bio || !password) {
    throw new ApiError(400, "All fields are required");
  }
  let existedUser = await User.findOne({ userName });
  existedUser = await Trainer.findOne({ userName });
  if (existedUser) {
    throw new ApiError(409, "Username allready exists");
  }
  const profileImagePath = req.files?.profileImage[0]?.path;
  const certificatePath = req.files?.certificate[0]?.path;
  if (!profileImagePath||!certificatePath) {
    throw new ApiError(400, "Profile Image file and Certificate is required");
  }
  console.log(profileImagePath);
  console.log(certificatePath);
  const profileImage = await uploadOnCloudinary(profileImagePath);
  const certificate= await uploadOnCloudinary(certificatePath);
  console.log(profileImage);
  console.log(certificate);
  if (!profileImage || !certificate) {
    throw new ApiError(400, "Cloudinary link is unavilable");
  }
  const verified=false;
  try {
    const trainer = await Trainer.create({
      userName: userName,
      fullName,
      profileImage: profileImage.url,
      dob,
      gender,
      bio,
      certificate: certificate.url,
      password,
      verified:verified,
    });
    if (!trainer) {
      throw new ApiError(500, "Error while registering on DB");
    }
    console.log(trainer);
    const createdTrainer = await Trainer.findById(trainer._id).select(
      "-password -refreshToken"
    );
    if (!createdTrainer) {
      throw new ApiError(500, "Error while registering on DB");
    }
    return res
      .redirect('/trainer/Login-trainer');
  } 
  catch (error) {
    await deleteOnCloudinary(profileImage.public_id);
    await deleteOnCloudinary(certificate.public_id);
    if (error.code === 11000) {
      throw new ApiError(409, "Not regestering User already exists");
    }
    throw new ApiError(500, "Error while registering on DB");
  }
});

const loginTrainer = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;
  console.log(userName, password);
  if (!userName) {
    throw new ApiError(400, "All fields are required");
  }
  const trainer = await Trainer.findOne({ userName });
  if (!trainer) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await trainer.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password incorrect");
  }
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    trainer._id
  );
  const updatedTrainer = await Trainer.findById(trainer._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("trainerAccessToken", accessToken, options)
    .cookie("trainerRefreshToken", refreshToken, options)
    .redirect('/trainer/trainer-data');
});

const loginTrainerPage = asyncHandler(async (req, res) => {
  res.render("loginTrainer");
});

const logoutTrainer = asyncHandler(async (req, res) => {
  await Trainer.findByIdAndUpdate(
    req.trainer._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("trainerAccessToken", options)
    .clearCookie("trainerRefreshToken", options)
    .redirect('/');
});

const getCurrentTrainer = asyncHandler(async (req, res) => {
  const trainer=req.trainer;
  const age=dobToAgeFinder(trainer.dob);
  const trainerData={
    id:trainer._id,
    userName:trainer.userName,
    fullName:trainer.fullName,
    age:age,
    profileImage:trainer.profileImage,
    gender:trainer.gender,
    bio:trainer.bio,
  }
  res
    .render('trainer',{trainerData});
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.trainerRefreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decordedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const trainer = await Trainer.findById(decordedToken._id);
    if (!trainer) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== trainer?.refreshToken) {
      throw new ApiError(401, "Refresh Token expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessandRefreshToken(trainer._id);
    return res
      .status(200)
      .cookie("trainerAccessToken", accessToken, options)
      .cookie("trainerRefreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});
const videoInputPage=asyncHandler(async(req,res)=>{
  res.render("uploadVideo");
});
const uploadVideo=asyncHandler(async(req,res)=>{
  const {videoFile,title,targetAge,targetGender,targetLevel} = req.body;
  if(!videoFile||!title||!targetAge||!targetGender||!targetLevel){
    throw new ApiError(400, "All fields are required");
  }
  const existVideo=await Video.findOne({videoFile});
  if(existVideo){
    throw new ApiError(400, "Video already present");
  }
  if(!req.trainer){
    throw new ApiError(400, "Trainer not found");
  }
  try {
    const video=await Video.create(
      {
        videoFile:videoFile,
        title:title,
        targetAge:targetAge,
        targetGender:targetGender,
        targetLevel:targetLevel,
        owner:req.trainer._id
      }
    )
    if (!video) {
      throw new ApiError(500, "Error while uploading on DB on DB");
    }
    const uploadedVideo=await Video.findById(video._id);
    if (!uploadedVideo) {
      throw new ApiError(500, "Error while uploading on DB on DB");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, uploadedVideo, "Video Uploaded on DB"));

  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Not regestering User already exists");
    }
    throw new ApiError(500, "Error while registering on DB");
  }

});
const getTrainerVideos=asyncHandler(async(req,res)=>{
  const videos=await Video.find(
    {
      owner:req.trainer._id
    }
  );
  if(!videos){
    throw new ApiError(404, "No videos found");
  }
  res.render("trainerVideos",{videos});
});
const deleteVideo=asyncHandler(async(req,res)=>{
  const {id}=req.params;
  console.log(id);
  try {
    const deletedVideo=await Video.findByIdAndDelete(id);
    console.log(deletedVideo);
    return res
    .redirect('/trainer/trainer-videos');
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Not regestering User already exists");
    }
    throw new ApiError(500, "Error while Deleting on DB");
  }
})
const getEnrolledUsers=asyncHandler(async(req,res)=>{
  const myUsers=await User.find(
    {
      trainer:req.trainer._id
    }
  );
  
  let enrolledUsers=[];
  myUsers.forEach(user => {
    const age=dobToAgeFinder(user.dob);
    const userLevel=`${(Math.floor((user.progressPoints)/20))+1}`
    enrolledUsers.push({
      id:user._id,
      userName:user.userName,
      fullName:user.fullName,
      profileImage:user.profileImage,
      age:age,
      gender:user.gender,
      level:userLevel,
    })
  });
  if(!enrolledUsers){
    throw new ApiError(404, "No enrolled users found");
  }
  res.render("enrolledUsers",{enrolledUsers});
});
export {
  registerTrainerPage,
  registerTrainer,
  loginTrainer,
  loginTrainerPage,
  logoutTrainer,
  getCurrentTrainer,
  refreshAccessToken,
  videoInputPage,
  uploadVideo,
  getTrainerVideos,
  deleteVideo,
  getEnrolledUsers,
};

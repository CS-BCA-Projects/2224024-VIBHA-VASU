import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Trainer } from "../models/trainer.model.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const userAccessToken = await user.generateAccessToken();
    const userRefreshToken = await user.generateRefreshToken();
    user.refreshToken = userRefreshToken;
    await user.save({ validateBeforeSave: false });
    return { userAccessToken, userRefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token"
    );
  }
};

const registerUserPage = asyncHandler(async (req, res) => {
  res.render("registerUser");
});

const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, dob, gender, password } = req.body;
  if (!userName || !fullName || !dob || !gender || !password) {
    throw new ApiError(400, "All fields are required");
  }
  let existedUser = await User.findOne({ userName });
  existedUser=await Trainer.findOne({userName});
  if (existedUser) {
    throw new ApiError(409, "User allready exists");
  }
  const profileImagePath = req.files?.profileImage[0]?.path;
  if (!profileImagePath) {
    throw new ApiError(400, "Profile Image file file is required");
  }
  console.log(profileImagePath);
  const profileImage = await uploadOnCloudinary(profileImagePath);
  console.log(profileImage);
  if (!profileImage) {
    throw new ApiError(400, "Cloudinary Profile Image link is unavilable");
  }
  const progressPoints = 0;
  try {
    const user = await User.create({
      userName: userName,
      fullName,
      profileImage: profileImage.url,
      dob,
      gender,
      progressPoints,
      password,
    });
    if (!user) {
      throw new ApiError(500, "Error while registering on DB");
    }
    console.log(user);
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "Error while registering on DB");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User Created on DB"));
  } catch (error) {
    await deleteOnCloudinary(profileImage.public_id);
    if (error.code === 11000) {
      throw new ApiError(409, "Not regestering User already exists");
    }
    throw new ApiError(500, "Error while registering on DB");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;
  console.log(userName, password);
  if (!userName) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({ userName });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password incorrect");
  }
  const { userAccessToken, userRefreshToken } = await generateAccessandRefreshToken(
    user._id
  );
  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("userAccessToken", userAccessToken, options)
    .cookie("userRefreshToken", userRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
          userAccessToken,
          userRefreshToken,
        },
        "user loggin successfully"
      )
    );
});

const loginUserPage = asyncHandler(async (req, res) => {
  res.render("loginUser");
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
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
    .clearCookie("userAccessToken", options)
    .clearCookie("userRefreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decordedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decordedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessandRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshTokenefreshToken, options)
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
const selectTrainerPage=asyncHandler(async(req,res)=>{
  if(!req.user){
    throw new ApiError(401,"Unauthorized Request");
  }
  const trainers=await Trainer.find();
  res.render("selectTrainer",{trainers});
})
const selectTrainer=asyncHandler(async(req,res)=>{
  const {userId}=req.params;
  const trainer=await Trainer.findById(userId);
  if(!trainer){
    throw new ApiError(401,"No such trainer found");
  }
  const user=await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        trainer:trainer._id,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  if(!user){
    throw new ApiError(401,"Error while selecting trainer");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Trainer selected successfully"));
})

export {
  registerUserPage,
  registerUser,
  loginUser,
  loginUserPage,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  selectTrainerPage,
  selectTrainer
};

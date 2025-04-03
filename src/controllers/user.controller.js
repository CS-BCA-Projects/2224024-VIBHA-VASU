import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { dobToAgeFinder } from "../utils/dobToAge.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Trainer } from "../models/trainer.model.js";
import { Video } from "../models/video.model.js";
import jwt from "jsonwebtoken";
import e from "express";

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
  existedUser = await Trainer.findOne({ userName });
  if (existedUser) {
    throw new ApiError(409, "User allready exists");
  }
  const profileImagePath = req.files?.profileImage[0]?.path;
  console.log(req.files);
  console.log("Profile Image Path -",profileImagePath);

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
    return res.redirect("/user/login-user");
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
  console.log(userName);
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
  const { userAccessToken, userRefreshToken } =
    await generateAccessandRefreshToken(user._id);
  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  };
  return res
    .status(200)
    .cookie("userAccessToken", userAccessToken, options)
    .cookie("userRefreshToken", userRefreshToken, options)
    .redirect("/user/user-data");
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
    secure: false,
    sameSite: "Lax",
  };
  return res
    .status(200)
    .clearCookie("userAccessToken", options)
    .clearCookie("userRefreshToken", options)
    .redirect("/");
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log(user);
  const age = dobToAgeFinder(user.dob);
  const level = Math.floor(user.progressPoints / 20) + 1;
  const trainer = await Trainer.findById(user.trainer);
  let userData;
  if(!trainer){
    userData = {
      id: user._id,
      userName: user.userName,
      fullName: user.fullName,
      profileImage: user.profileImage,
      age: age,
      gender: user.gender,
      level: level,
      trainer: 'Not Selected',
    };
  }
  else{
    userData = {
      id: user._id,
      userName: user.userName,
      fullName: user.fullName,
      profileImage: user.profileImage,
      age: age,
      gender: user.gender,
      level: level,
      trainer: trainer.fullName,
    };
  }
  res.render("user", { userData });
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
      secure: false,
      sameSite: "Lax",
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
const selectTrainerPage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  const trainers = await Trainer.find({ verified: true });
  res.render("selectTrainer", { trainers });
});
const trainerProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  const { userName } = req.params;
  const trainer = await Trainer.findOne({ userName });
  const age = dobToAgeFinder(trainer.dob);
  const trainerData = {
    id: trainer._id,
    userName: trainer.userName,
    fullName: trainer.fullName,
    age: age,
    profileImage: trainer.profileImage,
    gender: trainer.gender,
    bio: trainer.bio,
  };
  res.render("trainerProfile", { trainerData });
});
const selectTrainer = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  const trainer = await Trainer.findById(userId);
  if (!trainer) {
    throw new ApiError(401, "No such trainer found");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        trainer: trainer._id,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "Error while selecting trainer");
  }
  return res.status(200).redirect("/user/user-data");
});
const trainingPage = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!req.user.trainer) {
    throw new ApiError(401, "Trainer not selected");
  }
  const trainer = await Trainer.findById(req.user.trainer);
  if (!trainer) {
    throw new ApiError(401, "No such trainer found");
  }
  const age = dobToAgeFinder(req.user.dob);
  console.log(age);
  let userAgeGroup;
  if (age < 18) {
    userAgeGroup = "-18";
  } else if (age < 45) {
    userAgeGroup = "18-45";
  } else if (age < 60) {
    userAgeGroup = "45-60";
  } else {
    userAgeGroup = "60-";
  }
  console.log(userAgeGroup);
  const userLevel = `L${Math.floor(req.user.progressPoints / 20) + 1}`;
  console.log(userLevel);
  const videos = await Video.aggregate([
    {
      $match: {
        owner: trainer._id,
      },
    },
    {
      $match: {
        targetGender: { $in: [req.user.gender] },
      },
    },
    {
      $match: {
        targetAge: { $in: [userAgeGroup] },
      },
    },
    {
      $match: {
        targetLevel: { $in: [userLevel] },
      },
    },
  ]);
  res.render("trainingPage", { videos });
});
const updateProgressPoints = asyncHandler(async (req, res) => {
  console.log(req.body);
  console.log("User completed all videos!");
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!req.user.trainer) {
    throw new ApiError(401, "Trainer not selected");
  }
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - req.user.lastTrained?.getTime()); // Difference in milliseconds
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  console.log(diffDays);
  if (!req.user.lastTrained) {
    console.log("User's first day of training");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          progressPoints: 1,
        },
        $set: {
          lastTrained: today,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
  } else if (diffDays === 0) {
    console.log("User's has already trained today");
  } else if (diffDays === 1) {
    console.log("User's has trained yesterday");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          progressPoints: 1,
        },
        $set: {
          lastTrained: today,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
  } else if (diffDays > 1) {
    console.log("User's has not trained yesterday");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          progressPoints: -diffDays + 1,
        },
        $set: {
          lastTrained: today,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
  }
});
export {
  registerUserPage,
  registerUser,
  loginUser,
  loginUserPage,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  selectTrainerPage,
  trainerProfile,
  selectTrainer,
  trainingPage,
  updateProgressPoints,
};

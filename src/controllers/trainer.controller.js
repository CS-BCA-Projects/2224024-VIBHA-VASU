import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js"; 
import { Trainer } from "../models/trainer.model.js";
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
      .status(201)
      .json(new ApiResponse(200, createdTrainer, "User Created on DB"));
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
    .json(
      new ApiResponse(
        200,
        {
          user: updatedTrainer,
          accessToken,
          refreshToken,
        },
        "trainer loggin successfully"
      )
    );
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
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

const getCurrentTrainer = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.trainer, "User fetched successfully"));
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
      .cookie("trainerRefreshToken", newRefreshTokenefreshToken, options)
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


export {
  registerTrainerPage,
  registerTrainer,
  loginTrainer,
  loginTrainerPage,
  logoutTrainer,
  getCurrentTrainer,
  refreshAccessToken
};

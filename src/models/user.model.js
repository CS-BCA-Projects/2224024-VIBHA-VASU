// import { type } from "express/lib/response";
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index:true//index:true is used make attribute searchable easily
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: {
      type: String, //cloudinary url
      required: true,
    },
    dob: {
      type: Date,
      required: true,
      trim: true,
    },
    gender: {
        type: String,
        required: true,
        trim: true,
    },
    progressPoints: {
        type: Number,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    trainer:{
      type:Schema.Types.ObjectId,
      ref:"Trainer"   
    },
    refreshTokens:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {// isModified is used to check weather password is changed or not so hashing must run if password is changed
    this.password = await bcrypt.hash(this.password,11);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken= function(){
  return jwt.sign(
    {
      _id:this._id,
      userName:this.userName,
      fullName:this.fullName,
      profileImage:this.profileImage,
      dob:this.dob,
      gender:this.gender,
      progressPoints:this.progressPoints,
      trainer:this.trainer
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken= function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema);

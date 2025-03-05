import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import e from "cors";

const trainerSchema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index:true
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
  bio: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  certificate: {
    type: String,//cloudinary url
    required: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  refreshToken: {
    type: String,
    required: false,
  },
  verified:{
    type: Boolean,
  },
});

trainerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {// isModified is used to check weather password is changed or not so hashing must run if password is changed
    this.password = await bcrypt.hash(this.password,11);
  }
  next();
});

trainerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

trainerSchema.methods.generateAccessToken= function(){
  return jwt.sign(
    {
        _id:this._id,
        username:this.username,
        fullName:this.fullName,
        profileImage:this.profileImage,
        dob:this.dob,
        gender:this.gender,
        bio:this.bio,
        certificate:this.certificate,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
trainerSchema.methods.generateRefreshToken= function(){
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

export const Trainer = mongoose.model("Trainer", trainerSchema);
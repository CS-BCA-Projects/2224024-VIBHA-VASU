// import { type } from "express/lib/response";
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index:true//index:true is used make attribute searchable easily
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    refreshToken:{
      type:String
    },
  }
);
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {// isModified is used to check weather password is changed or not so hashing must run if password is changed
    this.password = await bcrypt.hash(this.password,11);
  }
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken= function(){
  return jwt.sign(
    {
      _id:this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
adminSchema.methods.generateRefreshToken= function(){
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

export const Admin = mongoose.model("Admin", adminSchema);
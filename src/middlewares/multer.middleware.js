import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";
const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
  
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(500, "Only images with .png, .jpg, .jpeg are allowed!"));
    }
  };
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)
    }
});

export const upload= multer({storage,fileFilter});
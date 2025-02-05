import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// (async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNARY_API_KEY, 
        api_secret: process.env.CLOUDNARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary=async (localFilePath)=>{
        try {
            if (!localFilePath) {
                return null;
            } 
            else {
                const uploadresult=await cloudinary.uploader.upload(
                    localFilePath,{
                        resource_type:'auto'
                    }
                )
                fs.unlinkSync(localFilePath);//to delete file from server
               // console.log("File has uploaded ",uploadresult.url);
                return uploadresult
            }
        } catch (error) {
            fs.unlinkSync(localFilePath);//to delete file from server
            return null;
        }
    }


    export {uploadOnCloudinary}
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNARY_API_KEY, 
        api_secret: process.env.CLOUDNARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary=async (localFilePath)=>{
        try {
            console.log('Local file path --',localFilePath)
            if (!localFilePath) {
                console.log("Local file path not found")
                return null;
            } 
            else {
                const uploadresult=await cloudinary.uploader.upload(
                    localFilePath,{
                        resource_type:'auto'
                    }
                )
                fs.unlinkSync(localFilePath);//to delete file from server
                console.log("File has uploaded ",uploadresult.url);
                return uploadresult
            }
        } catch (error) {
            console.log("Failed to upload on Cloudinary")
           // fs.unlinkSync(localFilePath);//to delete file from server
            return null;
        }
    }
    const deleteOnCloudinary=async (publicId)=>{
        try {
            if (!publicId) {
                return null;
            } 
            else {
                const deleteresult=await cloudinary.uploader.destroy(publicId)
                console.log("File has deleted ",deleteresult);  
                return deleteresult
            }
        }
        catch (error) {
            return null;
        }   
    }


    export {uploadOnCloudinary,deleteOnCloudinary}
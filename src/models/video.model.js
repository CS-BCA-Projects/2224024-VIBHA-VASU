import mongoose, { Schema } from "mongoose";

const videoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required: true,
            trim: true,
        },
        thumbnail:{
            type:String,   //cloudinary url
            required:true,
            index:true //index:true is used make attribute searchable easily
        },
        title:{
            type:String,   
            required:true
        },
        targetAge:[
            {
                type:String
            },
          ],
        targetGender: [
            {
                type:String
            },
          ],
        targetLevel:[
            {
                type:String
            }
        ],
        owner:{
            type:Schema.Types.ObjectId,
            ref:"Trainer"   
        }
    }
)
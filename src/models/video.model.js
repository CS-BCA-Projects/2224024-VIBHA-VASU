import mongoose, { Schema } from "mongoose";

const videoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required: true,
            trim: true,
        },
        title:{
            type:String,
            required:true,
            index:true //index:true is used make attribute searchable easily
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

export const Video = mongoose.model("Video", videoSchema);
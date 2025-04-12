import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: "Trainer",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
)

export const Rating = mongoose.model("Rating", ratingSchema);
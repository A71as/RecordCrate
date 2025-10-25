import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true
        },
        username: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: false
        },
        picture: {
            type: String
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        }
    },
    // Name of the Collection
    { collection: "Users" }
);

const Users = mongoose.model("Users", userSchema);

export default Users;
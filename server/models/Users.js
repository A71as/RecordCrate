import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: false
        },
        username: {
            type: String,
            required: false
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        picture: {
            type: String,
            required: false
        },
        spotify: {
            type: Map,
            of: String,
            required: false
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
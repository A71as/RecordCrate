import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true
        },
        spotify_id: {
            type: String,
            required: false,
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
    },
    // Name of the Collection
    { collection: "Users" }
);

const Users = mongoose.model("Users", userSchema);

export default Users;
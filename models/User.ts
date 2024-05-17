import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true },
    username: { type: String },
    discriminator: { type: String },
    avatar: { type: String },
    createdTimestamp: { type: Number },
    defaultAvatarURL: { type: String },
    tag: { type: String },
    avatarURL: { type: String },
    displayAvatarURL: { type: String },
});

export default mongoose.model('User', userSchema);
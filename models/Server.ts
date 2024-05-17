import mongoose from "mongoose";



const serverSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String },
    icon: { type: String },
    features: { type: [String] },
    members: { type: [String] },
    channels: { type: [String] },
    roles: { type: [String] },
    ownerID: { type: String },
    emojis: { type: [String] },
    stickers: { type: [String] },
    createdTimestamp: { type: Number },
    iconURL: { type: String },
    shardId: { type: Number },
    nameAcronym: { type: String },
});
export default mongoose.model('Server', serverSchema);
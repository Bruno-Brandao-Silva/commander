import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: String,
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    context: { type: String, enum: ['public', 'private'], required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        commenter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String
    },
    { timestamps: true }
    ],
},
    { timestamps: true }
);

export default mongoose.model('Post', postSchema);

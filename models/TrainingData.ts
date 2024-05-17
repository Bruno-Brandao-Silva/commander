import mongoose from "mongoose";

const trainingDataSchema = new mongoose.Schema({
    tuple: {
        type: {
            text: String,
            label: String
        },
        required: true,
        unique: true
    },
});

export default mongoose.model('TrainingData', trainingDataSchema);
import mongoose from 'mongoose';

const classifierSchema = new mongoose.Schema({
    classifier: { type: JSON, required: true },
});
export default mongoose.model('Classifier', classifierSchema);

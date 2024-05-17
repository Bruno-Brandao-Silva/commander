import natural, { PorterStemmerPt } from 'natural';
import Classifier from '../models/Classifier';
import TrainingData from '../models/TrainingData';

let classifier = new natural.BayesClassifier(PorterStemmerPt);;

function trainNewExamples(examples: { text: string, label: string }[]) {
    examples.forEach(({ text, label }) => {
        classifier.addDocument(text, label);
    });
    classifier.train();
    saveModel();
}

function addExamples(examples: { text: string, label: string }[]) {
    examples.forEach(({ text, label }) => {
        classifier.addDocument(text, label);
    });
}

function classifyText(text: string) {
    return classifier.classify(text);
}

async function saveModel() {
    try {
        await Classifier.deleteMany({});
        const model = new Classifier({ classifier: classifier });
        await model.save();
    } catch (error) {
        console.error('Error saving trained model:', error);
    }
}

async function loadModel() {
    try {
        const model = await Classifier.findOne({});
        if (model) {
            classifier = natural.BayesClassifier.restore(model.classifier);
        } else {
            const trainingData = await TrainingData.find({});
            if (trainingData.length > 0)
                trainNewExamples(trainingData.map((item) => ({ text: item.tuple.text!, label: item.tuple.label! })));
            else
                console.log('No training data found to load model');
        }
    } catch (error) {
        console.error('Error loading trained model:', error);
    }
}

export default { trainNewExamples, addExamples, classifyText, saveModel, loadModel };

import {askGemini} from "../services/geminiService.js"

const testGemini = async (req, res) => {
    try{
        const {prompt} = req.body;
        const response = await askGemini(prompt);

        res.status(200).json({response});
    
    }catch(err){
        res.status(500).json({message: err.message})
    }
};

export {testGemini};
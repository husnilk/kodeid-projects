const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const upload = multer({ dest: "uploads/" });

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const imageToGenerativePart = (filePath) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType: "image/png",
  },
});

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;
  console.log("Received prompt:", prompt);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      text: response.text(),
    });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt || "Describe the image";
  const image = imageToGenerativePart(req.file.path);

  try {
    const result = await model.generateContent(prompt, image);
    const response = await result.response;

    res.json({
      output: response.text(),
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  } finally {
    fs.unlinkSync(req.file.path); // Clean up the uploaded file
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString("base64");
    const mimeType = req.file.mimetype;

    try {
      const documentPart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };
      const result = await model.generateContent([
        "Analyze this document",
        documentPart,
      ]);
      const response = await result.response;
      res.json({
        output: response.text(),
      });
    } catch (error) {
      console.error("Error generating from document:", error);
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlinkSync(filePath); // Clean up the uploaded file
    }
  }
);

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const audioBuffer = fs.readFileSync(req.file.path);
  const base64Audio = audioBuffer.toString("base64");
  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: req.file.mimetype,
    },
  };

  try {
    const result = await model.generateContent([
      "Transcribe this audio",
      audioPart,
    ]);
    const response = await result.response;
    res.json({
      output: response.text(),
    });
  } catch (error) {
    console.error("Error generating from audio:", error);
    res.status(500).json({ error: "Failed to generate from audio" });
  } finally {
    fs.unlinkSync(req.file.path); // Clean up the uploaded file
  }
});

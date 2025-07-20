const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Endpoint to handle text generation
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  console.log("User message:", userMessage);

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    res.json({
      reply: text,
    });
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Gemini Chatbot is running on http://localhost:${port}`);
});

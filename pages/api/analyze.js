import { Client } from "openai";

export default async (req, res) => {
  const openai = new Client({ key: process.env.OPENAI_API_KEY });

  if (req.method === "POST") {
    const { text } = req.body;

    try {
      const response = await openai.complete({
        prompt: text, // This is the text you want to analyze or expand upon
        max_tokens: 150 // This is just an example; adjust as needed
      });

      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: "OpenAI request failed." });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};

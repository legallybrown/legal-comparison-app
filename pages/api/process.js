import OpenAI from 'openai';
import multer from "multer";
import mammoth from 'mammoth';
import pdf from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, res) => {
  try {
    const handler = upload.single('file');
    
    handler(req, res, async (err) => {
      if (err) {
        console.error("Upload handler error:", err);
        return res.status(500).json({ error: "Upload failed." });
      }

      let extractedText;

      if (req.file) {
        const buffer = req.file.buffer;
        const extension = req.file.originalname.split('.').pop().toLowerCase();

        if (extension === 'docx') {
          const result = await mammoth.extractRawText({ buffer: buffer });
          extractedText = result.value;
        } else if (extension === 'pdf') {
          extractedText = await pdf(buffer);
        } else {
          return res.status(400).json({ error: "Unsupported file type." });
        }
      } else {
        extractedText = req.body.text;
      }

      if (!extractedText) {
        return res.status(400).json({ error: "No file uploaded and no text provided." });
      }   
      
      // Your predefined legal positions string here
      const predefinedLegalPositions = `
      Data Ownership and Control:Ensure clarity on data ownership, with the customer retaining ownership of their data.

      Define how data can be used, accessed, and returned upon contract termination.
      Service Level Agreement (SLA):

      Negotiate a strong SLA with clear uptime commitments and compensation for downtime.
      Data Security and Compliance:

      The provider should comply with industry-standard security certifications and regulations relevant to the customer’s sector.
      Data Privacy:

      Establish stringent data privacy policies, ensuring compliance with laws like GDPR or HIPAA as applicable.
      Pricing and Payment Terms:

      Agree on clear pricing structures, payment schedules, and conditions for price increases.
      Contract Duration and Renewal:

      Define contract length, renewal terms, and conditions for early termination.
      Technical Support and Customer Service:

      Set expectations for the level of support, response times, and availability of customer service.
      Integration and Compatibility:

      The SaaS solution should easily integrate with the customer’s existing systems and software.
      Dispute Resolution:

      Agree on mechanisms for resolving disputes, including arbitration or litigation, and jurisdiction for legal matters.
      Data Backup and Recovery:

      The provider should have robust data backup and recovery processes to prevent data loss and ensure business continuity.


      `; 
      
const promptText = `
  You're an expert, senior commercial lawyer. Given the following Document, suggest edits to align it with the Predefined Legal Positions I give to you. Return a summary of the changes and the suggested edits in a structured format like:

  [
    {"type": "add", "text": "suggested addition"},
    {"type": "delete", "text": "suggested deletion"}
  ]

  Document:
  ${extractedText}

  Predefined Legal Positions:
  ${predefinedLegalPositions}
`;
const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: promptText }],
        model: 'gpt-4',
      });

      console.log('suggestedEdits is', completion.choices[0].message.content);

      const suggestedEdits = completion.choices[0].message.content;
      
      const styledEdits = styleSuggestedEdits(suggestedEdits)

      return res.status(200).json({ openaiResponse: styledEdits });
      return res.status(500).json({ error: "Unknown error occurred." });
    });
  } catch (error) {
    console.error("Error:", error, JSON.stringify(error, null, 2));
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error." });
    }
  }
};


function styleSuggestedEdits(jsonEdits) {
    let styledText = "";
    try {
        const edits = JSON.parse(jsonEdits);
        for (let edit of edits) {
            if (edit.type === "add") {
                styledText += "<span style='color: green'>" + edit.text + "</span> ";
            } else if (edit.type === "delete") {
                styledText += "<span style='color: red; text-decoration: line-through;'>" + edit.text + "</span> ";
            }
        }
    } catch (error) {
        console.error("Error parsing JSON edits:", error);
    }
    return styledText;
}

    function compareTexts(originalText, newText) {
  console.log("Old Text:", originalText);
  console.log("New Text:", newText);
  const changes = diffLines(originalText, newText);

  let result = [];

  for (let part of changes) {
    if (part.added) {
      result.push({ type: 'added', value: part.value });
    } else if (part.removed) {
      result.push({ type: 'removed', value: part.value });
    } else {
      result.push({ type: 'unchanged', value: part.value });
    }
  }

  return result;
}
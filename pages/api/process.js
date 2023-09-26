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
      const predefinedLegalPositions = `License Grant:

      The SaaS provider grants the customer a non-exclusive, non-transferable right to use the software service for its internal business purposes.
      Service Availability:

      The SaaS provider guarantees a 99.5% uptime, excluding scheduled maintenance. Downtime compensation mechanisms are defined.
      Data Protection and Privacy:

      The provider ensures that all customer data is stored and processed in compliance with applicable data protection laws, such as GDPR. The provider acts as a data processor on behalf of the customer.
      Service Fees:

      The customer agrees to pay a monthly/annual subscription fee. Late payments may attract an interest rate of 2% above the base rate.
      Service Level Agreement (SLA):

      The provider commits to respond to high-priority issues within 2 hours and resolves them within 24 hours.
      Termination:

      Either party can terminate the contract with 30 days' notice. Early termination may result in penalties.
      Intellectual Property:

      All intellectual property rights in the software service remain the property of the provider. The customer is granted a license to use but not to modify or distribute the software.
      Confidentiality:

      Both parties commit to keeping all proprietary information they learn during the contract confidential.
      Limitation of Liability:

      The provider's liability for any damages, whether in contract or tort, shall not exceed the fees paid by the customer in the previous 12 months.
      Data Backup and Restoration:

      The provider ensures daily backups of customer data and commits to restoring data within 48 hours in case of any data loss.
      Support and Maintenance:

      The provider offers customer support from 9 AM to 6 PM on weekdays. Scheduled maintenance will be communicated 48 hours in advance.
      Integration and APIs:

      The provider offers APIs for integration and ensures they remain functional. Any changes to APIs will be communicated 60 days in advance.
      Non-Solicitation:

      During the contract and for 1 year after its termination, neither party shall solicit or hire employees of the other party without written consent.
      Governing Law:

      The contract will be governed by the laws of California, USA, and disputes will be resolved in the courts of San Francisco.
      Amendments:

      Any changes to the contract must be in writing and signed by both parties.
      `; 
      
const promptText = `
  You're an expert, senior commercial lawyer. Given the following Document, suggest edits to align it with the Predefined Legal Positions I give to you. Return the suggested edits in a structured format like:

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
        model: 'gpt-3.5-turbo-16k-0613',
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
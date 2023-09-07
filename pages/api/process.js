import OpenAI from 'openai';
import multer from "multer";
import { extractedText as extractTextFromDocx } from "mammoth";
import pdf from "pdf-parse";
import { diffLines } from "diff";
import mammoth from 'mammoth';


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
  const handler = upload.single('file');

  handler(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Upload failed." });
    }

    let extractedText;

    if (req.file) {
      const buffer = req.file.buffer;
      const extension = req.file.originalname.split('.').pop().toLowerCase();

      if (extension === 'docx') {
        console.log ('its a docx')
        const result = await mammoth.extractRawText({ buffer: buffer });
        console.log ('docx result is ', result)
        extractedText = result.value;
        console.log('extractredText after assigned =====', extractedText)
      } else if (extension === 'pdf') {
        console.log ('its a pdf')
        extractedText = await pdf(buffer);
      } else {
        console.log ('dunno file type')
        return res.status(400).json({ error: "Unsupported file type." });
      }
    } else {
      extractedText = req.body.text;
    }

    // Now that we have the text, let's process it with OpenAI
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: extractedText }],
        model: 'gpt-3.5-turbo-16k',
      });

      const predefinedLegalPositions = `

1. **Governing Law and Jurisdiction**:
    - The contract will be governed by the laws of New York, USA.
    - Any disputes arising from this contract will be resolved in the courts of New York City.

2. **Payment Terms**:
    - Payment shall be made within 30 days of receipt of invoice.
    - Late payments are subject to an interest rate of 5% per month.

3. **Confidentiality**:
    - Both parties agree to keep all proprietary information confidential and not to disclose it to third parties.
    - This confidentiality obligation shall survive the termination of this contract for a period of 3 years.

4. **Termination**:
    - Either party may terminate this contract with 60 days written notice.
    - In the event of a material breach, the non-breaching party may terminate the contract immediately.

5. **Indemnification**:
    - Company A shall indemnify Company B against any claims, damages, or liabilities arising from Company A's breach of this contract.

6. **Limitation of Liability**:
    - Neither party shall be liable for indirect, incidental, or consequential damages.
    - Total liability under this contract shall not exceed the total amount of $100,000.

7. **Force Majeure**:
    - Neither party shall be held responsible for failure to perform its obligations if such failure is due to events beyond its reasonable control, such as natural disasters, war, or civil unrest.

8. **Intellectual Property**:
    - Any intellectual property developed during the course of this contract shall remain the property of Company A.
    - Company B is granted a non-exclusive license to use the intellectual property for marketing purposes.

9. **Non-Compete**:
    - For a duration of 2 years after the termination of this contract, Company B agrees not to engage in business activities that directly compete with Company A in North America.

10. **Non-Solicitation**:
    - During the contract and for 2 years after its termination, neither party shall solicit or hire employees of the other party without written consent.

11. **Assignment**:
    - Neither party may assign or transfer their rights or obligations under this contract without the written consent of the other party.

12. **Amendments**:
    - Any changes to this contract must be in writing and signed by both parties.

13. **Notices**:
    - All notices under this contract shall be in writing and shall be deemed given when delivered personally or by courier, or 7 days after being sent by registered mail.

14. **Entire Agreement**:
    - This contract represents the entire agreement between the parties and supersedes all prior negotiations, understandings, and agreements between the parties.

15. **Waiver**:
    - Failure by any party to enforce any provision of this contract will not be deemed a waiver of future enforcement of that or any other provision.
      `;

      const comparisonResult = compareTexts(extractedText, predefinedLegalPositions);

      res.status(200).json({ openaiResponse: completion.data, comparison: comparisonResult });

    } catch (error) {
      console.error("Error calling OpenAI:", error);
      res.status(500).json({ error: "OpenAI request failed." });
    }
  });
};

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

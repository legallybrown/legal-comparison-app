import { useState } from 'react';
import './styles.css';


export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({});
  const [showTextContainer, setShowTextContainer] = useState(false);


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const handleAddComment = (index) => {
    const comment = prompt("Enter your comment:");
    if (comment) {
      setComments({ ...comments, [index]: comment });
    }
  };

  const handleSubmit = async () => {
    setResults(null)
    setIsLoading(true);
    setError(null);

    let formData = new FormData();
  
    if (text) {
      formData.append('text', text);
    } else if (file) {
      formData.append('file', file);
    } else {
      setIsLoading(false);
      setError("Please upload a file or paste text before submitting.");
      return;
    }

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        throw new Error("Server response was not ok.");
      }

      const data = await response.json();
      console.log('setting results', data)
      setResults(data.openaiResponse);
    } catch (err) {
      setError(err.message || "An error occurred while processing. Please try again.");
    }

    setIsLoading(false);
  };

  const handleClear = () => {
    setText("");
    setResults(null);
    setError(null);
  };

  return (
    <div className="bg-gray-200 min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">GPT-4 Contract Review</h1>
      <div className="button-group">
        <input type="file" onChange={handleFileChange} />
        <p> Or upload your own text </p>
        <textarea className="input-text" value={text} onChange={e => setText(e.target.value)}></textarea>
      </div>
      <button className="btn-primary" onClick={handleSubmit}>{isLoading ? <div className="spinner"></div> : 'Submit'}</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results && (
        <div className="results-container" dangerouslySetInnerHTML={{ __html: results.split('\n').join('<br>') }} />
        )}
      <button className="btn-secondary" onClick={handleClear}>Clear Results</button>
    </div>
  );
}


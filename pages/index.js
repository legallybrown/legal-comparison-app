import { useState } from 'react';


export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({});


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
      setResults(data.comparison);
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
      <h1 className="text-2xl font-bold mb-4">Legal Comparison App</h1>
      <input type="file" onChange={handleFileChange} />
      <textarea value={text} onChange={e => setText(e.target.value)}></textarea>
      <button onClick={handleSubmit}>Submit</button>
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results && (
        <div>
          {results.map((part, index) => (
            <div key={index}>
              <span style={getStyleForPartType(part.type)}>
                {part.value}
              </span>
              <button onClick={() => handleAddComment(index)}>Add Comment</button>
              {comments[index] && <p>{comments[index]}</p>}
            </div>
          ))}
        </div>
        )}
      <button onClick={handleClear}>Clear Results</button>
    </div>
  );
}

function getStyleForPartType(type) {
  switch (type) {
    case 'added':
      return { backgroundColor: 'green', display: 'inline-block' };
    case 'removed':
      return { backgroundColor: 'red', textDecoration: 'line-through', display: 'inline-block' };
    default:
      return { display: 'inline-block' };
  }
}

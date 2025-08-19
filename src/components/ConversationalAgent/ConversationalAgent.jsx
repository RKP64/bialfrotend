import React, { useState } from 'react';
import axios from 'axios';
// This line requires a file named "ConversationalAgent.module.css" in the same folder.
import styles from './ConversationalAgent.module.css';

function ConversationalAgent() {
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'https://bialbackend.onrender.com';

  const handleSubmit = async (queryOverride) => {
    const currentQuestion = queryOverride || userInput;
    if (!currentQuestion.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: currentQuestion }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedHistory = newHistory.slice(0, -1).map(({ role, content }) => ({ role, content }));

      const response = await axios.post(
        `${API_BASE_URL}/chat`, 
        {
          question: currentQuestion,
          history: sanitizedHistory
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      setChatHistory([...newHistory, { role: 'assistant', content: response.data.answer, id: Date.now(), feedback: null }]);
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError("Failed to get an answer. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId, feedbackType) => {
    const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || chatHistory[messageIndex].feedback) return;

    const question = chatHistory[messageIndex - 1]?.content || "N/A";
    const answer = chatHistory[messageIndex].content;

    try {
        await axios.post(`${API_BASE_URL}/feedback`, {
            question,
            answer,
            feedback: feedbackType
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const updatedHistory = [...chatHistory];
        updatedHistory[messageIndex].feedback = feedbackType;
        setChatHistory(updatedHistory);
    } catch (err) {
        console.error("Error submitting feedback:", err);
    }
  };

  // Generic download handler for any HTML content
  const handleDownload = async (htmlContent, fileName) => {
    if (!htmlContent) return;
    setIsDownloading(true);
    setError(null);
    try {
        const response = await axios.post(`${API_BASE_URL}/download-report`, 
            { html_content: htmlContent },
            { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.docx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

    } catch (err) {
        console.error("Error downloading report:", err);
        setError("Failed to download the report.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className={styles.conversationalAgent}>
      <h2 className={styles.pageTitle}>Conversational Agent (Index: consolidated)</h2>

      {chatHistory.length === 0 ? (
        <div className={styles.askQuestionSection}>
          <h3>Ask a question</h3>
          <div className={styles.predefinedQuestions}>
            <button onClick={() => handleSubmit("Calculate and compare the YoY change of employee expenses of DIAL and MIAL for the fourth control period")}>
              Calculate and compare the YoY change of employee expenses of DIAL and MIAL for the fourth control period
            </button>
            <button onClick={() => handleSubmit("What is the YoY change of employee expenses submitted by MIAL for the fourth control period and the rationale for the growth rates")}>
              What is the YoY change of employee expenses submitted by MIAL for the fourth control period and the rationale for the growth rates
            </button>
            <button onClick={() => handleSubmit("Compare the manpower expense per total passenger traffic submitted by DIAL and MIAL respectively for fourth control period")}>
              Compare the manpower expense per total passenger traffic submitted by DIAL and MIAL respectively for fourth control period
            </button>
          </div>
          <div className={styles.questionInputArea}>
            <label htmlFor="questionInput">Your question about regulatory documents:</label>
            <textarea
              id="questionInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your question here..."
              rows="4"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            />
            <button onClick={() => handleSubmit()} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.chatWindow}>
            <div className={styles.chatHistory}>
            {chatHistory.map((msg, index) => (
                <div key={index} className={styles.chatMessage} data-sender={msg.role}>
                <div className={styles.chatBubble}>
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                    {msg.role === 'assistant' && (
                    <div className={styles.feedbackContainer}>
                        <button 
                        onClick={() => handleFeedback(msg.id, 'like')} 
                        disabled={!!msg.feedback}
                        className={msg.feedback === 'like' ? styles.feedbackSelected : ''}
                        >👍</button>
                        <button 
                        onClick={() => handleFeedback(msg.id, 'dislike')} 
                        disabled={!!msg.feedback}
                        className={msg.feedback === 'dislike' ? styles.feedbackSelected : ''}
                        >👎</button>
                        {/* This button now downloads only the content of this specific message */}
                        <button className={styles.downloadButton} onClick={() => handleDownload(msg.content, 'Chat_Response')} disabled={isDownloading}>
                            {isDownloading ? '...' : '📥'}
                        </button>
                    </div>
                    )}
                </div>
                </div>
            ))}
            {isLoading && <div className={styles.chatMessage} data-sender="assistant"><div className={styles.chatBubble}>Thinking...</div></div>}
            </div>
            <div className={styles.chatInputArea}>
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    rows="3"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                />
                <button onClick={() => handleSubmit()} disabled={isLoading}>
                    Send
                </button>
            </div>
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}

export default ConversationalAgent;

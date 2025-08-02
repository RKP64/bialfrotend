import React, { useState } from 'react';
import axios from 'axios';
import styles from './ConversationalAgent.module.css';

function ConversationalAgent() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [executionPlan, setExecutionPlan] = useState([]);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000'; // Replace with your FastAPI backend URL

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handlePredefinedQuestion = (query) => {
    setQuestion(query);
    handleSubmit(query);
  };

  const handleSubmit = async (queryToSubmit = question) => {
    if (!queryToSubmit.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setAnswer(null);
    setExecutionPlan([]);
    setError(null);

    try {
      // Simulate step-by-step execution as seen in the video
      setExecutionPlan([{ step: "Thinking...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

      setExecutionPlan(prev => [...prev, { step: "Generating query plan...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setExecutionPlan(prev => [...prev.map(s => s.step === "Generating query plan..." ? { ...s, status: "completed" } : s),
                                { step: "Executing Step 1: MIAL employee expenses for fourth control period...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actual API call to your FastAPI backend
      const response = await axios.post(`${API_BASE_URL}/query`, { query: queryToSubmit });
      
      setExecutionPlan(prev => prev.map(s => {
        if (s.status === "pending") return { ...s, status: "completed" };
        return s;
      }));
      setExecutionPlan(prev => [...prev, { step: "Synthesizing final answer...", status: "completed" }]);
      
      setAnswer(response.data); // Assuming FastAPI returns the structured answer

    } catch (err) {
      console.error("Error fetching answer:", err);
      setError("Failed to get an answer. Please try again later or check the backend.");
      setExecutionPlan([]); // Clear execution plan on error
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render structured answer content
  const renderAnswerContent = (content) => {
    if (!content) return null;

    const renderTable = (data, title) => (
      <div className={styles.answerSection}>
        <h3>{title}</h3>
        {/* THE TYPO HAS BEEN CORRECTED ON THIS LINE */}
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {data.headers && data.headers.map((header, i) => <th key={i}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows && data.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => <td key={j}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const renderList = (items, title) => (
        <div className={styles.answerSection}>
            <h3>{title}</h3>
            <ul>
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );

    const renderParagraph = (text, title) => (
        <div className={styles.answerSection}>
            {title && <h3>{title}</h3>}
            <p>{text}</p>
        </div>
    );

    return (
      <div className={styles.answerOutput}>
        <h2>{content.title || "Answer"}</h2>

        {content.sections && content.sections.map((section, index) => (
            <div key={index} className={styles.sectionContainer}>
                {section.type === 'table' && renderTable(section.data, section.title)}
                {section.type === 'list' && renderList(section.items, section.title)}
                {section.type === 'paragraph' && renderParagraph(section.text, section.title)}
            </div>
        ))}

        {/* Fallback rendering based on a simpler structure */}
        {content.employeeExpenses && renderTable(content.employeeExpenses, "YoY Change of Employee Expenses")}
        {content.growthRates && renderList(content.growthRates, "Rationale for Growth Rates")}
        {content.summary && renderParagraph(content.summary, "Summary of Employee Expenses")}
        {content.conclusion && renderParagraph(content.conclusion, "Conclusion")}
        {content.references && renderList(content.references, "References")}

      </div>
    );
  };

  return (
    <div className={styles.conversationalAgent}>
      <h2 className={styles.pageTitle}>Conversational Agent (Index: consolidated)</h2>

      <div className={styles.askQuestionSection}>
        <h3>Ask a question</h3>
        <div className={styles.predefinedQuestions}>
          <button onClick={() => handlePredefinedQuestion("Calculate and compare the YoY change of employee expenses of DIAL and MIAL for the fourth control period")}>
            Calculate and compare the YoY change of employee expenses of DIAL and MIAL for the fourth control period
          </button>
          <button onClick={() => handlePredefinedQuestion("What is the YoY change of employee expenses submitted by MIAL for the fourth control period and the rationale for the growth rates")}>
            What is the YoY change of employee expenses submitted by MIAL for the fourth control period and the rationale for the growth rates
          </button>
          <button onClick={() => handlePredefinedQuestion("Compare the manpower expense per total passenger traffic submitted by DIAL and MIAL respectively for fourth control period")}>
            Compare the manpower expense per total passenger traffic submitted by DIAL and MIAL respectively for fourth control period
          </button>
        </div>
        <div className={styles.questionInputArea}>
          <label htmlFor="questionInput">Your question about regulatory documents:</label>
          <textarea
            id="questionInput"
            value={question}
            onChange={handleQuestionChange}
            placeholder="Type your question here..."
            rows="4"
          />
          <button onClick={() => handleSubmit()} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Question'}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {(loading || executionPlan.length > 0) && (
        <div className={styles.executionPlan}>
          <h3>Execution Plan:</h3>
          {executionPlan.map((item, index) => (
            <div key={index} className={styles.executionStep}>
              <span className={item.status === "completed" ? styles.completed : styles.pending}>
                {item.status === "completed" ? '✔' : '...'}
              </span>
              <span>{item.step}</span>
            </div>
          ))}
          {loading && <div className={styles.loadingIndicator}>Thinking...</div>}
        </div>
      )}

      {answer && (
        <div className={styles.answerContainer}>
          {renderAnswerContent(answer)}
        </div>
      )}
    </div>
  );
}

export default ConversationalAgent;
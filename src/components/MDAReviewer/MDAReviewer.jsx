import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './MDAReviewer.module.css';

// NOTE: This component references images from the 'public/images' folder using direct URL paths.
// Ensure your images (e.g., kempegowda-logo.png) are located in the `public/images` directory.

function MDAReviewer() {
  const [file, setFile] = useState(null);
  const [analysisType, setAnalysisType] = useState('MDA Manpower Analysis');
  const [analysisReport, setAnalysisReport] = useState(null);
  const [refinementHistory, setRefinementHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingSteps, setProcessingSteps] = useState([]);
  const fileInputRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000'; // Replace with your FastAPI backend URL

  const getFileIcon = (file) => {
    if (!file) return '/images/kempegowda-logo.png';
    const fileType = file.name.split('.').pop().toLowerCase();
    if (fileType === 'pdf') return '/images/pdf-icon.png';
    if (['doc', 'docx'].includes(fileType)) return '/images/word-icon.png';
    if (['xls', 'xlsx'].includes(fileType)) return '/images/excel-icon.png';
    return '/images/kempegowda-logo.png';
  };

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
        setAnalysisReport(null);
        setRefinementHistory([]);
        setProcessingSteps([]);
      } else {
        setError("Invalid file type. Please upload a PDF, Word, or Excel document.");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleGenerateReport = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }
    setIsLoading(true);
    setAnalysisReport(null);
    setError('');
    setProcessingSteps([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysis_type', analysisType);

    try {
      setProcessingSteps([{ step: "Processing document and generating full report...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingSteps(prev => [...prev, { step: "Step 1/3: Generating context...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingSteps(prev => [...prev.map(s => s.step.startsWith("Step 1/3") ? { ...s, status: "completed" } : s), { step: "Step 2/3: Drawing rationale...", status: "pending" }]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingSteps(prev => [...prev.map(s => s.step.startsWith("Step 2/3") ? { ...s, status: "completed" } : s), { step: "Step 3/3: Compiling report...", status: "pending" }]);
      
      const response = await axios.post(`${API_BASE_URL}/mda_generate_report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setProcessingSteps(prev => prev.map(s => s.status === "pending" ? { ...s, status: "completed" } : s));
      setAnalysisReport(response.data);

    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.response?.data?.detail || "Failed to generate the report.");
      setProcessingSteps([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineReport = async () => {
    if (!userInput.trim() || !analysisReport) return;

    const newHistory = [...refinementHistory, { sender: 'user', text: userInput }];
    setRefinementHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/mda_refine_report`, {
        report: analysisReport,
        instruction: userInput,
      });
      const refinedReport = response.data.refined_report;
      setAnalysisReport(refinedReport);
      setRefinementHistory([...newHistory, { sender: 'ai', text: "The report has been updated." }]);
    } catch (err) {
      console.error("Error refining report:", err);
      const errorMessage = err.response?.data?.detail || "Failed to refine the report.";
      setRefinementHistory([...newHistory, { sender: 'ai', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // This helper function renders the report content, mirroring the working component's structure.
  const renderReportContent = (report) => {
    if (!report) return null;

    const renderSection = (section, level = 1) => {
        const HeadingTag = `h${Math.min(level + 2, 6)}`;
        return (
            <div key={section.title} className={styles.reportSection}>
                <HeadingTag>{`${section.number ? section.number + '. ' : ''}${section.title}`}</HeadingTag>
                {section.paragraphs && section.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                {section.listItems && <ul>{section.listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                {section.table && (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>{section.table.headers && section.table.headers.map((header, i) => <th key={i}>{header}</th>)}</tr>
                        </thead>
                        <tbody>
                            {section.table.rows && section.table.rows.map((row, i) => (
                                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {section.subsections && section.subsections.map(sub => renderSection(sub, level + 1))}
            </div>
        );
    };

    return (
      <div className={styles.reportContent}>
        <h2>Analysis Report for: {file ? file.name : 'Document'}</h2>
        <p>This report analyzes the uploaded file by comparing its key points against historical data.</p>
        {report.sections && report.sections.map(section => renderSection(section, 0))}
      </div>
    );
  };

  return (
    <div className={styles.mdaReviewer}>
      <div className={styles.controlPanel}>
        <div 
          className={styles.uploadArea} 
          onDragOver={handleDragOver} 
          onDrop={handleDrop}
          onClick={handleFileInputClick}
        >
          <input 
            type="file" 
            accept=".pdf,.doc,.docx,.xls,.xlsx" 
            onChange={(e) => handleFileChange(e.target.files[0])} 
            ref={fileInputRef} 
            style={{ display: 'none' }}
          />
          <img src={getFileIcon(file)} alt="File type icon" className={styles.uploadIcon} />
          <div className={styles.uploadText}>
            {file ? <span>{file.name}</span> : <span>Drag & Drop File</span>}
            <small>{file ? 'Click to change' : 'PDF, Word, or Excel'}</small>
          </div>
        </div>
        <div className={styles.analysisSelector}>
          <label htmlFor="analysisType">Analysis Type</label>
          <select 
            id="analysisType" 
            value={analysisType} 
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <option>MDA Manpower Analysis</option>
            <option>Utility Analysis</option>
          </select>
        </div>
        <button 
          className={styles.generateButton} 
          onClick={handleGenerateReport} 
          disabled={!file || isLoading}
        >
          {isLoading && !analysisReport ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
      {error && <p className={styles.mainErrorMessage}>{error}</p>}

      <div className={styles.mainContent}>
        <div className={styles.reportDisplay}>
          {isLoading && !analysisReport && (
            <div className={styles.loadingOverlay}>
              {processingSteps.map((step, index) => (
                <p key={index}>
                  <span className={step.status === "completed" ? styles.completed : styles.pending}>
                    {step.status === "completed" ? '✔' : '...'}
                  </span>
                  {step.step}
                </p>
              ))}
            </div>
          )}
          {analysisReport ? (
            renderReportContent(analysisReport)
          ) : (
            !isLoading && <div className={styles.placeholder}>Your generated report will appear here.</div>
          )}
        </div>
        
        <div className={styles.chatContainer}>
          <div className={styles.chatHistory}>
            {refinementHistory.map((msg, index) => (
              <div key={index} className={styles.chatMessage} data-sender={msg.sender}>
                <div className={styles.chatBubble}>{msg.text}</div>
              </div>
            ))}
             {isLoading && analysisReport && (
                <div className={styles.chatMessage} data-sender="ai">
                  <div className={styles.chatBubble}>Refining report...</div>
                </div>
              )}
          </div>
          <div className={styles.chatInputArea}>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={analysisReport ? "Enter instruction to refine the report..." : "Generate a report first."}
              rows="3"
              disabled={!analysisReport || isLoading}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleRefineReport()}
            />
            <button onClick={handleRefineReport} disabled={!analysisReport || isLoading}>
              Refine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MDAReviewer;


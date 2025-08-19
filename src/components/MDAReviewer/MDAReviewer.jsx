import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from './MDAReviewer.module.css';

// This component now handles the full, multi-step workflow.
function MDAReviewer() {
  const [file, setFile] = useState(null);
  const [analysisCategory, setAnalysisCategory] = useState('MDA Manpower Analysis');
  const [specificAnalysis, setSpecificAnalysis] = useState('');
  const [mainReport, setMainReport] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const API_BASE_URL = 'https://bialbackend.onrender.com';

  const analysisPromptsConfig = {
    "MDA Manpower Analysis": [
      "Analysis of manpower expenditure projection for BIAL for fourth control period",
      "Analysis of actual manpower expenditure for BIAL for third control period"
    ],
    "Utility Analysis": [
      "Analysis of electricity expenditure projection for BIAL for third control period",
      "Analysis of water expenditure projection for BIAL for third control period"
    ],
    "R&M Analysis": [
        "Projected R&M Expenditure Analysis",
        "Actual R&M Expenditure True-Up Analysis"
    ]
  };

  useEffect(() => {
    if (analysisCategory && analysisPromptsConfig[analysisCategory]) {
      setSpecificAnalysis(analysisPromptsConfig[analysisCategory][0]);
    }
  }, [analysisCategory]);

  const getFileIcon = (file) => {
    if (!file) return '/images/kempegowda-logo.png';
    const fileType = file.name.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(fileType)) return '/images/word-icon.png';
    return '/images/kempegowda-logo.png';
  };

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setMainReport('');
      setChatHistory([]);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleCategoryChange = (e) => {
    setAnalysisCategory(e.target.value);
  };

  const handleGenerateReport = async () => {
    if (!file || !specificAnalysis) {
      setError("Please upload a file and select a specific analysis.");
      return;
    }
    setIsLoadingReport(true);
    setMainReport('');
    setChatHistory([]);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('analysis_title', specificAnalysis);

    const endpoint = `${API_BASE_URL}/generate-initial-report`;

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data && typeof response.data.report === 'string') {
        setMainReport(response.data.report);
      } else {
        console.error("Received malformed report data:", response.data);
        setError("Received an invalid report format from the server.");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.response?.data?.detail || "Failed to generate the initial report.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!userInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: userInput }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoadingChat(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/mda-chat`, {
        question: userInput,
        history: newHistory.slice(0, -1).map(({ role, content }) => ({ role, content }))
      });
      if (response.data && typeof response.data.answer === 'string') {
        setChatHistory([...newHistory, { role: 'assistant', content: response.data.answer, integrated: false }]);
      } else {
        const errorMessage = "Received an invalid chat response from the server.";
        setChatHistory([...newHistory, { role: 'assistant', content: `Error: ${errorMessage}`, integrated: true }]);
      }
    } catch (err) {
      console.error("Error in chat:", err);
      const errorMessage = err.response?.data?.detail || "Failed to get a response.";
      setChatHistory([...newHistory, { role: 'assistant', content: `Error: ${errorMessage}`, integrated: true }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleIntegrateReport = async (newInfo, messageIndex) => {
      setIsLoadingReport(true);
      try {
          const response = await axios.post(`${API_BASE_URL}/refine-report`, {
              original_report: mainReport,
              new_info: newInfo,
          });
          if (response.data && typeof response.data.refined_report === 'string') {
            setMainReport(response.data.refined_report);
            const updatedHistory = chatHistory.map((msg, index) => 
                index === messageIndex ? { ...msg, integrated: true } : msg
            );
            setChatHistory(updatedHistory);
          } else {
            setError("Received an invalid refined report from the server.");
          }
      } catch (err) {
          console.error("Error refining report:", err);
          setError(err.response?.data?.detail || "Failed to refine the report.");
      } finally {
          setIsLoadingReport(false);
      }
  };

  // Generic download handler for any HTML content
  const handleDownloadReport = async (htmlContent, fileName) => {
    if (!htmlContent) return;
    setIsDownloading(true);
    setError('');
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
        setError(err.response?.data?.detail || "Failed to download the report.");
    } finally {
        setIsDownloading(false);
    }
  };

  // Handler to compile and download the full chat history
  const handleDownloadChatHistory = () => {
    const fullChatHtml = chatHistory.map(msg => 
        `<div><h3>${msg.role === 'user' ? 'You' : 'Assistant'}:</h3>${msg.content}</div>`
    ).join('<hr />');
    handleDownloadReport(`<h1>Chat History</h1>${fullChatHtml}`, 'Chat_History_Conclusion');
  };

  return (
    <div className={styles.mdaReviewer}>
        <div className={styles.controlPanel}>
            <div className={styles.uploadArea} onClick={() => fileInputRef.current.click()} onDragOver={handleDragOver} onDrop={handleDrop}>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e.target.files[0])} style={{ display: 'none' }} accept=".doc,.docx"/>
                <img src={getFileIcon(file)} alt="File type icon" className={styles.uploadIcon} />
                <div className={styles.uploadText}>
                    <span>{file ? file.name : 'Upload Word Document'}</span>
                    <small>{file ? 'Click to change' : '.docx only'}</small>
                </div>
            </div>
            <div className={styles.analysisSelector}>
                <label>Analysis Category</label>
                <select value={analysisCategory} onChange={handleCategoryChange}>
                    {Object.keys(analysisPromptsConfig).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className={styles.analysisSelector}>
                <label>Specific Analysis</label>
                <select value={specificAnalysis} onChange={(e) => setSpecificAnalysis(e.target.value)}>
                    {(analysisPromptsConfig[analysisCategory] || []).map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </select>
            </div>
            <button className={styles.generateButton} onClick={handleGenerateReport} disabled={!file || isLoadingReport}>
                {isLoadingReport ? 'Generating...' : 'Generate Report'}
            </button>
            {/* Download button for the main report */}
            {mainReport && (
                <button className={styles.downloadButton} onClick={() => handleDownloadReport(mainReport, 'Generated_Report')} disabled={isDownloading}>
                    {isDownloading ? 'Downloading...' : 'Download Report'}
                </button>
            )}
        </div>
        {error && <p className={styles.mainErrorMessage}>{error}</p>}

        <div className={styles.mainContent}>
            <div className={styles.reportDisplay}>
                {isLoadingReport && <div className={styles.loadingOverlay}><h3>Generating & Refining Report...</h3></div>}
                {mainReport && typeof mainReport === 'string' ? (
                    <div className={styles.reportContent} dangerouslySetInnerHTML={{ __html: mainReport }} />
                ) : (
                    !isLoadingReport && <div className={styles.placeholder}>Your generated report will appear here.</div>
                )}
            </div>
            
            <div className={styles.chatContainer}>
                <div className={styles.chatHistory}>
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={styles.chatMessage} data-sender={msg.role}>
                            <div className={styles.chatBubble}>
                                {msg.content && typeof msg.content === 'string' && <div dangerouslySetInnerHTML={{ __html: msg.content }} />}
                                {msg.role === 'assistant' && !msg.integrated && (
                                    <button className={styles.integrateButton} onClick={() => handleIntegrateReport(msg.content, index)}>
                                        ✨ Integrate into Report
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoadingChat && <div className={styles.chatMessage} data-sender="ai"><div className={styles.chatBubble}>Thinking...</div></div>}
                </div>
                <div className={styles.chatInputArea}>
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={mainReport ? "Ask to elaborate or find new information..." : "Generate a report first to enable chat."}
                        rows="3"
                        disabled={!mainReport || isLoadingChat || isLoadingReport}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                    />
                    <button onClick={handleSendChatMessage} disabled={!mainReport || isLoadingChat || isLoadingReport}>
                        Ask
                    </button>
                    {/* Download button for the chat history */}
                    {chatHistory.length > 0 && (
                        <button className={styles.downloadChatButton} onClick={handleDownloadChatHistory} disabled={isDownloading}>
                            {isDownloading ? '...' : '📥'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

export default MDAReviewer;

import React, { useState, useEffect } from 'react';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@msal/react";
import { PublicClientApplication } from "@azure/msal-browser";

// --- MSAL Configuration ---
const msalConfig = {
    auth: {
        clientId: "YOUR_ENTRA_APP_CLIENT_ID", // Replace with your Client ID
        authority: "https://login.microsoftonline.com/YOUR_ENTRA_TENANT_ID", // Replace with your Tenant ID
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

const loginRequest = {
    scopes: ["User.Read"]
};

const msalInstance = new PublicClientApplication(msalConfig);

// --- Helper for API calls ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const apiClient = {
  chat: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  analyzeDocument: async (analysisTitle, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/analyze-document?analysis_title=${encodeURIComponent(analysisTitle)}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  refineReport: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/refine-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
};


// --- UI Components ---

const LoginScreen = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(e => {
            console.error(e);
        });
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-[#0E1117] text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-[#1E1E1E] rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-[#00A99D]">BIAL Regulatory Platform</h1>
                <p className="text-center text-gray-400">Please log in to continue</p>
                <button 
                    onClick={handleLogin}
                    className="w-full px-4 py-2 text-lg font-semibold text-white bg-[#00A99D] rounded-md hover:bg-[#008080] transition-colors"
                >
                    Login with Microsoft
                </button>
            </div>
        </div>
    );
};

const Sidebar = ({ appMode, setAppMode }) => {
  return (
    <div className="w-80 bg-[#1E1E1E] p-6 flex flex-col space-y-6">
      <h2 className="text-2xl font-bold text-white">Choose App</h2>
      <div className="space-y-2">
        <button onClick={() => setAppMode('Conversational Agent')} className={`w-full text-left p-3 rounded-md ${appMode === 'Conversational Agent' ? 'bg-[#00A99D] text-white' : 'hover:bg-gray-700'}`}>
          💬 Conversational Agent
        </button>
        <button onClick={() => setAppMode('MDA Reviewer')} className={`w-full text-left p-3 rounded-md ${appMode === 'MDA Reviewer' ? 'bg-[#00A99D] text-white' : 'hover:bg-gray-700'}`}>
          📄 MDA Reviewer
        </button>
      </div>
      <div className="flex-grow border-t border-gray-700 pt-6">
        <h3 className="text-xl font-semibold text-white mb-4">⚙️ Settings</h3>
        <p className="text-gray-400">Agent settings will be here.</p>
      </div>
    </div>
  );
};

const ConversationalAgent = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setIsLoading(true);
        setError(null);
        setAnswer(null);
        try {
            const payload = { question: question };
            const response = await apiClient.chat(payload);
            setAnswer(response.answer);
        } catch (err) {
            setError('Failed to get an answer. Please check the backend connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold text-white">Conversational Agent</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full h-32 p-3 bg-[#2A2A2A] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00A99D]"
                    placeholder="Ask your question about regulatory documents..."
                />
                <button type="submit" disabled={isLoading} className="px-6 py-2 font-semibold text-white bg-[#00A99D] rounded-md hover:bg-[#008080] disabled:bg-gray-500">
                    {isLoading ? 'Thinking...' : 'Submit Question'}
                </button>
            </form>
            {error && <div className="p-4 text-red-400 bg-red-900/50 border border-red-500 rounded-md">{error}</div>}
            {answer && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">💡 Answer</h3>
                    <div className="p-4 bg-[#2A2A2A] border border-gray-600 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: answer }}></div>
                </div>
            )}
        </div>
    );
};

const FollowUpChat = ({ originalReport, onReportRefined }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.chat({ question: input });
            setMessages([...newMessages, { role: 'assistant', content: response.answer }]);
        } catch (error) {
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (newInfo) => {
        try {
            const response = await apiClient.refineReport({ original_report: originalReport, new_info: newInfo });
            onReportRefined(response.refined_report);
            setMessages([]); // Clear chat after successful refinement
        } catch (error) {
            console.error("Failed to refine report:", error);
        }
    };

    return (
        <div className="mt-6 p-4 bg-[#1E1E1E] rounded-lg border border-gray-700">
            <h4 className="text-xl font-bold text-white mb-4">💬 Follow-up Chat</h4>
            <div className="space-y-4 h-64 overflow-y-auto mb-4 p-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-[#00A99D]' : 'bg-[#2A2A2A]'}`}>
                           <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content }}></p>
                           {msg.role === 'assistant' && (
                                <button onClick={() => handleRefine(msg.content)} className="mt-2 text-xs bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-2 rounded">
                                    ✨ Integrate & Refine Report
                                </button>
                           )}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-grow p-2 bg-[#2A2A2A] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00A99D]"
                    placeholder="Ask to elaborate or find new information..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="px-4 py-2 font-semibold text-white bg-[#00A99D] rounded-md hover:bg-[#008080] disabled:bg-gray-500">
                    Send
                </button>
            </form>
        </div>
    );
};


const MDAReviewer = () => {
    const [file, setFile] = useState(null);
    const [analysisTitle, setAnalysisTitle] = useState("Analysis of manpower expenditure projection for BIAL for fourth control period");
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const analysisOptions = [
        "Analysis of manpower expenditure projection for BIAL for fourth control period",
        "Analysis of actual manpower expenditure for BIAL for third control period",
    ];

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleSubmit = async () => {
        if (!file || !analysisTitle) return;
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const response = await apiClient.analyzeDocument(analysisTitle, file);
            setReport(response.report);
        } catch (err) {
            setError('Failed to generate the report. Please check the backend connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold text-white">MDA Reviewer</h2>
            <div className="space-y-4 p-6 bg-[#2A2A2A] border border-gray-600 rounded-md">
                <select value={analysisTitle} onChange={(e) => setAnalysisTitle(e.target.value)} className="w-full p-3 bg-[#1E1E1E] border border-gray-500 rounded-md text-white">
                    {analysisOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input type="file" onChange={handleFileChange} accept=".docx" className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#00A99D] file:text-white hover:file:bg-[#008080]" />
                <button onClick={handleSubmit} disabled={isLoading || !file} className="px-6 py-2 font-semibold text-white bg-[#00A99D] rounded-md hover:bg-[#008080] disabled:bg-gray-500">
                    {isLoading ? 'Generating...' : 'Generate Analysis Report'}
                </button>
            </div>
            {error && <div className="p-4 text-red-400 bg-red-900/50 border border-red-500 rounded-md">{error}</div>}
            {report && (
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2">📄 Analysis Report</h3>
                    <div className="p-4 bg-[#2A2A2A] border border-gray-600 rounded-md whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: report }}></div>
                    <FollowUpChat originalReport={report} onReportRefined={setReport} />
                </div>
            )}
        </div>
    );
};

const MainContent = () => {
    const { accounts, instance } = useMsal();
    const [appMode, setAppMode] = useState('Conversational Agent');
    const user = accounts[0] && accounts[0].name;

    const handleLogout = () => {
        instance.logoutRedirect({
            postLogoutRedirectUri: "/",
        });
    }

    return (
        <div className="flex h-screen bg-[#0E1117] text-white font-sans">
            <Sidebar appMode={appMode} setAppMode={setAppMode} />
            <main className="flex-1 overflow-y-auto">
                <header className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">BIAL Regulatory Assistant</h1>
                    <div className="text-right">
                        <p className="font-semibold">{user}</p>
                        <button onClick={handleLogout} className="text-sm text-[#00A99D] hover:underline">Logout</button>
                    </div>
                </header>
                <div className="p-4">
                    {appMode === 'Conversational Agent' && <ConversationalAgent />}
                    {appMode === 'MDA Reviewer' && <MDAReviewer />}
                </div>
            </main>
        </div>
    );
};

// --- Demo Mode Component (No MSAL) ---
const DemoApp = () => {
    const [appMode, setAppMode] = useState('Conversational Agent');
    const user = "Demo User";
    const [isLoggedIn, setIsLoggedIn] = useState(true);

    if (!isLoggedIn) {
        return (
             <div className="w-full h-screen flex items-center justify-center bg-[#0E1117] text-white">
                <div className="w-full max-w-md p-8 space-y-6 bg-[#1E1E1E] rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold text-center text-[#00A99D]">BIAL Regulatory Platform</h1>
                    <p className="text-center text-gray-400">Please log in to continue</p>
                    <button 
                        onClick={() => setIsLoggedIn(true)}
                        className="w-full px-4 py-2 text-lg font-semibold text-white bg-[#00A99D] rounded-md hover:bg-[#008080] transition-colors"
                    >
                        Login (Demo)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0E1117] text-white font-sans">
            <Sidebar appMode={appMode} setAppMode={setAppMode} />
            <main className="flex-1 overflow-y-auto">
                <header className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">BIAL Regulatory Assistant</h1>
                    <div className="text-right">
                        <p className="font-semibold">{user}</p>
                        <button onClick={() => setIsLoggedIn(false)} className="text-sm text-[#00A99D] hover:underline">Logout</button>
                    </div>
                </header>
                <div className="p-4">
                    {appMode === 'Conversational Agent' && <ConversationalAgent />}
                    {appMode === 'MDA Reviewer' && <MDAReviewer />}
                </div>
            </main>
        </div>
    );
}

// --- Main App Component ---
export default function App() {
  // --- DEMO MODE FLAG ---
  // Set this to 'true' to bypass Microsoft Entra ID login for local development and demos.
  // Set this to 'false' for production to enable real authentication.
  const IS_DEMO_MODE = true;

  if (IS_DEMO_MODE) {
    return <DemoApp />;
  }

  // This is the production-ready code with full MSAL authentication
  return (
    <MsalProvider instance={msalInstance}>
        <AuthenticatedTemplate>
            <MainContent />
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
            <LoginScreen />
        </UnauthenticatedTemplate>
    </MsalProvider>
  );
}
import { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import DocumentsScreen from "./components/DocumentsScreen";
import UploadScreen from "./components/UploadScreen";
import Workspace from "./components/Workspace";
import { authMe, authSignout, getUserDocuments } from "./lib/api";

export default function App() {
  const [screen, setScreen] = useState("loading"); // 'loading' | 'auth' | 'documents' | 'upload' | 'workspace'
  const [username, setUsername] = useState("");
  const [files, setFiles] = useState([]); // [{ name, url }]

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const email = localStorage.getItem("user_email");
    if (token && email) {
      authMe(token)
        .then((data) => {
          const resolvedEmail = data.email;
          setUsername(resolvedEmail);
          getUserDocuments(resolvedEmail)
            .then((docs) => setScreen(docs.length > 0 ? "documents" : "upload"))
            .catch(() => setScreen("upload"));
        })
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_email");
          setScreen("auth");
        });
    } else {
      setScreen("auth");
    }
  }, []);

  function handleAuth(email, accessToken) {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_email", email);
    setUsername(email);
    getUserDocuments(email)
      .then((docs) => setScreen(docs.length > 0 ? "documents" : "upload"))
      .catch(() => setScreen("upload"));
  }

  function handleUploadComplete(uploadedFiles) {
    setFiles(uploadedFiles);
    setScreen("workspace");
  }

  function handleAddFiles(newFiles) {
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function handleOpenDocuments(selectedDocs) {
    setFiles(selectedDocs.map((d) => ({ name: d.file_name, url: d.file_url })));
    setScreen("workspace");
  }

  async function handleLogout() {
    const token = localStorage.getItem("access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setUsername("");
    setFiles([]);
    setScreen("auth");
    if (token) {
      authSignout(token).catch(() => {});
    }
  }

  if (screen === "loading") return null;

  return (
    <div className="app">
      {screen === "auth" && <AuthScreen onAuth={handleAuth} />}
      {screen === "documents" && (
        <DocumentsScreen
          username={username}
          onOpen={handleOpenDocuments}
          onUploadNew={() => setScreen("upload")}
          onLogout={handleLogout}
        />
      )}
      {screen === "upload" && (
        <UploadScreen username={username} onComplete={handleUploadComplete} />
      )}
      {screen === "workspace" && (
        <Workspace
          username={username}
          files={files}
          onAddFiles={handleAddFiles}
          onLogout={handleLogout}
          onGoToDashboard={() => setScreen("documents")}
        />
      )}
    </div>
  );
}

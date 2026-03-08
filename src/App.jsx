import { useState } from "react";
import UsernameModal from "./components/UsernameModal";
import UploadScreen from "./components/UploadScreen";
import Workspace from "./components/Workspace";

export default function App() {
  const [screen, setScreen] = useState("username"); // 'username' | 'upload' | 'workspace'
  const [username, setUsername] = useState("");
  const [files, setFiles] = useState([]); // [{ name, url }]

  function handleUsername(name) {
    setUsername(name);
    setScreen("upload");
  }

  function handleUploadComplete(uploadedFiles) {
    setFiles(uploadedFiles);
    setScreen("workspace");
  }

  function handleAddFiles(newFiles) {
    setFiles((prev) => [...prev, ...newFiles]);
  }

  return (
    <div className="app">
      {screen === "username" && <UsernameModal onSubmit={handleUsername} />}
      {screen === "upload" && (
        <UploadScreen username={username} onComplete={handleUploadComplete} />
      )}
      {screen === "workspace" && (
        <Workspace
          username={username}
          files={files}
          onAddFiles={handleAddFiles}
        />
      )}
    </div>
  );
}

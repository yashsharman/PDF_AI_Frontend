import { useState, useRef } from "react";
import PDFViewer from "./PDFViewer";
import ChatInterface from "./ChatInterface";
import { API_BASE } from "../lib/api";

export default function Workspace({ username, files, onAddFiles }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [addError, setAddError] = useState("");
  // navTarget drives automatic PDF navigation after an AI response
  // Shape: { fileName: string, pageIndex: number, chunkText: string } | null
  const [navTarget, setNavTarget] = useState(null);
  const inputRef = useRef();

  // Keep activeIndex in bounds when files change
  const safeIndex = Math.min(activeIndex, Math.max(0, files.length - 1));

  // Called by ChatInterface when user clicks a source tag or an answer arrives
  function handleNavigate(fileName, pageIndex, chunkText) {
    // Switch to the correct file tab
    const fileIdx = files.findIndex(
      (f) => f.name.toLowerCase() === fileName.toLowerCase(),
    );
    if (fileIdx !== -1 && fileIdx !== safeIndex) {
      setActiveIndex(fileIdx);
    }
    setNavTarget({ fileName, pageIndex, chunkText });
  }

  async function handleAddMore(e) {
    const incoming = Array.from(e.target.files);
    e.target.value = "";
    if (!incoming.length) return;

    setAddError("");
    const formData = new FormData();
    formData.append("username", username);
    incoming.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch(`${API_BASE}/upload-files`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Upload failed");
      }
      const newFileData = incoming.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));
      onAddFiles(newFileData);
      setActiveIndex(files.length);
    } catch (err) {
      setAddError(err.message);
      setTimeout(() => setAddError(""), 4000);
    }
  }

  return (
    <div className="workspace">
      {/* ── Header ── */}
      <header className="workspace-header">
        <div className="workspace-brand">
          <span className="brand-name">
            PDF<span className="accent">GINI</span>
          </span>
          <span className="brand-sep" />
          <span className="brand-user">@{username}</span>
        </div>

        <div className="file-chips">
          {files.map((f, i) => (
            <button
              key={`${f.name}-${i}`}
              className={`file-chip${i === safeIndex ? " file-chip--active" : ""}`}
              onClick={() => setActiveIndex(i)}
              title={f.name}
            >
              {f.name.replace(/\.pdf$/i, "")}
            </button>
          ))}
        </div>

        <button
          className="add-pdf-btn"
          onClick={() => inputRef.current.click()}
          title="Upload more PDFs"
        >
          <svg
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add PDF
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={handleAddMore}
        />
      </header>

      {addError && (
        <div
          style={{
            padding: "8px 18px",
            background: "rgba(255,91,107,0.1)",
            borderBottom: "1px solid rgba(255,91,107,0.2)",
            color: "var(--danger)",
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          {addError}
        </div>
      )}

      {/* ── Split body ── */}
      <div className="workspace-body">
        <div className="workspace-panel workspace-panel--left">
          <PDFViewer
            files={files}
            activeIndex={safeIndex}
            onTabChange={setActiveIndex}
            navTarget={navTarget}
          />
        </div>

        <div className="workspace-divider" />

        <div className="workspace-panel workspace-panel--right">
          <ChatInterface
            username={username}
            activeFile={files[safeIndex]}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </div>
  );
}

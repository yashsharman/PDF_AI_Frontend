import { useState, useRef } from "react";
import { API_BASE } from "../lib/api";
import UploadProgressModal from "./UploadProgressModal";

export default function UploadScreen({ username, onComplete }) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progressStep, setProgressStep] = useState(null);
  const [skippedFiles, setSkippedFiles] = useState([]);
  const inputRef = useRef();

  function addFiles(incoming) {
    const pdfs = Array.from(incoming).filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !existing.has(f.name))];
    });
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e) {
    // Only clear if truly leaving the dropzone (not just a child element)
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  }

  async function handleUpload() {
    if (!files.length || uploading) return;
    setUploading(true);
    setProgressStep(0);
    setError("");
    setSkippedFiles([]);

    // Advance through steps on a timer; the API call may resolve and skip ahead
    const t1 = setTimeout(
      () => setProgressStep((s) => (s === 0 ? 1 : s)),
      3000,
    );
    const t2 = setTimeout(() => setProgressStep((s) => (s <= 1 ? 2 : s)), 7000);

    try {
      const formData = new FormData();
      formData.append("username", username);
      files.forEach((f) => formData.append("files", f));

      const res = await fetch(`${API_BASE}/upload-files`, {
        method: "POST",
        body: formData,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || `Upload failed (${res.status})`);
      }

      const uploadedFiles = (data.files || []).map((f) => ({
        name: f.file_name,
        url: f.file_url,
      }));
      const skipped = data.skipped_files || [];

      if (skipped.length > 0 && uploadedFiles.length === 0) {
        // All files were duplicates — stay on screen and warn
        setProgressStep(null);
        setUploading(false);
        setSkippedFiles(skipped);
        setFiles([]);
        return;
      }

      if (skipped.length > 0) {
        setSkippedFiles(skipped);
      }

      // Show the "Done!" step briefly before transitioning
      setProgressStep(3);
      setTimeout(() => {
        setProgressStep(null);
        setUploading(false);
        onComplete(uploadedFiles);
      }, 1500);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setProgressStep(null);
      setUploading(false);
      setError(err.message);
    }
  }

  const hasFiles = files.length > 0;
  const btnLabel = uploading
    ? null
    : hasFiles
      ? `Upload ${files.length} file${files.length > 1 ? "s" : ""} →`
      : "Upload files →";

  return (
    <>
      <div className="upload-screen">
        <div className="upload-screen-inner">
          <div className="upload-head">
            <span className="upload-brand">PDFGini</span>
            <h2 className="upload-title">Upload your documents</h2>
            <p className="upload-subtitle">
              Drop one or more PDF files below, then hit upload to begin.
            </p>
          </div>

          <div
            className={[
              "dropzone",
              dragging ? "dropzone--active" : "",
              hasFiles ? "dropzone--has-files" : "",
            ]
              .join(" ")
              .trim()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !hasFiles && inputRef.current.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && !hasFiles && inputRef.current.click()
            }
            aria-label="PDF drop zone"
          >
            {!hasFiles ? (
              <>
                <div className="dropzone-icon">
                  {/* Upload cloud icon */}
                  <svg
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="dropzone-text">Drag & drop PDFs here</p>
                <p className="dropzone-hint">or click to browse files</p>
              </>
            ) : (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className="file-item">
                    <span className="file-item-icon">
                      {/* PDF icon */}
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </span>
                    <span className="file-name">{f.name}</span>
                    <button
                      className="file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      aria-label={`Remove ${f.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="add-more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current.click();
                  }}
                >
                  + Add more files
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {skippedFiles.length > 0 && (
            <div className="upload-warn">
              <strong>Already uploaded (skipped):</strong>{" "}
              {skippedFiles.join(", ")}
            </div>
          )}

          {error && <div className="upload-error">{error}</div>}

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={!hasFiles || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner" />
                Uploading…
              </>
            ) : (
              btnLabel
            )}
          </button>
        </div>
      </div>
      {progressStep !== null && <UploadProgressModal step={progressStep} />}
    </>
  );
}

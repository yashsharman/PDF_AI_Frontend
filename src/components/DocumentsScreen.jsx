import { useState, useEffect } from "react";
import { getUserDocuments, deleteDocument } from "../lib/api";

export default function DocumentsScreen({
  username,
  onOpen,
  onUploadNew,
  onLogout,
}) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingFile, setDeletingFile] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  useEffect(() => {
    getUserDocuments(username)
      .then(setDocs)
      .catch((err) => setError(err.message || "Failed to load documents."))
      .finally(() => setLoading(false));
  }, [username]);

  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }

  function toggleSelect(fileName) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  }

  function handleOpenSelected() {
    const selectedDocs = docs.filter((d) => selectedFiles.has(d.file_name));
    if (selectedDocs.length > 0) onOpen(selectedDocs);
  }

  async function handleDelete(e, doc) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`))
      return;
    setDeletingFile(doc.file_name);
    setDeleteError("");
    try {
      await deleteDocument(username, doc.file_name);
      setDocs((prev) => prev.filter((d) => d.file_name !== doc.file_name));
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(doc.file_name);
        return next;
      });
    } catch (err) {
      setDeleteError(err.message || "Failed to delete document.");
      setTimeout(() => setDeleteError(""), 5000);
    } finally {
      setDeletingFile(null);
    }
  }

  return (
    <div className="docs-screen">
      {/* ── Header ── */}
      <header className="docs-header">
        <div className="workspace-brand">
          <span className="brand-name">
            PDF<span className="accent">GINI</span>
          </span>
          <span className="brand-sep" />
          <span className="brand-user">@{username}</span>
        </div>

        <div style={{ flex: 1 }} />

        {selectedFiles.size > 0 && (
          <button
            className="add-pdf-btn add-pdf-btn--accent"
            onClick={handleOpenSelected}
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
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
              />
            </svg>
            Open Selected ({selectedFiles.size})
          </button>
        )}

        <button className="add-pdf-btn" onClick={onUploadNew}>
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
          Upload New
        </button>

        <button
          className="add-pdf-btn"
          onClick={onLogout}
          style={{
            color: "var(--danger)",
            borderColor: "rgba(224,107,107,0.35)",
          }}
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
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          Sign Out
        </button>
      </header>

      {/* ── Body ── */}
      <div className="docs-body">
        <div className="docs-inner">
          <div className="docs-head">
            <span className="upload-brand">PDFGini</span>
            <h2 className="upload-title">Your Documents</h2>
            <p className="upload-subtitle">
              Click cards to select, then open them together to chat about all
              at once.
            </p>
          </div>

          {loading && (
            <div className="docs-loading">
              <div
                className="spinner"
                style={{
                  borderTopColor: "var(--accent)",
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                }}
              />
            </div>
          )}

          {error && <div className="upload-error">{error}</div>}

          {deleteError && <div className="upload-error">{deleteError}</div>}

          {!loading && !error && docs.length === 0 && (
            <div className="docs-empty">
              <p>No documents yet. Upload your first PDF to get started.</p>
              <button
                className="upload-btn"
                style={{ marginTop: 16, maxWidth: 220 }}
                onClick={onUploadNew}
              >
                Upload PDF →
              </button>
            </div>
          )}

          {!loading && docs.length > 0 && (
            <div className="docs-grid">
              {docs.map((doc, i) => {
                const isSelected = selectedFiles.has(doc.file_name);
                return (
                  <div
                    key={i}
                    className={`doc-card${isSelected ? " doc-card--selected" : ""}`}
                  >
                    {isSelected && (
                      <div className="doc-card-check" aria-hidden="true">
                        <svg
                          width="10"
                          height="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    )}
                    <button
                      className="doc-card-body"
                      onClick={() => toggleSelect(doc.file_name)}
                      title={
                        isSelected
                          ? `Deselect ${doc.file_name}`
                          : `Select ${doc.file_name}`
                      }
                    >
                      <div className="doc-card-icon">
                        <svg
                          width="22"
                          height="22"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </div>
                      <span className="doc-card-name">
                        {doc.file_name.replace(/\.pdf$/i, "")}
                      </span>
                      {doc.uploaded_at && (
                        <span className="doc-card-date">
                          {formatDate(doc.uploaded_at)}
                        </span>
                      )}
                      <span
                        className={`doc-card-open${
                          isSelected ? " doc-card-open--selected" : ""
                        }`}
                      >
                        {isSelected ? "✓ Selected" : "Select →"}
                      </span>
                    </button>
                    <button
                      className="doc-card-delete"
                      onClick={(e) => handleDelete(e, doc)}
                      disabled={deletingFile === doc.file_name}
                      title="Delete document"
                      aria-label={`Delete ${doc.file_name}`}
                    >
                      {deletingFile === doc.file_name ? (
                        <div
                          className="spinner"
                          style={{
                            width: 12,
                            height: 12,
                            borderWidth: 2,
                            borderTopColor: "var(--danger)",
                          }}
                        />
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

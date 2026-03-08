import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE } from "../lib/api";

export default function ChatInterface({ username, activeFile, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef();
  const textareaRef = useRef();

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  function handleInputChange(e) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const sendMessage = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg = { id: Date.now(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, query }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.answer,
          matches: data.matches ?? [],
        },
      ]);

      // Auto-navigate to the best (first) match
      const best = data.matches?.[0];
      if (best?.file_name != null && best?.page_index != null && onNavigate) {
        onNavigate(best.file_name, best.page_index, best.chunk_text ?? "");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: err.message || "Something went wrong. Please try again.",
          matches: [],
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, username, onNavigate]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-title">Ask about your documents</span>
        {activeFile && (
          <span className="chat-active-file" title={activeFile.name}>
            {activeFile.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
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
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <p>Ask anything about your PDFs</p>
            <p>I'll find answers and jump to the source page automatically.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message chat-message--${msg.role}`}
          >
            <div
              className={`message-content${msg.error ? " message-content--error" : ""}`}
            >
              {msg.content}
            </div>

            {msg.matches && msg.matches.length > 0 && (
              <div className="message-sources">
                {msg.matches.map((m, i) => (
                  <button
                    key={i}
                    className={`source-tag${i === 0 ? " source-tag--primary" : ""}`}
                    title={`Jump to ${m.file_name} — page ${m.page_label ?? m.page_index}`}
                    onClick={() =>
                      onNavigate?.(
                        m.file_name,
                        m.page_index,
                        m.chunk_text ?? "",
                      )
                    }
                  >
                    {/* {m.file_name} */}
                    {m.page_label != null ? `Page ${m.page_label}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-message chat-message--assistant">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        className="chat-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <textarea
          ref={textareaRef}
          className="chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
          disabled={loading}
          rows={1}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <svg
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Use jsDelivr CDN worker matching the exact installed version.
// Both 3.x ("pdf.worker.min.js") and 4.x ("pdf.worker.mjs") are handled here.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

// Convert PyPDFLoader 0-indexed page to pdf.js 1-indexed page
function toOneBased(pageIndex) {
  if (pageIndex == null) return 1;
  const n = parseInt(pageIndex, 10);
  return isNaN(n) ? 1 : n + 1;
}

// ── Apply keyword + substring highlights to a rendered text layer ──────────
function applyHighlights(textLayer, chunkText) {
  if (!textLayer || !chunkText) return;

  // Clear existing
  textLayer
    .querySelectorAll(".text-highlight, .text-highlight--primary")
    .forEach((el) => {
      el.classList.remove("text-highlight", "text-highlight--primary");
    });

  const spans = Array.from(textLayer.querySelectorAll("span")).filter(
    (s) => s.textContent.trim().length > 0,
  );
  if (!spans.length) return;

  // Build one concatenated string and track each span's char range
  let combined = "";
  const positions = spans.map((span) => {
    const start = combined.length;
    const text = span.textContent;
    combined += text;
    return { span, start, end: start + text.length };
  });

  // Strategy 1: find a 40-char anchor substring in the concatenated text
  const anchor = chunkText
    .trim()
    .replace(/\s+/g, " ")
    .substring(0, 60)
    .toLowerCase();
  const normCombined = combined.replace(/\s+/g, " ").toLowerCase();
  const matchIdx = normCombined.indexOf(anchor);

  if (matchIdx !== -1) {
    const matchEnd = matchIdx + Math.min(chunkText.length, 300);
    let first = null;
    positions.forEach(({ span, start, end }) => {
      if (end > matchIdx && start < matchEnd) {
        span.classList.add("text-highlight");
        if (!first) first = span;
      }
    });
    if (first) first.classList.add("text-highlight--primary");
    return;
  }

  // Strategy 2: keyword fallback (significant words > 4 chars)
  const keywords = [
    ...new Set(
      chunkText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 18),
    ),
  ];
  if (!keywords.length) return;

  let first = null;
  positions.forEach(({ span }) => {
    const t = span.textContent.toLowerCase();
    if (keywords.some((kw) => t.includes(kw))) {
      span.classList.add("text-highlight");
      if (!first) first = span;
    }
  });
  if (first) first.classList.add("text-highlight--primary");
}

// ── Render a single PDF page with lazy canvas + text layer ─────────────────
function PdfPage({ pdfDoc, pageNum, scale, isTarget, highlightText }) {
  const wrapperRef = useRef();
  const canvasRef = useRef();
  const textLayerRef = useRef();
  const [intersecting, setIntersecting] = useState(false);
  // renderSerial increments every time the text layer finishes rendering.
  // Using a counter (not a boolean) ensures the highlight effect always
  // re-fires even if the dep value goes true→true (e.g. scale changes).
  const [renderSerial, setRenderSerial] = useState(0);

  // Lazy visibility — also force-render target page immediately
  useEffect(() => {
    if (isTarget) {
      setIntersecting(true);
      return;
    }
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIntersecting(true);
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isTarget]);

  // Canvas + text layer render
  useEffect(() => {
    if (!intersecting || !pdfDoc) return;
    let cancelled = false;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (cancelled) return;

        // Text layer
        const tl = textLayerRef.current;
        if (!tl || cancelled) return;
        const textContent = await page.getTextContent();
        if (cancelled) return;

        tl.innerHTML = "";
        tl.style.width = `${Math.round(viewport.width)}px`;
        tl.style.height = `${Math.round(viewport.height)}px`;

        try {
          // pdfjs-dist ≥3.4 uses textContentSource; older uses textContent key
          const tlTask = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: tl,
            viewport,
            textDivs: [],
          });
          const promise =
            tlTask?.promise instanceof Promise ? tlTask.promise : null;
          if (promise) await promise;
        } catch {
          /* text layer optional — page still renders */
        }

        if (!cancelled) setRenderSerial((s) => s + 1);
      } catch (err) {
        if (!cancelled) console.warn(`Page ${pageNum} render error:`, err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [intersecting, pdfDoc, pageNum, scale]);

  // Apply highlights whenever the text layer finishes rendering (renderSerial
  // bumps) OR whenever the target / highlight text changes on an already-
  // rendered page.  renderSerial === 0 means the page hasn't rendered yet.
  useEffect(() => {
    if (renderSerial === 0) return;
    const tl = textLayerRef.current;
    applyHighlights(tl, isTarget ? highlightText : null);
    if (isTarget && highlightText) {
      const primary = tl?.querySelector(".text-highlight--primary");
      if (primary) {
        requestAnimationFrame(() =>
          primary.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
      }
    }
  }, [renderSerial, isTarget, highlightText]);

  // Placeholder size (A4 at current scale)
  const phW = Math.round(595 * scale);
  const phH = Math.round(842 * scale);

  return (
    <div
      ref={wrapperRef}
      className={`pdf-page-wrapper${isTarget ? " pdf-page-wrapper--target" : ""}`}
      data-page={pageNum}
    >
      <div
        className="pdf-page-inner"
        style={!intersecting ? { width: phW, height: phH } : undefined}
      >
        {intersecting ? (
          <>
            <canvas ref={canvasRef} />
            <div ref={textLayerRef} className="textLayer" />
          </>
        ) : (
          <div
            className="pdf-page-placeholder"
            style={{ width: phW, height: phH }}
          />
        )}
      </div>
      <span className="pdf-page-num">{pageNum}</span>
    </div>
  );
}

// ── Main PDFViewer ──────────────────────────────────────────────────────────
export default function PDFViewer({
  files,
  activeIndex,
  onTabChange,
  navTarget,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef();

  const activeFile = files[activeIndex] ?? files[0];

  // Load PDF when file switches
  useEffect(() => {
    if (!activeFile) return;
    let task;
    let cancelled = false;

    setLoading(true);
    setLoadError("");
    setPdfDoc(null);
    setNumPages(0);

    task = pdfjsLib.getDocument(activeFile.url);
    task.promise
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      task?.destroy?.();
    };
  }, [activeFile?.url]);

  // Scroll to target page after PDF loads or navTarget changes
  useEffect(() => {
    if (!navTarget || !pdfDoc || !scrollerRef.current) return;

    const targetPageNum = toOneBased(navTarget.pageIndex);

    // Small delay so wrappers are in DOM before scrolling
    const timer = setTimeout(() => {
      const el = scrollerRef.current?.querySelector(
        `[data-page="${targetPageNum}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);

    return () => clearTimeout(timer);
  }, [navTarget, pdfDoc]);

  // Derive which page/text to highlight
  const isCurrentFileTarget =
    navTarget &&
    activeFile &&
    navTarget.fileName.toLowerCase() === activeFile.name.toLowerCase();
  const targetPageNum = isCurrentFileTarget
    ? toOneBased(navTarget.pageIndex)
    : null;

  if (!files.length) {
    return (
      <div className="pdf-viewer">
        <div className="pdf-empty">
          <svg
            width="36"
            height="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p>No PDFs loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {/* File tab bar */}
      {files.length > 1 && (
        <div className="pdf-tabs">
          {files.map((f, i) => (
            <button
              key={`${f.name}-${i}`}
              className={`pdf-tab${i === activeIndex ? " pdf-tab--active" : ""}`}
              onClick={() => onTabChange(i)}
              title={f.name}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="pdf-toolbar">
        <button
          className="pdf-zoom-btn"
          onClick={() => setScale((s) => Math.max(0.5, +(s - 0.2).toFixed(1)))}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="pdf-zoom-label">{Math.round(scale * 100)}%</span>
        <button
          className="pdf-zoom-btn"
          onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>

        {numPages > 0 && (
          <span className="pdf-page-count">{numPages} pages</span>
        )}

        {/* Navigate-back badge */}
        {isCurrentFileTarget && targetPageNum && (
          <button
            className="pdf-nav-badge"
            onClick={() => {
              const el = scrollerRef.current?.querySelector(
                `[data-page="${targetPageNum}"]`,
              );
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            title={`Jump to highlighted page ${targetPageNum}`}
          >
            Page {targetPageNum}
          </button>
        )}
      </div>

      {/* Pages */}
      <div ref={scrollerRef} className="pdf-scroll">
        {loading && (
          <div className="pdf-loading">
            <span className="spinner" />
            <span>Loading PDF…</span>
          </div>
        )}
        {loadError && <div className="pdf-load-error">{loadError}</div>}
        {!loading &&
          !loadError &&
          pdfDoc &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <PdfPage
              key={`${activeFile.url}-p${pageNum}`}
              pdfDoc={pdfDoc}
              pageNum={pageNum}
              scale={scale}
              isTarget={pageNum === targetPageNum}
              highlightText={
                pageNum === targetPageNum ? navTarget.chunkText : null
              }
            />
          ))}
      </div>
    </div>
  );
}

const STEPS = [
  "Uploading your files!!!",
  "Reading your files!!",
  "Almost ready!!",
  "Done! Let's goooo!!!",
];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopIcon({ done }) {
  if (done) {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

export default function UploadProgressModal({ step }) {
  const isDone = step === STEPS.length - 1;

  return (
    <div className="modal-overlay upm-overlay">
      <div className="modal-card upm-card">
        <div className={`upm-icon${isDone ? " upm-icon--done" : ""}`}>
          <TopIcon done={isDone} />
        </div>

        <h2 key={step} className="upm-title">
          {STEPS[step]}
        </h2>

        <div className="upm-steps">
          {STEPS.map((label, i) => {
            const isLast = i === STEPS.length - 1;
            const stateClass =
              i < step
                ? "upm-step--done"
                : i === step
                  ? "upm-step--active"
                  : "upm-step--pending";

            // Last step when active: show checkmark, not spinner
            const showCheck = i < step || (i === step && isLast);
            const showSpinner = i === step && !isLast;

            return (
              <div key={i} className={`upm-step ${stateClass}`}>
                <div className="upm-step-ind">
                  {showCheck ? (
                    <CheckIcon />
                  ) : showSpinner ? (
                    <div className="upm-step-spinner" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="upm-step-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

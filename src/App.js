import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an expert meeting analyst. When given a meeting transcript, extract and return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "title": "Short meeting title inferred from content",
  "duration_estimate": "e.g. ~45 min",
  "summary": "2-3 sentence executive summary of what happened",
  "key_decisions": ["decision 1", "decision 2"],
  "action_items": [
    { "task": "task description", "owner": "Person Name or 'Team'", "due": "timeframe or 'TBD'" }
  ],
  "highlights": ["notable quote or moment 1", "notable quote or moment 2"],
  "sentiment": "positive | neutral | tense | mixed"
}`;

const sentimentColors = {
  positive: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  neutral: { bg: "#e0f2fe", text: "#0c4a6e", dot: "#0ea5e9" },
  tense: { bg: "#fee2e2", text: "#7f1d1d", dot: "#ef4444" },
  mixed: { bg: "#fef3c7", text: "#78350f", dot: "#f59e0b" },
};

const SAMPLE_TRANSCRIPT = `Sarah: Alright everyone, let's get started. Today we need to finalize the Q2 roadmap and talk about the budget situation.

Marcus: Before we dive in, I want to flag that the engineering team is already stretched thin. We shipped three features last week.

Sarah: Noted. Let's prioritize. The board wants the analytics dashboard by end of April. That's non-negotiable.

Priya: I can own the dashboard. I'll need two engineers and the design specs from Jordan by Friday.

Jordan: I can get the specs done by Thursday actually. I've already started some mockups.

Marcus: Okay, I can assign Alex and Demi to that. But that means we have to push the mobile notifications feature to May.

Sarah: Agreed. Let's make that call officially — mobile notifications moves to May 15th.

Marcus: Also, we're over budget on cloud infrastructure by about 12%. I've been talking to DevOps and we think we can cut costs by optimizing our database queries.

Sarah: Good. Marcus, can you put together a cost reduction plan by next Wednesday?

Marcus: Will do.

Priya: One more thing — the user research sessions are scheduled for next Tuesday. I'll need someone from product to join.

Sarah: I'll be there. Jordan, can you join too?

Jordan: Yes, I'll block my calendar.

Sarah: Perfect. Let's wrap up. Dashboard is top priority, mobile notifications pushed to May, Marcus on budget plan, and user research Tuesday.`;

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [charCount, setCharCount] = useState(0);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value);
    setCharCount(e.target.value.length);
  };

  const loadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setCharCount(SAMPLE_TRANSCRIPT.length);
    setResult(null);
    setError("");
  };

  const summarize = async () => {
    if (!transcript.trim()) {
      setError("Please paste a meeting transcript first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analyze this meeting transcript:\n\n${transcript}` }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab("summary");
    } catch (err) {
      setError("Something went wrong. Make sure the transcript is readable and try again.");
    } finally {
      setLoading(false);
    }
  };

  const sentiment = result ? sentimentColors[result.sentiment] || sentimentColors.neutral : null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0f0f11", color: "#f0ede8" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #f0c040; color: #0f0f11; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        .glow-orb {
          position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
        }

        .container { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 60px 24px 100px; }

        .header { margin-bottom: 52px; }
        .eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #f0c040; margin-bottom: 16px; }
        .title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 6vw, 58px); font-weight: 700; line-height: 1.1; color: #f0ede8; }
        .title span { color: #f0c040; }
        .subtitle { margin-top: 14px; font-size: 16px; color: #8a8580; font-weight: 300; line-height: 1.6; }

        .input-card {
          background: #18181c; border: 1px solid #2a2a30; border-radius: 16px; overflow: hidden;
          transition: border-color 0.2s;
        }
        .input-card:focus-within { border-color: #f0c040; }

        .card-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid #2a2a30; background: #141416;
        }
        .card-label { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #5a5850; }
        .char-count { font-size: 12px; color: #3a3830; font-variant-numeric: tabular-nums; }

        textarea {
          width: 100%; min-height: 220px; background: transparent; border: none; outline: none;
          padding: 20px; font-size: 14px; color: #c8c4be; line-height: 1.7; resize: vertical;
          font-family: 'DM Sans', sans-serif;
        }
        textarea::placeholder { color: #3a3830; }

        .actions { display: flex; gap: 12px; margin-top: 16px; align-items: center; }

        .btn-primary {
          flex: 1; padding: 15px 32px; background: #f0c040; color: #0f0f11;
          border: none; border-radius: 10px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary:hover:not(:disabled) { background: #f5d060; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,192,64,0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-ghost {
          padding: 15px 20px; background: transparent; color: #6a6860;
          border: 1px solid #2a2a30; border-radius: 10px; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost:hover { border-color: #4a4840; color: #a0a09a; }

        .error { margin-top: 12px; padding: 12px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; font-size: 13px; color: #fca5a5; }

        .loader { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 60px; }
        .spinner { width: 36px; height: 36px; border: 2px solid #2a2a30; border-top-color: #f0c040; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-text { font-size: 13px; color: #5a5850; letter-spacing: 0.05em; }

        .result-card { margin-top: 40px; background: #18181c; border: 1px solid #2a2a30; border-radius: 16px; overflow: hidden; animation: fadeUp 0.4s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .result-header { padding: 24px 28px; border-bottom: 1px solid #2a2a30; }
        .result-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #f0ede8; margin-bottom: 10px; }
        .result-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; }
        .badge-neutral { background: #1e1e24; color: #6a6860; }

        .tabs { display: flex; border-bottom: 1px solid #2a2a30; padding: 0 28px; }
        .tab {
          padding: 14px 0; margin-right: 28px; font-size: 13px; font-weight: 500; cursor: pointer;
          color: #5a5850; border-bottom: 2px solid transparent; transition: all 0.15s; letter-spacing: 0.04em;
          background: none; border-left: none; border-right: none; border-top: none; font-family: 'DM Sans', sans-serif;
        }
        .tab:hover { color: #a0a09a; }
        .tab.active { color: #f0c040; border-bottom-color: #f0c040; }

        .tab-content { padding: 28px; }

        .summary-text { font-size: 15px; color: #b0aca6; line-height: 1.8; font-weight: 300; }

        .section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #4a4840; margin-bottom: 14px; margin-top: 28px; }
        .section-title:first-child { margin-top: 0; }

        .decision-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .decision-item {
          padding: 12px 16px; background: #1e1e24; border-radius: 8px; border-left: 3px solid #f0c040;
          font-size: 14px; color: #c8c4be; line-height: 1.5;
        }

        .action-table { width: 100%; border-collapse: collapse; }
        .action-table th { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a4840; padding: 0 12px 10px 0; text-align: left; }
        .action-table td { padding: 10px 12px 10px 0; font-size: 14px; color: #c8c4be; border-top: 1px solid #222228; vertical-align: top; }
        .owner-badge { display: inline-block; padding: 2px 8px; background: #2a2a34; border-radius: 4px; font-size: 12px; color: #8a8890; }
        .due-badge { font-size: 12px; color: #6a6870; }

        .highlight-list { display: flex; flex-direction: column; gap: 10px; }
        .highlight-item {
          padding: 14px 18px; background: #1a1a1e; border-radius: 8px;
          font-size: 14px; color: #a0a09a; line-height: 1.6; font-style: italic;
          border: 1px solid #242428;
          position: relative; padding-left: 28px;
        }
        .highlight-item::before { content: '"'; position: absolute; left: 12px; top: 12px; font-size: 20px; color: #f0c040; font-family: 'Playfair Display', serif; line-height: 1; }

        @media (max-width: 600px) {
          .actions { flex-direction: column; }
          .result-meta { gap: 8px; }
          .action-table th:last-child, .action-table td:last-child { display: none; }
        }
      `}</style>

      <div className="grain" />
      <div className="glow-orb" style={{ width: 500, height: 500, top: -200, right: -150, background: "radial-gradient(circle, rgba(240,192,64,0.06) 0%, transparent 70%)" }} />
      <div className="glow-orb" style={{ width: 400, height: 400, bottom: 100, left: -100, background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />

      <div className="container">
        <div className="header">
          <div className="eyebrow">AI-Powered · Claude API</div>
          <h1 className="title">Meeting<br /><span>Summarizer</span></h1>
          <p className="subtitle">Paste any meeting transcript. Get instant summaries,<br />action items, and decisions — ready to share.</p>
        </div>

        <div className="input-card">
          <div className="card-header">
            <span className="card-label">Transcript</span>
            <span className="char-count">{charCount.toLocaleString()} chars</span>
          </div>
          <textarea
            value={transcript}
            onChange={handleTranscriptChange}
            placeholder="Paste your meeting transcript here...&#10;&#10;e.g. Sarah: Let's review the Q2 roadmap...&#10;     Marcus: I think we should prioritize..."
          />
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={summarize} disabled={loading}>
            {loading ? "Analyzing…" : "✦ Summarize Meeting"}
          </button>
          <button className="btn-ghost" onClick={loadSample}>Load sample</button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="result-card">
            <div className="loader">
              <div className="spinner" />
              <span className="loader-text">Reading transcript · extracting insights…</span>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="result-card" ref={resultRef}>
            <div className="result-header">
              <div className="result-title">{result.title}</div>
              <div className="result-meta">
                {result.duration_estimate && (
                  <span className="badge badge-neutral">⏱ {result.duration_estimate}</span>
                )}
                {result.sentiment && sentiment && (
                  <span className="badge" style={{ background: `${sentiment.bg}22`, color: sentiment.text }}>
                    <span className="badge-dot" style={{ background: sentiment.dot }} />
                    {result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)} tone
                  </span>
                )}
                <span className="badge badge-neutral">
                  {result.action_items?.length || 0} action items
                </span>
              </div>
            </div>

            <div className="tabs">
              {["summary", "actions", "decisions", "highlights"].map((tab) => (
                <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === "summary" && (
                <p className="summary-text">{result.summary}</p>
              )}

              {activeTab === "actions" && (
                result.action_items?.length > 0 ? (
                  <table className="action-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Owner</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.action_items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.task}</td>
                          <td><span className="owner-badge">{item.owner}</span></td>
                          <td><span className="due-badge">{item.due}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="summary-text">No action items detected.</p>
              )}

              {activeTab === "decisions" && (
                result.key_decisions?.length > 0 ? (
                  <ul className="decision-list">
                    {result.key_decisions.map((d, i) => (
                      <li key={i} className="decision-item">{d}</li>
                    ))}
                  </ul>
                ) : <p className="summary-text">No key decisions detected.</p>
              )}

              {activeTab === "highlights" && (
                result.highlights?.length > 0 ? (
                  <div className="highlight-list">
                    {result.highlights.map((h, i) => (
                      <div key={i} className="highlight-item">{h}</div>
                    ))}
                  </div>
                ) : <p className="summary-text">No notable highlights detected.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
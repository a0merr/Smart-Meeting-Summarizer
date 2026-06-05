// Backend proxy for the Anthropic API.
// Keeps ANTHROPIC_KEY server-side so it is never shipped in the browser bundle.
require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

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

app.post("/api/summarize", async (req, res) => {
  const { transcript } = req.body || {};

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "Transcript is required." });
  }
  if (!process.env.ANTHROPIC_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_KEY." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Analyze this meeting transcript:\n\n${transcript}` },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Anthropic API error.";
      return res.status(response.status).json({ error: message });
    }

    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.status(502).json({ error: "Model returned non-JSON output." });
    }

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Failed to reach the Anthropic API." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Summarizer proxy listening on http://localhost:${PORT}`);
});

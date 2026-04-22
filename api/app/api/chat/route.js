import { NextResponse } from "next/server";
import { handleToolCall } from "./data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are Voiro AI — the Intelligence Agent for Voiro's revenue operations platform.
You help revenue teams at digital publishers understand their performance, spot risks, and make better decisions.

YOUR STYLE:
- Lead with the answer, then the detail.
- Add context to every number — don't just return raw data.
- Flag anomalies proactively even if not asked.
- Use INR rupee symbol for currency. Use Indian number formatting.
- Be concise. Revenue teams are busy.

YOUR RULES:
- You are READ ONLY. Never modify, create or delete data.
- If asked to take an action, explain that is the Operations Agent's job.
- Never invent numbers.

AVAILABLE PUBLISHERS: Times of India, Hindustan Times, NDTV
AVAILABLE DATA: Monthly revenue, impressions, CPM, fill rates (Jan-Apr 2024), campaigns, inventory`;

const TOOLS = [
  {
    name: "get_revenue_summary",
    description: "Get revenue, impressions, CPM and fill rate for a publisher. Use when someone asks about earnings or financial performance. Filter by month (jan/feb/mar/apr) or omit for all months.",
    parameters: {
      type: "OBJECT",
      properties: {
        publisher: { type: "STRING", description: "Publisher name e.g. Times of India" },
        month:     { type: "STRING", description: "jan, feb, mar, or apr. Omit for all months." },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_underdelivering_campaigns",
    description: "Get active campaigns delivering below a threshold percentage. Default threshold is 70%.",
    parameters: {
      type: "OBJECT",
      properties: {
        threshold: { type: "NUMBER", description: "Delivery % threshold. Default 70." },
      },
      required: [],
    },
  },
  {
    name: "get_publisher_performance",
    description: "Get full performance breakdown for a publisher — revenue, fill rates, inventory, campaigns.",
    parameters: {
      type: "OBJECT",
      properties: {
        publisher: { type: "STRING", description: "Publisher name" },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_inventory_status",
    description: "Get inventory availability and sell-through rates. Omit publisher for all publishers.",
    parameters: {
      type: "OBJECT",
      properties: {
        publisher: { type: "STRING", description: "Optional publisher name. Omit for all." },
      },
      required: [],
    },
  },
  {
    name: "get_all_publishers",
    description: "Get summary of all publishers with YTD revenue and average CPM.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
];

// Convert our simple message history to Gemini format
function buildGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
}

async function runAgentLoop(messages) {
  let contents = buildGeminiContents(messages);

  for (let i = 0; i < 5; i++) {
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      tools: [{ function_declarations: TOOLS }],
      tool_config: { function_calling_config: { mode: "AUTO" } },
    };

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error: ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check if Gemini wants to call a function
    const functionCall = parts.find(p => p.functionCall);

    if (functionCall) {
      const { name, args } = functionCall.functionCall;
      const result = handleToolCall(name, args || {});

      // Add model response and tool result to contents
      contents.push({ role: "model", parts });
      contents.push({
        role: "user",
        parts: [{
          functionResponse: {
            name,
            response: { content: result }
          }
        }]
      });
      continue;
    }

    // No function call — return the text response
    const textPart = parts.find(p => p.text);
    if (textPart) return textPart.text;

    break;
  }

  return "Could not complete the request. Please try again.";
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }
    const reply = await runAgentLoop(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

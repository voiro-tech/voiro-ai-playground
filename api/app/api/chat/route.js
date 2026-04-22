import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { handleToolCall } from "./data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Publisher name e.g. Times of India" },
        month: { type: "string", description: "jan, feb, mar, or apr. Omit for all months." },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_underdelivering_campaigns",
    description: "Get active campaigns delivering below a threshold percentage. Default threshold is 70%.",
    input_schema: {
      type: "object",
      properties: {
        threshold: { type: "number", description: "Delivery % threshold. Default 70." },
      },
      required: [],
    },
  },
  {
    name: "get_publisher_performance",
    description: "Get full performance breakdown for a publisher — revenue, fill rates, inventory, campaigns.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Publisher name" },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_inventory_status",
    description: "Get inventory availability and sell-through rates. Omit publisher for all publishers.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Optional publisher name. Omit for all." },
      },
      required: [],
    },
  },
  {
    name: "get_all_publishers",
    description: "Get summary of all publishers with YTD revenue and average CPM.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

async function runAgentLoop(messages) {
  let currentMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      const text = response.content.find(b => b.type === "text");
      return text ? text.text : "No response generated.";
    }

    if (response.stop_reason === "tool_use") {
      currentMessages.push({ role: "assistant", content: response.content });
      const toolResults = response.content
        .filter(b => b.type === "tool_use")
        .map(toolUse => ({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: handleToolCall(toolUse.name, toolUse.input),
        }));
      currentMessages.push({ role: "user", content: toolResults });
      continue;
    }
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

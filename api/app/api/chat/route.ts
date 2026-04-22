import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { handleToolCall } from "./data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Voiro AI — the Intelligence Agent for Voiro's revenue operations platform.
You help revenue teams at digital publishers understand their performance, spot risks, and make better decisions.

YOUR CAPABILITIES:
- Revenue queries: answer questions about revenue, CPM, impressions, fill rates for any publisher
- Campaign monitoring: identify underdelivering or at-risk campaigns
- Publisher performance: full breakdown of how a publisher is performing
- Inventory intelligence: availability, sell-through rates, capacity

YOUR STYLE:
- Lead with the answer, then the detail. Never bury the headline.
- Add context to every number — don't just return raw data.
- Flag anomalies proactively even if not asked.
- When comparing periods, surface the trend not just the number.
- Use ₹ for currency. Use Indian number formatting (₹4,50,000 not 450000).
- Be concise. Revenue teams are busy.

YOUR RULES:
- You are READ ONLY. Never modify, create or delete data.
- If asked to take an action (pause campaign, change budget), explain that is the Operations Agent's job.
- If you don't have data for something, say so clearly. Never invent numbers.

AVAILABLE PUBLISHERS: Times of India, Hindustan Times, NDTV
AVAILABLE DATA: Monthly revenue, impressions, CPM, fill rates (Jan–Apr 2024), campaigns, inventory`;

// ─────────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_revenue_summary",
    description: `Get revenue, impressions, CPM and fill rate for a publisher.
    Use when someone asks about earnings, revenue, or financial performance.
    Filter by month (jan/feb/mar/apr) or omit for all months.`,
    input_schema: {
      type: "object" as const,
      properties: {
        publisher: { type: "string", description: "Publisher name e.g. Times of India" },
        month:     { type: "string", description: "jan, feb, mar, or apr. Omit for all months." },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_underdelivering_campaigns",
    description: `Get active campaigns delivering below a threshold percentage.
    Use when someone asks about underdelivering, at-risk, or struggling campaigns.
    Default threshold is 70%.`,
    input_schema: {
      type: "object" as const,
      properties: {
        threshold: { type: "number", description: "Delivery % threshold. Default 70. Returns campaigns below this." },
      },
      required: [],
    },
  },
  {
    name: "get_publisher_performance",
    description: `Get a full performance breakdown for a publisher — revenue trends, fill rates, segments, inventory, all campaigns.
    Use for broad questions about how a publisher is doing overall.`,
    input_schema: {
      type: "object" as const,
      properties: {
        publisher: { type: "string", description: "Publisher name" },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_inventory_status",
    description: `Get inventory availability, sell-through rates and capacity.
    Use when someone asks about available inventory, unsold slots, or sell-through.
    Omit publisher to get all publishers.`,
    input_schema: {
      type: "object" as const,
      properties: {
        publisher: { type: "string", description: "Optional publisher name. Omit for all." },
      },
      required: [],
    },
  },
  {
    name: "get_all_publishers",
    description: `Get a summary of all publishers with YTD revenue and average CPM.
    Use when someone wants to compare publishers or get an overview of all publishers.`,
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ─────────────────────────────────────────────
// AGENTIC LOOP
// ─────────────────────────────────────────────
async function runAgentLoop(messages: Anthropic.MessageParam[]): Promise<string> {
  let currentMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      tools:      TOOLS,
      messages:   currentMessages,
    });

    // Done — return text response
    if (response.stop_reason === "end_turn") {
      const text = response.content.find((b) => b.type === "text");
      return text ? (text as Anthropic.TextBlock).text : "No response generated.";
    }

    // Tool call — execute and loop
    if (response.stop_reason === "tool_use") {
      currentMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map((toolUse) => ({
          type:        "tool_result" as const,
          tool_use_id: toolUse.id,
          content:     handleToolCall(toolUse.name, toolUse.input as Record<string, any>),
        }));

      currentMessages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return "Could not complete the request. Please try again.";
}

// ─────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const reply = await runAgentLoop(messages as Anthropic.MessageParam[]);
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

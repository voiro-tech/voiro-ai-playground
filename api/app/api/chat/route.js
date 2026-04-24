import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { handleToolCall } from "./data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Voiro AI — the Intelligence Agent for a premium OTT and streaming platform's revenue operations team.
You help revenue teams understand performance, detect drift, make better decisions, and manage their Voiro AI usage and billing.

YOUR STYLE:
- Lead with the answer, then the detail. Never bury the headline.
- Add context to every number — don't just return raw data.
- When there are drift alerts, always lead with the most severe and quantify revenue at risk.
- Flag anomalies proactively even if not asked.
- Use ₹ for currency with Indian formatting (₹18,20,000 not 18200000).
- Be concise. Revenue teams are busy.

BILLING STYLE:
- When showing credit balance, always include how many days remaining at current usage rate.
- When recommending a pack, explain why in one sentence.
- Always show cost in ₹ and credits side by side.
- If balance is low (under 200 credits) proactively flag it.

YOUR RULES:
- You are READ ONLY for revenue data. Never modify campaign or inventory data.
- If asked to take an action on revenue data, explain that is the Operations Agent's job.
- Never invent numbers.

AVAILABLE INVENTORY: Premium OTT, Sports Inventory, Connected TV
AVAILABLE DATA: Revenue Jan-Apr 2024, campaigns, inventory, drift alerts, benchmarks, billing and credits`;

const TOOLS = [
  {
    name: "get_revenue_summary",
    description: "Get revenue, impressions, CPM and fill rate for a publisher. Filter by month (jan/feb/mar/apr) or omit for all months.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Publisher name e.g. Premium OTT" },
        month:     { type: "string", description: "jan, feb, mar, or apr. Omit for all." },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_underdelivering_campaigns",
    description: "Get active campaigns delivering below a threshold percentage. Default 70%.",
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
    description: "Get full performance breakdown for a publisher — revenue, fill rates, inventory, campaigns, drift alerts.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string" },
      },
      required: ["publisher"],
    },
  },
  {
    name: "get_inventory_status",
    description: "Get inventory availability and sell-through rates. Omit publisher for all.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Optional. Omit for all publishers." },
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
  {
    name: "get_drift_alerts",
    description: "Get active Revenue Drift alerts — fill rate, eCPM, or delivery pace deviations. Filter by severity (HIGH/MEDIUM) or omit for all.",
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", description: "Optional: HIGH or MEDIUM." },
      },
      required: [],
    },
  },
  {
    name: "get_benchmarks",
    description: "Get industry benchmark comparison for a publisher. How their fill rate and CPM compares to industry average and top quartile.",
    input_schema: {
      type: "object",
      properties: {
        publisher: { type: "string", description: "Optional publisher name." },
      },
      required: [],
    },
  },
  {
    name: "get_credit_balance",
    description: "Get current credit balance, usage this month, and estimated days remaining. Use when someone asks about their balance, credits, or how much they have left.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_usage_breakdown",
    description: "Get detailed breakdown of credit usage by action type for a period. Use when someone asks about their usage, what they spent credits on, or how many queries they made.",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", description: "Period in YYYY-MM format e.g. 2024-04. Defaults to current month." },
      },
      required: [],
    },
  },
  {
    name: "get_billing_history",
    description: "Get past credit purchases and monthly usage history. Use when someone asks about past bills, purchase history, or how much they have spent.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_credit_packs",
    description: "Get available credit packs with pricing and what each pack includes. Use when someone asks about pricing, plans, or wants to buy credits.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "calculate_credits_needed",
    description: "Calculate how many credits a user needs per month based on their expected usage and recommend the right pack. Use when someone asks which plan to choose or wants to estimate costs.",
    input_schema: {
      type: "object",
      properties: {
        queries_per_month:     { type: "number", description: "Expected intelligence queries per month" },
        operations_per_month:  { type: "number", description: "Expected operations actions per month. Default 0." },
        alerts_per_month:      { type: "number", description: "Expected drift alerts per month. Default 0." },
      },
      required: ["queries_per_month"],
    },
  },
];

async function runAgentLoop(messages) {
  let currentMessages = [...messages];

  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      tools:      TOOLS,
      messages:   currentMessages,
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
          type:        "tool_result",
          tool_use_id: toolUse.id,
          content:     handleToolCall(toolUse.name, toolUse.input),
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

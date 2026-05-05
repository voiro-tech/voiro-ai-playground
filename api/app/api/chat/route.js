import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { handleToolCall } from "./data";
import { jwtVerify } from "jose";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "voiro-ai-secret-change-this-in-production"
);

// ─────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE — verify token before processing any request
// ─────────────────────────────────────────────────────────────
async function verifyAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are Voiro AI — the Intelligence Agent for a premium OTT and streaming platform's revenue operations team.
You help revenue teams understand performance, detect drift, and make better decisions.

YOUR STYLE:
- Lead with the answer, then the detail. Never bury the headline.
- Add context to every number — don't just return raw data.
- When there are drift alerts, always lead with the most severe and quantify revenue at risk.
- Flag anomalies proactively even if not asked.
- Use INR rupee symbol for currency with Indian formatting.
- Be concise. Revenue teams are busy.

BILLING STYLE:
- When showing credit balance, always include days remaining at current usage rate.
- When recommending a pack, explain why in one sentence.
- If balance is low (under 200 credits) proactively flag it.

YOUR RULES:
- You are READ ONLY for revenue data. Never modify campaign or inventory data.
- If asked to take an action, explain that is the Operations Agent's job.
- Never invent numbers.

AVAILABLE INVENTORY: Premium OTT, Sports Inventory, Connected TV
AVAILABLE DATA: Revenue Jan-Apr 2024, campaigns, inventory, drift alerts, benchmarks, billing and credits`;

const TOOLS = [
  {
    name: "get_revenue_summary",
    description: "Get revenue, impressions, CPM and fill rate for a publisher. Filter by month (jan/feb/mar/apr) or omit for all months.",
    input_schema: { type: "object", properties: { publisher: { type: "string" }, month: { type: "string" } }, required: ["publisher"] },
  },
  {
    name: "get_underdelivering_campaigns",
    description: "Get active campaigns delivering below a threshold percentage. Default 70%.",
    input_schema: { type: "object", properties: { threshold: { type: "number" } }, required: [] },
  },
  {
    name: "get_publisher_performance",
    description: "Get full performance breakdown for a publisher — revenue, fill rates, inventory, campaigns, drift alerts.",
    input_schema: { type: "object", properties: { publisher: { type: "string" } }, required: ["publisher"] },
  },
  {
    name: "get_inventory_status",
    description: "Get inventory availability and sell-through rates. Omit publisher for all.",
    input_schema: { type: "object", properties: { publisher: { type: "string" } }, required: [] },
  },
  {
    name: "get_all_publishers",
    description: "Get summary of all publishers with YTD revenue and average CPM.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_drift_alerts",
    description: "Get active Revenue Drift alerts. Filter by severity (HIGH/MEDIUM) or omit for all.",
    input_schema: { type: "object", properties: { severity: { type: "string" } }, required: [] },
  },
  {
    name: "get_benchmarks",
    description: "Get industry benchmark comparison for a publisher.",
    input_schema: { type: "object", properties: { publisher: { type: "string" } }, required: [] },
  },
  {
    name: "get_credit_balance",
    description: "Get current credit balance, usage this month, and estimated days remaining.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_usage_breakdown",
    description: "Get detailed breakdown of credit usage by action type for a period.",
    input_schema: { type: "object", properties: { period: { type: "string" } }, required: [] },
  },
  {
    name: "get_billing_history",
    description: "Get past credit purchases and monthly usage history.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_credit_packs",
    description: "Get available credit packs with pricing.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "calculate_credits_needed",
    description: "Calculate how many credits a user needs per month and recommend the right pack.",
    input_schema: { type: "object", properties: { queries_per_month: { type: "number" }, operations_per_month: { type: "number" }, alerts_per_month: { type: "number" } }, required: ["queries_per_month"] },
  },
];

async function runAgentLoop(messages) {
  let currentMessages = [...messages];
  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
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
  // ── Auth check ──
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorised. Please log in." },
      { status: 401 }
    );
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }
    const reply = await runAgentLoop(messages);
    return NextResponse.json({ reply, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
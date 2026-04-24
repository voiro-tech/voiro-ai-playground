// ─────────────────────────────────────────────────────────────
// DUMMY DATA — swap handlers for real API calls when going live
// ─────────────────────────────────────────────────────────────

const DUMMY_DATA = {
  publishers: {
    premium_ott: {
      name: "Premium OTT",
      revenue:     { jan: 8500000, feb: 9200000, mar: 8800000, apr: 7100000 },
      impressions: { jan: 45000000, feb: 48000000, mar: 46000000, apr: 38000000 },
      cpm:         { jan: 188.9, feb: 191.7, mar: 191.3, apr: 186.8 },
      fill_rate:   { jan: 87, feb: 91, mar: 85, apr: 74 },
      top_segments: ["Live Sports", "Premium Drama", "Reality Shows"],
    },
    sports_inventory: {
      name: "Sports Inventory",
      revenue:     { jan: 12000000, feb: 11500000, mar: 15800000, apr: 18200000 },
      impressions: { jan: 55000000, feb: 52000000, mar: 68000000, apr: 78000000 },
      cpm:         { jan: 218.2, feb: 221.2, mar: 232.4, apr: 233.3 },
      fill_rate:   { jan: 92, feb: 89, mar: 95, apr: 91 },
      top_segments: ["Live Cricket", "Football", "Kabaddi"],
    },
    connected_tv: {
      name: "Connected TV",
      revenue:     { jan: 4200000, feb: 4800000, mar: 4100000, apr: 3200000 },
      impressions: { jan: 18000000, feb: 20000000, mar: 17500000, apr: 13800000 },
      cpm:         { jan: 233.3, feb: 240.0, mar: 234.3, apr: 231.9 },
      fill_rate:   { jan: 78, feb: 82, mar: 76, apr: 63 },
      top_segments: ["Smart TV", "Fire Stick", "Android TV"],
    },
  },

  campaigns: [
    { id: "C001", name: "IPL 2024 — Title Sponsor",         publisher: "sports_inventory", status: "active", budget: 5000000, spent: 4750000, delivery_pct: 95, end_date: "2024-05-26" },
    { id: "C002", name: "Hotstar Specials — Brand Takeover", publisher: "premium_ott",     status: "active", budget: 2000000, spent: 980000,  delivery_pct: 49, end_date: "2024-05-15" },
    { id: "C003", name: "CTV Premium — Q2 Upfront",          publisher: "connected_tv",    status: "active", budget: 1500000, spent: 520000,  delivery_pct: 35, end_date: "2024-06-30" },
    { id: "C004", name: "ICC World Cup Sponsorship",          publisher: "sports_inventory", status: "active", budget: 8000000, spent: 7200000, delivery_pct: 90, end_date: "2024-06-29" },
    { id: "C005", name: "OTT Originals — Awareness Drive",   publisher: "premium_ott",     status: "active", budget: 1200000, spent: 348000,  delivery_pct: 29, end_date: "2024-05-01" },
    { id: "C006", name: "Smart TV Launch Campaign",           publisher: "connected_tv",    status: "paused", budget: 800000,  spent: 776000,  delivery_pct: 97, end_date: "2024-04-20" },
  ],

  inventory: {
    premium_ott:      { total_slots: 120000, sold: 88800,  available: 31200, sell_through: 74 },
    sports_inventory: { total_slots: 200000, sold: 182000, available: 18000, sell_through: 91 },
    connected_tv:     { total_slots: 80000,  sold: 50400,  available: 29600, sell_through: 63 },
  },

  drift_alerts: [
    {
      id: "DA001", severity: "HIGH",
      publisher: "Connected TV", metric: "Fill Rate",
      current_value: 63, strategy_target: 82, deviation: -19,
      detected_on: "Day 8 of April", days_remaining: 22,
      root_cause: "Programmatic floor price set too high at ₹220 CPM — demand dropping off. Open exchange clearing at ₹195 CPM.",
      recommended_action: "Reduce floor price to ₹195 CPM. Reallocate 15,000 unsold slots to PMPs with 3 active demand partners.",
      revenue_at_risk: 1100000,
    },
    {
      id: "DA002", severity: "MEDIUM",
      publisher: "Premium OTT", metric: "Delivery Pace",
      current_value: 49, strategy_target: 75, deviation: -26,
      detected_on: "Day 6 of April", days_remaining: 24,
      root_cause: "Brand Takeover campaign pacing 26% behind. Creative approval delays caused 4-day delivery gap in first week.",
      recommended_action: "Compress remaining delivery schedule. Increase daily impression cap by 35% for remaining flight.",
      revenue_at_risk: 520000,
    },
    {
      id: "DA003", severity: "HIGH",
      publisher: "Premium OTT", metric: "eCPM",
      current_value: 186.8, strategy_target: 210.0, deviation: -11,
      detected_on: "Day 5 of April", days_remaining: 25,
      root_cause: "April fill rate decline forcing more inventory into lower-yield open exchange. Premium direct deals not filling Q1 renewal gap.",
      recommended_action: "Activate 3 paused PMP deals with streaming demand partners. Review Q1 renewal pipeline — 2 deals worth ₹18L still unsigned.",
      revenue_at_risk: 2100000,
    },
  ],

  benchmarks: {
    industry_avg_fill_rate: 83,
    industry_avg_cpm_ott: 195,
    industry_avg_cpm_ctv: 245,
    industry_avg_cpm_sports: 228,
    top_quartile_fill_rate: 91,
  },

  // ── BILLING DUMMY DATA ────────────────────────────────────────
  billing: {
    // Credit packs available for purchase
    credit_packs: [
      { id: "starter",    name: "Starter",    credits: 500,   price: 2500,  currency: "INR", per_credit: 5.0,  best_for: "Small teams, evaluation" },
      { id: "growth",     name: "Growth",     credits: 2000,  price: 8000,  currency: "INR", per_credit: 4.0,  best_for: "Active revenue teams" },
      { id: "scale",      name: "Scale",      credits: 5000,  price: 17500, currency: "INR", per_credit: 3.5,  best_for: "Large publishers, agencies" },
      { id: "enterprise", name: "Enterprise", credits: 999999, price: 0,    currency: "INR", per_credit: 3.0,  best_for: "Custom pricing, dedicated support" },
    ],

    // Credit costs per action type
    credit_costs: {
      intelligence_simple:  10,   // simple query — one tool call
      intelligence_complex: 25,   // complex — multiple tools, drift analysis
      operations_suggest:   20,   // operations agent — suggest only
      operations_execute:   50,   // operations agent — actual execution
      drift_alert:          5,    // scheduled drift alert check
      report_generation:    100,  // full monthly report
      benchmark_comparison: 15,   // industry benchmark query
    },

    // Current user account (dummy)
    current_user: {
      id: "USR001",
      name: "Voiro Demo User",
      organisation: "Demo Publisher",
      plan: "Growth",
      credits_purchased: 2000,
      credits_used: 1653,
      credits_remaining: 347,
      credits_expiry: null,  // never expire
      low_balance_threshold: 200,
      joined_date: "2024-01-15",
    },

    // Purchase history (dummy)
    purchase_history: [
      { id: "PUR001", pack: "Growth",  credits: 2000, amount: 8000, currency: "INR", date: "2024-04-01", status: "completed" },
      { id: "PUR002", pack: "Starter", credits: 500,  amount: 2500, currency: "INR", date: "2024-03-01", status: "completed" },
      { id: "PUR003", pack: "Starter", credits: 500,  amount: 2500, currency: "INR", date: "2024-02-01", status: "completed" },
    ],

    // Monthly usage (dummy)
    monthly_usage: {
      "2024-04": {
        total_credits_used: 653,
        total_queries: 48,
        breakdown: {
          intelligence_simple:  320,  // 32 simple queries × 10 credits
          intelligence_complex: 225,  // 9 complex queries × 25 credits
          drift_alert:          60,   // 12 alerts × 5 credits
          benchmark_comparison: 45,   // 3 benchmarks × 15 credits
          operations_suggest:   0,
          operations_execute:   0,
          report_generation:    0,
        },
        daily_usage: [
          { date: "2024-04-01", credits: 45, queries: 4 },
          { date: "2024-04-02", credits: 30, queries: 3 },
          { date: "2024-04-03", credits: 55, queries: 5 },
          { date: "2024-04-04", credits: 25, queries: 2 },
          { date: "2024-04-05", credits: 60, queries: 5 },
          { date: "2024-04-06", credits: 10, queries: 1 },
          { date: "2024-04-07", credits: 0,  queries: 0 },
          { date: "2024-04-08", credits: 75, queries: 6 },
          { date: "2024-04-09", credits: 40, queries: 4 },
          { date: "2024-04-10", credits: 35, queries: 3 },
          { date: "2024-04-11", credits: 50, queries: 4 },
          { date: "2024-04-12", credits: 20, queries: 2 },
          { date: "2024-04-13", credits: 65, queries: 5 },
          { date: "2024-04-14", credits: 45, queries: 4 },
          { date: "2024-04-15", credits: 93, queries: 0 }, // drift alerts auto-run
        ],
        estimated_cost: 2612,  // INR equivalent at Growth pack rate
      },
      "2024-03": {
        total_credits_used: 487,
        total_queries: 38,
        breakdown: {
          intelligence_simple:  240,
          intelligence_complex: 175,
          drift_alert:          45,
          benchmark_comparison: 15,
          operations_suggest:   0,
          operations_execute:   0,
          report_generation:    0,
        },
        estimated_cost: 1948,
      },
      "2024-02": {
        total_credits_used: 513,
        total_queries: 41,
        breakdown: {
          intelligence_simple:  260,
          intelligence_complex: 200,
          drift_alert:          30,
          benchmark_comparison: 15,
          operations_suggest:   0,
          operations_execute:   0,
          report_generation:    0,
        },
        estimated_cost: 2052,
      },
    },
  },
};

// ── Tool Router ───────────────────────────────────────────────
function handleToolCall(toolName, toolInput) {
  switch (toolName) {
    case "get_revenue_summary":              return getRevenueSummary(toolInput);
    case "get_underdelivering_campaigns":    return getUnderdelivering(toolInput);
    case "get_publisher_performance":        return getPublisherPerformance(toolInput);
    case "get_inventory_status":             return getInventoryStatus(toolInput);
    case "get_all_publishers":               return getAllPublishers();
    case "get_drift_alerts":                 return getDriftAlerts(toolInput);
    case "get_benchmarks":                   return getBenchmarks(toolInput);
    case "get_credit_balance":               return getCreditBalance();
    case "get_usage_breakdown":              return getUsageBreakdown(toolInput);
    case "get_billing_history":              return getBillingHistory();
    case "get_credit_packs":                 return getCreditPacks();
    case "calculate_credits_needed":         return calculateCreditsNeeded(toolInput);
    default: return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── Revenue Tool Handlers ─────────────────────────────────────

function getRevenueSummary({ publisher, month }) {
  const key = publisher?.toLowerCase().replace(/ /g, "_");
  const data = DUMMY_DATA.publishers[key];
  if (!data) {
    const available = Object.values(DUMMY_DATA.publishers).map(p => p.name).join(", ");
    return JSON.stringify({ error: `Publisher not found. Available: ${available}` });
  }
  const months = ["jan", "feb", "mar", "apr"];
  const m = month?.toLowerCase();
  if (m && months.includes(m)) {
    return JSON.stringify({
      publisher: data.name, month: m.toUpperCase(),
      revenue: data.revenue[m], impressions: data.impressions[m],
      cpm: data.cpm[m], fill_rate: data.fill_rate[m],
    });
  }
  return JSON.stringify({
    publisher: data.name,
    monthly_data: months.map(mo => ({
      month: mo.toUpperCase(), revenue: data.revenue[mo],
      impressions: data.impressions[mo], cpm: data.cpm[mo],
      fill_rate: data.fill_rate[mo],
    })),
  });
}

function getUnderdelivering({ threshold = 70 }) {
  const list = DUMMY_DATA.campaigns.filter(
    c => c.status === "active" && c.delivery_pct < threshold
  );
  return JSON.stringify({ threshold_pct: threshold, count: list.length, campaigns: list });
}

function getPublisherPerformance({ publisher }) {
  const key = publisher?.toLowerCase().replace(/ /g, "_");
  const data = DUMMY_DATA.publishers[key];
  const inventory = DUMMY_DATA.inventory[key];
  if (!data) {
    const available = Object.values(DUMMY_DATA.publishers).map(p => p.name).join(", ");
    return JSON.stringify({ error: `Publisher not found. Available: ${available}` });
  }
  const campaigns = DUMMY_DATA.campaigns.filter(c => c.publisher === key);
  const alerts = DUMMY_DATA.drift_alerts.filter(
    a => a.publisher.toLowerCase().replace(/ /g, "_") === key
  );
  return JSON.stringify({
    publisher: data.name, revenue: data.revenue,
    fill_rates: data.fill_rate, top_segments: data.top_segments,
    inventory, active_campaigns: campaigns.filter(c => c.status === "active").length,
    campaigns, active_drift_alerts: alerts.length, drift_alerts: alerts,
  });
}

function getInventoryStatus({ publisher }) {
  if (publisher) {
    const key = publisher.toLowerCase().replace(/ /g, "_");
    const data = DUMMY_DATA.inventory[key];
    if (!data) return JSON.stringify({ error: "Publisher not found" });
    return JSON.stringify({ publisher, ...data });
  }
  return JSON.stringify(
    Object.entries(DUMMY_DATA.inventory).map(([pub, inv]) => ({
      publisher: DUMMY_DATA.publishers[pub]?.name || pub, ...inv,
    }))
  );
}

function getAllPublishers() {
  return JSON.stringify(
    Object.values(DUMMY_DATA.publishers).map(p => ({
      name: p.name,
      avg_cpm: (Object.values(p.cpm).reduce((a, b) => a + b, 0) / 4).toFixed(1),
      total_revenue_ytd: Object.values(p.revenue).reduce((a, b) => a + b, 0),
    }))
  );
}

function getDriftAlerts({ severity }) {
  let alerts = DUMMY_DATA.drift_alerts;
  if (severity) alerts = alerts.filter(a => a.severity === severity.toUpperCase());
  return JSON.stringify({
    total_alerts: alerts.length,
    total_revenue_at_risk: alerts.reduce((sum, a) => sum + a.revenue_at_risk, 0),
    alerts,
  });
}

function getBenchmarks({ publisher }) {
  const b = DUMMY_DATA.benchmarks;
  if (publisher) {
    const key = publisher.toLowerCase().replace(/ /g, "_");
    const data = DUMMY_DATA.publishers[key];
    if (!data) return JSON.stringify({ error: "Publisher not found" });
    const latestFillRate = data.fill_rate.apr;
    const latestCPM = data.cpm.apr;
    return JSON.stringify({
      publisher: data.name,
      your_fill_rate: latestFillRate,
      industry_avg_fill_rate: b.industry_avg_fill_rate,
      fill_rate_vs_industry: latestFillRate - b.industry_avg_fill_rate,
      your_cpm: latestCPM,
      top_quartile_fill_rate: b.top_quartile_fill_rate,
      gap_to_top_quartile: b.top_quartile_fill_rate - latestFillRate,
    });
  }
  return JSON.stringify(b);
}

// ── Billing Tool Handlers ─────────────────────────────────────

function getCreditBalance() {
  const user = DUMMY_DATA.billing.current_user;
  const thisMonth = DUMMY_DATA.billing.monthly_usage["2024-04"];
  const dailyAvg = thisMonth.total_credits_used / 15;  // 15 days so far
  const daysRemaining = Math.floor(user.credits_remaining / dailyAvg);

  return JSON.stringify({
    organisation: user.organisation,
    plan: user.plan,
    credits_remaining: user.credits_remaining,
    credits_purchased: user.credits_purchased,
    credits_used_total: user.credits_used,
    usage_this_month: thisMonth.total_credits_used,
    daily_avg_usage: Math.round(dailyAvg),
    estimated_days_remaining: daysRemaining,
    low_balance_warning: user.credits_remaining < user.low_balance_threshold,
    credit_costs: DUMMY_DATA.billing.credit_costs,
  });
}

function getUsageBreakdown({ period }) {
  const key = period || "2024-04";
  const usage = DUMMY_DATA.billing.monthly_usage[key];
  if (!usage) {
    return JSON.stringify({ error: `No usage data for ${key}. Available: ${Object.keys(DUMMY_DATA.billing.monthly_usage).join(", ")}` });
  }
  const costs = DUMMY_DATA.billing.credit_costs;
  return JSON.stringify({
    period: key,
    total_credits_used: usage.total_credits_used,
    total_queries: usage.total_queries,
    estimated_cost_inr: usage.estimated_cost,
    breakdown: {
      intelligence_simple: {
        credits: usage.breakdown.intelligence_simple,
        queries: usage.breakdown.intelligence_simple / costs.intelligence_simple,
        cost_per_query: costs.intelligence_simple,
      },
      intelligence_complex: {
        credits: usage.breakdown.intelligence_complex,
        queries: usage.breakdown.intelligence_complex / costs.intelligence_complex,
        cost_per_query: costs.intelligence_complex,
      },
      drift_alerts: {
        credits: usage.breakdown.drift_alert,
        alerts: usage.breakdown.drift_alert / costs.drift_alert,
        cost_per_alert: costs.drift_alert,
      },
      benchmark_comparisons: {
        credits: usage.breakdown.benchmark_comparison,
        queries: usage.breakdown.benchmark_comparison / costs.benchmark_comparison,
        cost_per_query: costs.benchmark_comparison,
      },
    },
    daily_usage: usage.daily_usage,
  });
}

function getBillingHistory() {
  const history = DUMMY_DATA.billing.purchase_history;
  const monthlyUsage = DUMMY_DATA.billing.monthly_usage;
  return JSON.stringify({
    purchase_history: history,
    monthly_summary: Object.entries(monthlyUsage).map(([period, data]) => ({
      period,
      credits_used: data.total_credits_used,
      queries: data.total_queries,
      estimated_cost_inr: data.estimated_cost,
    })),
    total_spent_inr: history.reduce((sum, p) => sum + p.amount, 0),
    total_credits_purchased: history.reduce((sum, p) => sum + p.credits, 0),
  });
}

function getCreditPacks() {
  return JSON.stringify({
    packs: DUMMY_DATA.billing.credit_packs,
    credit_costs: DUMMY_DATA.billing.credit_costs,
    current_plan: DUMMY_DATA.billing.current_user.plan,
    note: "Credits never expire. Buy more anytime."
  });
}

function calculateCreditsNeeded({ queries_per_month, operations_per_month = 0, alerts_per_month = 0 }) {
  const costs = DUMMY_DATA.billing.credit_costs;
  const creditsNeeded =
    (queries_per_month * costs.intelligence_simple) +
    (operations_per_month * costs.operations_execute) +
    (alerts_per_month * costs.drift_alert);

  const packs = DUMMY_DATA.billing.credit_packs.filter(p => p.id !== "enterprise");
  const recommendedPack = packs.find(p => p.credits >= creditsNeeded) || DUMMY_DATA.billing.credit_packs[3];
  const monthsFromPack = recommendedPack.credits === 999999
    ? "unlimited"
    : Math.floor(recommendedPack.credits / creditsNeeded);

  return JSON.stringify({
    your_usage: { queries_per_month, operations_per_month, alerts_per_month },
    credits_needed_per_month: creditsNeeded,
    recommended_pack: recommendedPack,
    months_from_one_pack: monthsFromPack,
    cost_per_month_inr: Math.round(recommendedPack.price / (monthsFromPack || 1)),
    all_packs_comparison: packs.map(p => ({
      pack: p.name,
      price: p.price,
      covers_months: p.credits === 999999 ? "unlimited" : Math.floor(p.credits / creditsNeeded),
      cost_per_month: Math.round(p.price / Math.max(1, Math.floor(p.credits / creditsNeeded))),
    })),
  });
}

module.exports = { handleToolCall };

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
    { id: "C001", name: "IPL 2024 — Title Sponsor",        publisher: "sports_inventory", status: "active", budget: 5000000, spent: 4750000, delivery_pct: 95, end_date: "2024-05-26" },
    { id: "C002", name: "Hotstar Specials — Brand Takeover", publisher: "premium_ott",    status: "active", budget: 2000000, spent: 980000,  delivery_pct: 49, end_date: "2024-05-15" },
    { id: "C003", name: "CTV Premium — Q2 Upfront",         publisher: "connected_tv",    status: "active", budget: 1500000, spent: 520000,  delivery_pct: 35, end_date: "2024-06-30" },
    { id: "C004", name: "ICC World Cup Sponsorship",         publisher: "sports_inventory", status: "active", budget: 8000000, spent: 7200000, delivery_pct: 90, end_date: "2024-06-29" },
    { id: "C005", name: "OTT Originals — Awareness Drive",  publisher: "premium_ott",     status: "active", budget: 1200000, spent: 348000,  delivery_pct: 29, end_date: "2024-05-01" },
    { id: "C006", name: "Smart TV Launch Campaign",          publisher: "connected_tv",    status: "paused", budget: 800000,  spent: 776000,  delivery_pct: 97, end_date: "2024-04-20" },
  ],

  inventory: {
    premium_ott:     { total_slots: 120000, sold: 88800,  available: 31200, sell_through: 74 },
    sports_inventory:{ total_slots: 200000, sold: 182000, available: 18000, sell_through: 91 },
    connected_tv:    { total_slots: 80000,  sold: 50400,  available: 29600, sell_through: 63 },
  },

  // ── Drift Alerts ──────────────────────────────────────────
  drift_alerts: [
    {
      id: "DA001",
      severity: "HIGH",
      publisher: "Connected TV",
      metric: "Fill Rate",
      current_value: 63,
      strategy_target: 82,
      deviation: -19,
      detected_on: "Day 8 of April",
      days_remaining: 22,
      root_cause: "Programmatic floor price set too high at ₹220 CPM — demand dropping off at this threshold. Open exchange clearing at ₹195 CPM.",
      recommended_action: "Reduce floor price to ₹195 CPM on open exchange. Reallocate 15,000 unsold slots to PMPs with 3 active demand partners.",
      revenue_at_risk: 1100000,
    },
    {
      id: "DA002",
      severity: "MEDIUM",
      publisher: "Premium OTT",
      metric: "Delivery Pace",
      current_value: 49,
      strategy_target: 75,
      deviation: -26,
      detected_on: "Day 6 of April",
      days_remaining: 24,
      root_cause: "Hotstar Specials Brand Takeover campaign pacing 26% behind target. Creative approval delays caused 4-day delivery gap in first week.",
      recommended_action: "Compress remaining delivery schedule. Increase daily impression cap by 35% for remaining flight. Flag to account team for client communication.",
      revenue_at_risk: 520000,
    },
    {
      id: "DA003",
      severity: "HIGH",
      publisher: "Premium OTT",
      metric: "eCPM",
      current_value: 186.8,
      strategy_target: 210.0,
      deviation: -11,
      detected_on: "Day 5 of April",
      days_remaining: 25,
      root_cause: "April fill rate decline from 85% to 74% forcing more inventory into lower-yield open exchange. Premium direct deals not filling gap left by Q1 deal renewals.",
      recommended_action: "Activate 3 paused PMP deals with streaming demand partners. Review Q1 renewal pipeline — 2 deals worth ₹18L still unsigned.",
      revenue_at_risk: 2100000,
    },
  ],

  // ── Benchmarks ────────────────────────────────────────────
  benchmarks: {
    industry_avg_fill_rate: 83,
    industry_avg_cpm_ott: 195,
    industry_avg_cpm_ctv: 245,
    industry_avg_cpm_sports: 228,
    top_quartile_fill_rate: 91,
  },
};

// ── Tool Router ───────────────────────────────────────────────
function handleToolCall(toolName, toolInput) {
  switch (toolName) {
    case "get_revenue_summary":           return getRevenueSummary(toolInput);
    case "get_underdelivering_campaigns": return getUnderdelivering(toolInput);
    case "get_publisher_performance":     return getPublisherPerformance(toolInput);
    case "get_inventory_status":          return getInventoryStatus(toolInput);
    case "get_all_publishers":            return getAllPublishers();
    case "get_drift_alerts":              return getDriftAlerts(toolInput);
    case "get_benchmarks":                return getBenchmarks(toolInput);
    default: return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── Tool Handlers ─────────────────────────────────────────────

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
    publisher: data.name,
    revenue: data.revenue,
    fill_rates: data.fill_rate,
    top_segments: data.top_segments,
    inventory,
    active_campaigns: campaigns.filter(c => c.status === "active").length,
    campaigns,
    active_drift_alerts: alerts.length,
    drift_alerts: alerts,
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
  if (severity) {
    alerts = alerts.filter(a => a.severity === severity.toUpperCase());
  }
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

module.exports = { handleToolCall };

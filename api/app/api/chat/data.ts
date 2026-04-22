// ─────────────────────────────────────────────────────────────
// DUMMY DATA
// Replace each handler function with a real Voiro API call later
// ─────────────────────────────────────────────────────────────

export const DUMMY_DATA = {
  publishers: {
    times_of_india: {
      name: "Times of India",
      revenue:     { jan: 450000, feb: 520000, mar: 480000, apr: 390000 },
      impressions: { jan: 12000000, feb: 13500000, mar: 12800000, apr: 10200000 },
      cpm:         { jan: 37.5, feb: 38.5, mar: 37.5, apr: 38.2 },
      fill_rate:   { jan: 87, feb: 91, mar: 85, apr: 78 },
      top_segments: ["News", "Sports", "Entertainment"],
    },
    hindustan_times: {
      name: "Hindustan Times",
      revenue:     { jan: 310000, feb: 295000, mar: 340000, apr: 280000 },
      impressions: { jan: 8500000, feb: 8100000, mar: 9200000, apr: 7600000 },
      cpm:         { jan: 36.5, feb: 36.4, mar: 37.0, apr: 36.8 },
      fill_rate:   { jan: 82, feb: 79, mar: 84, apr: 76 },
      top_segments: ["News", "Business", "Lifestyle"],
    },
    ndtv: {
      name: "NDTV",
      revenue:     { jan: 220000, feb: 240000, mar: 210000, apr: 195000 },
      impressions: { jan: 6200000, feb: 6800000, mar: 5900000, apr: 5400000 },
      cpm:         { jan: 35.5, feb: 35.3, mar: 35.6, apr: 36.1 },
      fill_rate:   { jan: 80, feb: 83, mar: 78, apr: 74 },
      top_segments: ["News", "Elections", "Business"],
    },
  },

  campaigns: [
    { id: "C001", name: "Summer Sale 2024",    publisher: "times_of_india",  status: "active", budget: 150000, spent: 142000, delivery_pct: 94, end_date: "2024-04-30" },
    { id: "C002", name: "IPL Campaign",         publisher: "times_of_india",  status: "active", budget: 200000, spent: 98000,  delivery_pct: 49, end_date: "2024-05-15" },
    { id: "C003", name: "Brand Awareness Q2",   publisher: "hindustan_times", status: "active", budget: 80000,  spent: 71000,  delivery_pct: 89, end_date: "2024-06-30" },
    { id: "C004", name: "Election Coverage",    publisher: "ndtv",            status: "active", budget: 120000, spent: 45000,  delivery_pct: 37, end_date: "2024-05-01" },
    { id: "C005", name: "E-commerce Drive",     publisher: "hindustan_times", status: "paused", budget: 60000,  spent: 58000,  delivery_pct: 97, end_date: "2024-04-20" },
  ],

  inventory: {
    times_of_india:  { total_slots: 50000, sold: 43500, available: 6500,  sell_through: 87 },
    hindustan_times: { total_slots: 35000, sold: 26600, available: 8400,  sell_through: 76 },
    ndtv:            { total_slots: 28000, sold: 20720, available: 7280,  sell_through: 74 },
  },
};

// ─────────────────────────────────────────────────────────────
// TOOL ROUTER
// ─────────────────────────────────────────────────────────────

export function handleToolCall(toolName: string, toolInput: Record<string, any>): string {
  switch (toolName) {
    case "get_revenue_summary":         return getRevenueSummary(toolInput);
    case "get_underdelivering_campaigns": return getUnderdeliveringCampaigns(toolInput);
    case "get_publisher_performance":   return getPublisherPerformance(toolInput);
    case "get_inventory_status":        return getInventoryStatus(toolInput);
    case "get_all_publishers":          return getAllPublishers();
    default: return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ─────────────────────────────────────────────────────────────
// TOOL HANDLERS — swap these bodies for real Voiro API calls
// ─────────────────────────────────────────────────────────────

function getRevenueSummary({ publisher, month }: any): string {
  const key = publisher?.toLowerCase().replace(/ /g, "_") as keyof typeof DUMMY_DATA.publishers;
  const data = DUMMY_DATA.publishers[key];

  if (!data) {
    const available = Object.values(DUMMY_DATA.publishers).map((p) => p.name).join(", ");
    return JSON.stringify({ error: `Publisher not found. Available: ${available}` });
  }

  const months = ["jan", "feb", "mar", "apr"] as const;
  type Month = typeof months[number];
  const m = month?.toLowerCase() as Month;

  if (m && months.includes(m)) {
    return JSON.stringify({
      publisher:   data.name,
      month:       m.toUpperCase(),
      revenue:     data.revenue[m],
      impressions: data.impressions[m],
      cpm:         data.cpm[m],
      fill_rate:   data.fill_rate[m],
    });
  }

  // No month — return all
  return JSON.stringify({
    publisher: data.name,
    monthly_data: months.map((mo) => ({
      month:       mo.toUpperCase(),
      revenue:     data.revenue[mo],
      impressions: data.impressions[mo],
      cpm:         data.cpm[mo],
      fill_rate:   data.fill_rate[mo],
    })),
  });
}

function getUnderdeliveringCampaigns({ threshold = 70 }: any): string {
  const underdelivering = DUMMY_DATA.campaigns.filter(
    (c) => c.status === "active" && c.delivery_pct < threshold
  );
  return JSON.stringify({
    threshold_pct: threshold,
    count:         underdelivering.length,
    campaigns:     underdelivering,
  });
}

function getPublisherPerformance({ publisher }: any): string {
  const key = publisher?.toLowerCase().replace(/ /g, "_") as keyof typeof DUMMY_DATA.publishers;
  const data      = DUMMY_DATA.publishers[key];
  const inventory = DUMMY_DATA.inventory[key as keyof typeof DUMMY_DATA.inventory];

  if (!data) {
    const available = Object.values(DUMMY_DATA.publishers).map((p) => p.name).join(", ");
    return JSON.stringify({ error: `Publisher not found. Available: ${available}` });
  }

  const campaigns = DUMMY_DATA.campaigns.filter((c) => c.publisher === key);

  return JSON.stringify({
    publisher:        data.name,
    revenue:          data.revenue,
    fill_rates:       data.fill_rate,
    top_segments:     data.top_segments,
    inventory,
    active_campaigns: campaigns.filter((c) => c.status === "active").length,
    campaigns,
  });
}

function getInventoryStatus({ publisher }: any): string {
  if (publisher) {
    const key  = publisher.toLowerCase().replace(/ /g, "_") as keyof typeof DUMMY_DATA.inventory;
    const data = DUMMY_DATA.inventory[key];
    if (!data) return JSON.stringify({ error: "Publisher not found" });
    return JSON.stringify({ publisher, ...data });
  }
  return JSON.stringify(
    Object.entries(DUMMY_DATA.inventory).map(([pub, inv]) => ({
      publisher: DUMMY_DATA.publishers[pub as keyof typeof DUMMY_DATA.publishers]?.name || pub,
      ...inv,
    }))
  );
}

function getAllPublishers(): string {
  return JSON.stringify(
    Object.values(DUMMY_DATA.publishers).map((p) => ({
      name:            p.name,
      avg_cpm:         (Object.values(p.cpm).reduce((a, b) => a + b, 0) / 4).toFixed(1),
      total_revenue_ytd: Object.values(p.revenue).reduce((a, b) => a + b, 0),
    }))
  );
}

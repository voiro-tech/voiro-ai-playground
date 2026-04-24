import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  per_credit: number;
  best_for: string;
}

interface MonthlyUsage {
  period: string;
  credits_used: number;
  queries: number;
  estimated_cost_inr: number;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="billing-shell">

      <!-- Header -->
      <div class="billing-header">
        <div class="header-left">
          <span class="header-back" (click)="goBack()">← Back to Agent</span>
          <h1>Credits & Billing</h1>
          <p class="header-sub">Manage your Voiro AI usage and credits</p>
        </div>
        <div class="balance-hero">
          <span class="balance-label">Available Credits</span>
          <span class="balance-number">{{ balance?.credits_remaining || 0 }}</span>
          <span class="balance-sub" [class.warning]="balance?.low_balance_warning">
            {{ balance?.low_balance_warning ? '⚠ Low balance' : 'credits remaining' }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p>Loading billing data...</p>
      </div>

      <div class="billing-body" *ngIf="!loading">

        <!-- Usage Summary Cards -->
        <div class="section">
          <h2 class="section-title">This Month</h2>
          <div class="cards">
            <div class="card">
              <span class="card-label">Credits Used</span>
              <span class="card-value">{{ currentUsage?.total_credits_used || 0 }}</span>
              <span class="card-sub">of {{ balance?.credits_purchased }} purchased</span>
            </div>
            <div class="card">
              <span class="card-label">Queries Asked</span>
              <span class="card-value">{{ currentUsage?.total_queries || 0 }}</span>
              <span class="card-sub">intelligence queries</span>
            </div>
            <div class="card">
              <span class="card-label">Est. Cost</span>
              <span class="card-value">₹{{ currentUsage?.estimated_cost | number:'1.0-0' }}</span>
              <span class="card-sub">at {{ balance?.plan }} pack rate</span>
            </div>
            <div class="card">
              <span class="card-label">Days Remaining</span>
              <span class="card-value" [class.warning-text]="(balance?.estimated_days_remaining || 0) < 7">
                {{ balance?.estimated_days_remaining || 0 }}
              </span>
              <span class="card-sub">at current usage rate</span>
            </div>
          </div>
        </div>

        <!-- Usage Breakdown -->
        <div class="section" *ngIf="currentUsage">
          <h2 class="section-title">Usage Breakdown — April 2024</h2>
          <div class="breakdown">
            <div class="breakdown-row" *ngFor="let item of usageBreakdownItems">
              <div class="breakdown-left">
                <span class="breakdown-name">{{ item.name }}</span>
                <span class="breakdown-detail">{{ item.count }} × {{ item.cost }} credits each</span>
              </div>
              <div class="breakdown-right">
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar" [style.width.%]="item.pct"></div>
                </div>
                <span class="breakdown-credits">{{ item.credits }} credits</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Usage Chart -->
        <div class="section" *ngIf="currentUsage?.daily_usage">
          <h2 class="section-title">Daily Usage</h2>
          <div class="chart">
            <div class="chart-bars">
              <div
                *ngFor="let day of currentUsage.daily_usage"
                class="chart-bar-wrap"
                [title]="day.date + ': ' + day.credits + ' credits'">
                <div
                  class="chart-bar"
                  [style.height.%]="getBarHeight(day.credits)">
                </div>
                <span class="chart-label">{{ day.date | date:'d' }}</span>
              </div>
            </div>
            <div class="chart-legend">
              <span class="legend-dot"></span> Credits used per day
            </div>
          </div>
        </div>

        <!-- Credit Packs -->
        <div class="section">
          <h2 class="section-title">Buy Credits</h2>
          <p class="section-desc">Credits never expire. Use them for intelligence queries, operations actions, and drift alerts.</p>
          <div class="packs">
            <div
              *ngFor="let pack of creditPacks"
              class="pack"
              [class.pack-current]="pack.name === balance?.plan"
              [class.pack-enterprise]="pack.id === 'enterprise'">

              <div class="pack-header">
                <span class="pack-name">{{ pack.name }}</span>
                <span class="pack-badge" *ngIf="pack.name === balance?.plan">Current</span>
                <span class="pack-badge enterprise-badge" *ngIf="pack.id === 'enterprise'">Custom</span>
              </div>

              <div class="pack-price" *ngIf="pack.id !== 'enterprise'">
                <span class="price-amount">₹{{ pack.price | number:'1.0-0' }}</span>
                <span class="price-sub">{{ pack.credits | number:'1.0-0' }} credits</span>
              </div>
              <div class="pack-price" *ngIf="pack.id === 'enterprise'">
                <span class="price-amount">Talk to us</span>
                <span class="price-sub">Unlimited credits</span>
              </div>

              <div class="pack-per" *ngIf="pack.id !== 'enterprise'">
                ₹{{ pack.per_credit }} per credit
              </div>

              <div class="pack-examples" *ngIf="pack.id !== 'enterprise'">
                <span>~{{ getQueriesFromPack(pack.credits) }} queries</span>
                <span class="dot">·</span>
                <span>{{ getMonthsFromPack(pack.credits) }} months typical use</span>
              </div>

              <div class="pack-best">{{ pack.best_for }}</div>

              <button
                class="pack-btn"
                [class.pack-btn-primary]="pack.id !== 'enterprise'"
                [class.pack-btn-secondary]="pack.id === 'enterprise'"
                (click)="selectPack(pack)">
                {{ pack.id === 'enterprise' ? 'Contact Sales' : pack.name === balance?.plan ? 'Top Up' : 'Buy Pack' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Credit Cost Reference -->
        <div class="section">
          <h2 class="section-title">What Credits Cost</h2>
          <div class="cost-table">
            <div class="cost-row cost-header">
              <span>Action</span>
              <span>Credits</span>
              <span>Cost at Growth</span>
            </div>
            <div class="cost-row" *ngFor="let item of creditCostItems">
              <span class="cost-name">{{ item.name }}</span>
              <span class="cost-credits">{{ item.credits }}</span>
              <span class="cost-inr">₹{{ (item.credits * 4) }}</span>
            </div>
          </div>
        </div>

        <!-- Billing History -->
        <div class="section">
          <h2 class="section-title">Purchase History</h2>
          <div class="history">
            <div class="history-row history-header">
              <span>Date</span>
              <span>Pack</span>
              <span>Credits</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            <div class="history-row" *ngFor="let item of purchaseHistory">
              <span>{{ item.date | date:'dd MMM yyyy' }}</span>
              <span>{{ item.pack }}</span>
              <span>{{ item.credits | number:'1.0-0' }}</span>
              <span>₹{{ item.amount | number:'1.0-0' }}</span>
              <span class="status-badge">{{ item.status }}</span>
            </div>
          </div>
        </div>

        <!-- Monthly Usage History -->
        <div class="section">
          <h2 class="section-title">Monthly Usage History</h2>
          <div class="history">
            <div class="history-row history-header">
              <span>Month</span>
              <span>Credits Used</span>
              <span>Queries</span>
              <span>Est. Cost</span>
            </div>
            <div class="history-row" *ngFor="let item of monthlyHistory">
              <span>{{ formatMonth(item.period) }}</span>
              <span>{{ item.credits_used | number:'1.0-0' }}</span>
              <span>{{ item.queries }}</span>
              <span>₹{{ item.estimated_cost_inr | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .billing-shell {
      min-height: 100vh;
      background: #0f1117;
      color: #e2e8f8;
      font-family: 'DM Sans', -apple-system, sans-serif;
    }

    /* ── Header ── */
    .billing-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 32px 40px;
      border-bottom: 1px solid #1c2338;
      background: #131720;
    }
    .header-back {
      font-size: 12px; color: #4f8ef7; cursor: pointer;
      margin-bottom: 12px; display: block;
    }
    .header-back:hover { text-decoration: underline; }
    .billing-header h1 { font-size: 24px; font-weight: 700; color: #fff; }
    .header-sub { font-size: 13px; color: #4a5a7a; margin-top: 4px; }

    .balance-hero {
      display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
    }
    .balance-label { font-size: 11px; text-transform: uppercase; letter-spacing: .8px; color: #4a5a7a; }
    .balance-number { font-size: 48px; font-weight: 800; color: #4f8ef7; line-height: 1; }
    .balance-sub { font-size: 12px; color: #4a5a7a; }
    .balance-sub.warning { color: #f59e0b; }

    /* ── Body ── */
    .billing-body { padding: 32px 40px; max-width: 1100px; }

    .loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 80px;
      color: #4a5a7a;
    }
    .loading-dots { display: flex; gap: 4px; }
    .loading-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: #4f8ef7;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .loading-dots span:nth-child(2) { animation-delay: .2s; }
    .loading-dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes pulse {
      0%,80%,100% { transform: scale(.6); opacity: .4; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* ── Sections ── */
    .section { margin-bottom: 48px; }
    .section-title {
      font-size: 16px; font-weight: 600; color: #fff;
      margin-bottom: 8px;
    }
    .section-desc { font-size: 13px; color: #4a5a7a; margin-bottom: 20px; }

    /* ── Summary Cards ── */
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; }
    .card {
      background: #131720; border: 1px solid #1c2338;
      border-radius: 12px; padding: 20px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #4a5a7a; }
    .card-value { font-size: 32px; font-weight: 700; color: #fff; line-height: 1.1; }
    .card-sub { font-size: 11.5px; color: #374361; }
    .warning-text { color: #f59e0b !important; }

    /* ── Breakdown ── */
    .breakdown { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .breakdown-row {
      display: flex; align-items: center; justify-content: space-between;
      background: #131720; border: 1px solid #1c2338;
      border-radius: 8px; padding: 14px 18px;
    }
    .breakdown-left { display: flex; flex-direction: column; gap: 2px; }
    .breakdown-name { font-size: 13.5px; font-weight: 500; color: #c0d0f0; }
    .breakdown-detail { font-size: 11.5px; color: #374361; }
    .breakdown-right { display: flex; align-items: center; gap: 14px; }
    .breakdown-bar-wrap {
      width: 120px; height: 4px; background: #1c2338;
      border-radius: 2px; overflow: hidden;
    }
    .breakdown-bar { height: 100%; background: #4f8ef7; border-radius: 2px; transition: width .3s; }
    .breakdown-credits { font-size: 13px; font-weight: 600; color: #4f8ef7; min-width: 70px; text-align: right; }

    /* ── Chart ── */
    .chart { background: #131720; border: 1px solid #1c2338; border-radius: 12px; padding: 24px; margin-top: 16px; }
    .chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 100px; }
    .chart-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .chart-bar {
      width: 100%; background: #4f8ef7; border-radius: 3px 3px 0 0;
      min-height: 2px; transition: height .3s;
    }
    .chart-label { font-size: 9px; color: #374361; }
    .chart-legend { display: flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 11.5px; color: #374361; }
    .legend-dot { width: 8px; height: 8px; border-radius: 2px; background: #4f8ef7; }

    /* ── Packs ── */
    .packs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; }
    .pack {
      background: #131720; border: 1px solid #1c2338;
      border-radius: 12px; padding: 24px;
      display: flex; flex-direction: column; gap: 12px;
      transition: border-color .2s;
    }
    .pack:hover { border-color: #2a3a6a; }
    .pack-current { border-color: #4f8ef7; }
    .pack-header { display: flex; align-items: center; justify-content: space-between; }
    .pack-name { font-size: 15px; font-weight: 700; color: #fff; }
    .pack-badge {
      font-size: 10px; font-weight: 600; padding: 2px 8px;
      border-radius: 4px; background: rgba(79,142,247,.15);
      color: #4f8ef7; border: 1px solid rgba(79,142,247,.3);
    }
    .enterprise-badge { background: rgba(168,85,247,.15); color: #a855f7; border-color: rgba(168,85,247,.3); }
    .pack-price { display: flex; flex-direction: column; gap: 2px; }
    .price-amount { font-size: 26px; font-weight: 800; color: #fff; }
    .price-sub { font-size: 12px; color: #4a5a7a; }
    .pack-per { font-size: 11.5px; color: #374361; }
    .pack-examples { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #374361; }
    .dot { color: #2a384f; }
    .pack-best { font-size: 11.5px; color: #4a5a7a; line-height: 1.5; flex: 1; }
    .pack-btn {
      width: 100%; padding: 10px; border-radius: 7px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      border: none; transition: all .15s; font-family: inherit;
    }
    .pack-btn-primary { background: #1b4a8a; color: #fff; }
    .pack-btn-primary:hover { background: #2560b0; }
    .pack-btn-secondary { background: #1c2338; color: #7a8fb8; border: 1px solid #2a3450; }
    .pack-btn-secondary:hover { background: #2a3450; }

    /* ── Cost Table ── */
    .cost-table { display: flex; flex-direction: column; gap: 0; margin-top: 16px; background: #131720; border: 1px solid #1c2338; border-radius: 12px; overflow: hidden; }
    .cost-row { display: grid; grid-template-columns: 1fr 100px 120px; padding: 12px 18px; border-bottom: 1px solid #1c2338; }
    .cost-row:last-child { border-bottom: none; }
    .cost-header { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #374361; background: #0f1117; }
    .cost-name { font-size: 13px; color: #c0d0f0; }
    .cost-credits { font-size: 13px; color: #4f8ef7; font-weight: 600; }
    .cost-inr { font-size: 13px; color: #4a5a7a; }

    /* ── History ── */
    .history { display: flex; flex-direction: column; margin-top: 16px; background: #131720; border: 1px solid #1c2338; border-radius: 12px; overflow: hidden; }
    .history-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr; padding: 12px 18px; border-bottom: 1px solid #1c2338; font-size: 13px; }
    .history-row:last-child { border-bottom: none; }
    .history-header { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #374361; background: #0f1117; }
    .status-badge {
      font-size: 11px; font-weight: 600; padding: 2px 8px;
      border-radius: 4px; background: rgba(74,158,107,.15);
      color: #4a9e6b; width: fit-content;
    }
  `]
})
export class BillingComponent implements OnInit {
  balance: any = null;
  currentUsage: any = null;
  creditPacks: CreditPack[] = [];
  purchaseHistory: any[] = [];
  monthlyHistory: MonthlyUsage[] = [];
  loading = true;
  maxDailyCredits = 0;

  creditCostItems = [
    { name: 'Simple intelligence query',   credits: 10  },
    { name: 'Complex intelligence query',  credits: 25  },
    { name: 'Operations action (suggest)', credits: 20  },
    { name: 'Operations action (execute)', credits: 50  },
    { name: 'Drift alert check',           credits: 5   },
    { name: 'Benchmark comparison',        credits: 15  },
    { name: 'Monthly report generation',   credits: 100 },
  ];

  usageBreakdownItems: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadBillingData(); }

  loadBillingData() {
    const apiBase = environment.apiUrl;

    // Load balance
    this.http.post<{ reply: string }>(
      `${apiBase}/api/chat`,
      { messages: [{ role: 'user', content: 'get credit balance and usage breakdown for 2024-04 and billing history and credit packs' }] }
    ).subscribe({
      next: () => {},
      error: () => {}
    });

    // Load directly from dummy data via agent tools
    Promise.all([
      this.callTool('get_credit_balance', {}),
      this.callTool('get_usage_breakdown', { period: '2024-04' }),
      this.callTool('get_billing_history', {}),
      this.callTool('get_credit_packs', {}),
    ]).then(([balance, usage, history, packs]) => {
      this.balance = balance;
      this.currentUsage = usage;
      this.purchaseHistory = history.purchase_history || [];
      this.monthlyHistory = history.monthly_summary || [];
      this.creditPacks = packs.packs || [];
      this.maxDailyCredits = Math.max(...(usage.daily_usage || []).map((d: any) => d.credits), 1);
      this.buildBreakdownItems(usage);
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  callTool(toolName: string, input: any): Promise<any> {
    const apiBase = environment.apiUrl;
    return new Promise((resolve) => {
      this.http.post<{ reply: string }>(
        `${apiBase}/api/chat`,
        { messages: [{ role: 'user', content: `call tool ${toolName} with params ${JSON.stringify(input)} and return only the raw JSON data` }] }
      ).subscribe({
        next: (res) => {
          try {
            const jsonMatch = res.reply.match(/\{[\s\S]*\}/);
            resolve(jsonMatch ? JSON.parse(jsonMatch[0]) : {});
          } catch { resolve({}); }
        },
        error: () => resolve({})
      });
    });
  }

  buildBreakdownItems(usage: any) {
    if (!usage?.breakdown) return;
    const b = usage.breakdown;
    const total = usage.total_credits_used || 1;
    this.usageBreakdownItems = [
      { name: 'Simple Queries',       credits: b.intelligence_simple?.credits  || 0, count: b.intelligence_simple?.queries  || 0, cost: 10, pct: ((b.intelligence_simple?.credits  || 0) / total) * 100 },
      { name: 'Complex Queries',      credits: b.intelligence_complex?.credits || 0, count: b.intelligence_complex?.queries || 0, cost: 25, pct: ((b.intelligence_complex?.credits || 0) / total) * 100 },
      { name: 'Drift Alerts',         credits: b.drift_alerts?.credits         || 0, count: b.drift_alerts?.alerts           || 0, cost: 5,  pct: ((b.drift_alerts?.credits         || 0) / total) * 100 },
      { name: 'Benchmark Comparisons',credits: b.benchmark_comparisons?.credits|| 0, count: b.benchmark_comparisons?.queries || 0, cost: 15, pct: ((b.benchmark_comparisons?.credits || 0) / total) * 100 },
    ].filter(item => item.credits > 0);
  }

  getBarHeight(credits: number): number {
    return this.maxDailyCredits > 0 ? (credits / this.maxDailyCredits) * 100 : 0;
  }

  getQueriesFromPack(credits: number): number {
    return Math.floor(credits / 12);  // avg 12 credits per query
  }

  getMonthsFromPack(credits: number): number {
    return Math.floor(credits / 650); // avg 650 credits/month
  }

  formatMonth(period: string): string {
    const [year, month] = period.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  selectPack(pack: CreditPack) {
    if (pack.id === 'enterprise') {
      alert('Contact sales@voiro.com for enterprise pricing.');
    } else {
      alert(`Redirecting to purchase ${pack.name} pack (₹${pack.price} for ${pack.credits} credits).\n\nPayment integration coming soon.`);
    }
  }

  goBack() {
    window.history.back();
  }
}
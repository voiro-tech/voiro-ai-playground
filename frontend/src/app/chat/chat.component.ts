import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const SUGGESTIONS = [
  'How did Times of India perform in March?',
  'Which campaigns are underdelivering?',
  'Compare all publishers by revenue',
  'What is inventory availability across all publishers?',
  'Full performance breakdown for NDTV',
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="logo">
          <span class="logo-name">Voiro <span class="logo-ai">AI</span></span>
          <span class="logo-tag">Intelligence Agent</span>
        </div>

        <div class="suggestions">
          <p class="section-label">Try asking</p>
          <button
            *ngFor="let q of suggestions"
            class="suggestion"
            (click)="sendSuggestion(q)"
            [disabled]="loading">
            {{ q }}
          </button>
        </div>

        <div class="sidebar-footer">
          <span class="live-dot"></span>
          <span class="live-label">Demo · Jan–Apr 2024</span>
          <p class="pub-list">Times of India · Hindustan Times · NDTV</p>
        </div>
      </aside>

      <!-- Chat -->
      <main class="chat">

        <header class="chat-header">
          <div>
            <h1 class="chat-title">Intelligence Agent</h1>
            <span class="chat-sub">Revenue Operations Copilot</span>
          </div>
          <button class="new-btn" (click)="clear()">New conversation</button>
        </header>

        <div class="messages" #msgContainer>

          <!-- Empty state -->
          <div class="empty" *ngIf="messages.length === 0">
            <div class="empty-icon">◎</div>
            <h2>Ask anything about your revenue</h2>
            <p>Query publisher performance, spot underdelivering campaigns,<br>check inventory — in plain language.</p>
          </div>

          <!-- Messages -->
          <div *ngFor="let m of messages"
               class="row"
               [class.row-user]="m.role === 'user'"
               [class.row-ai]="m.role === 'assistant'">

            <div class="avatar avatar-ai" *ngIf="m.role === 'assistant'">V</div>

            <div class="bubble"
                 [class.bubble-user]="m.role === 'user'"
                 [class.bubble-ai]="m.role === 'assistant'">
              <div class="dots" *ngIf="m.loading">
                <span></span><span></span><span></span>
              </div>
              <div *ngIf="!m.loading"
                   class="text"
                   [innerHTML]="fmt(m.content)">
              </div>
              <div class="time" *ngIf="!m.loading">{{ m.timestamp | date:'HH:mm' }}</div>
            </div>

            <div class="avatar avatar-user" *ngIf="m.role === 'user'">U</div>
          </div>

        </div>

        <!-- Input -->
        <div class="input-area">
          <div class="input-box" [class.focused]="focused">
            <textarea
              #inputEl
              [(ngModel)]="input"
              (keydown.enter)="onEnter($event)"
              (focus)="focused = true"
              (blur)="focused = false"
              (input)="resize($event)"
              [disabled]="loading"
              placeholder="Ask about revenue, campaigns, inventory..."
              rows="1"
              class="textarea">
            </textarea>
            <button class="send" (click)="send()" [disabled]="!input.trim() || loading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p class="hint">Enter to send · Shift+Enter for new line</p>
        </div>

      </main>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      display: flex;
      height: 100vh;
      background: #0f1117;
      color: #e2e8f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 256px;
      min-width: 256px;
      background: #131720;
      border-right: 1px solid #1c2338;
      display: flex;
      flex-direction: column;
      padding: 24px 14px;
      gap: 28px;
    }
    .logo { display: flex; flex-direction: column; gap: 6px; padding: 0 6px; }
    .logo-name { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -.3px; }
    .logo-ai { color: #4f8ef7; }
    .logo-tag {
      font-size: 11px; color: #4f8ef7;
      background: rgba(79,142,247,.1); border: 1px solid rgba(79,142,247,.2);
      border-radius: 4px; padding: 2px 8px; width: fit-content; font-weight: 500;
    }
    .suggestions { display: flex; flex-direction: column; gap: 5px; }
    .section-label {
      font-size: 10.5px; text-transform: uppercase; letter-spacing: .8px;
      color: #374361; padding: 0 6px; margin-bottom: 4px;
    }
    .suggestion {
      background: none; border: 1px solid #1c2338; border-radius: 8px;
      color: #7a8fb8; font-size: 12.5px; padding: 9px 11px;
      text-align: left; cursor: pointer; line-height: 1.4;
      transition: all .15s; font-family: inherit;
    }
    .suggestion:hover:not(:disabled) { background: #1c2338; color: #b8c8e8; }
    .suggestion:disabled { opacity: .35; cursor: not-allowed; }
    .sidebar-footer { margin-top: auto; padding: 0 6px; display: flex; flex-direction: column; gap: 5px; }
    .live-dot {
      display: inline-block; width: 6px; height: 6px;
      border-radius: 50%; background: #3a9e6a; margin-right: 6px;
    }
    .live-label { font-size: 11.5px; color: #3a9e6a; }
    .pub-list { font-size: 10.5px; color: #2a384f; line-height: 1.6; margin-top: 2px; }

    /* ── Chat ── */
    .chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 28px; border-bottom: 1px solid #1c2338; flex-shrink: 0;
    }
    .chat-title { font-size: 16px; font-weight: 600; color: #fff; }
    .chat-sub { font-size: 12px; color: #374361; }
    .new-btn {
      background: none; border: 1px solid #1c2338; border-radius: 6px;
      color: #4a5a7a; font-size: 12px; padding: 6px 13px;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .new-btn:hover { border-color: #2a3450; color: #7a8fb8; }

    /* ── Messages ── */
    .messages {
      flex: 1; overflow-y: auto; padding: 28px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .messages::-webkit-scrollbar { width: 3px; }
    .messages::-webkit-scrollbar-thumb { background: #1c2338; border-radius: 2px; }

    .empty {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 14px; text-align: center; padding: 60px 40px; color: #374361;
    }
    .empty-icon { font-size: 36px; color: #1c2338; }
    .empty h2 { font-size: 19px; font-weight: 600; color: #5a6a8a; }
    .empty p { font-size: 13.5px; line-height: 1.6; max-width: 360px; }

    .row { display: flex; align-items: flex-start; gap: 10px; max-width: 800px; }
    .row-user { flex-direction: row-reverse; margin-left: auto; }
    .row-ai   { margin-right: auto; }

    .avatar {
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .avatar-ai   { background: linear-gradient(135deg, #1b4a8a, #4f8ef7); color: #fff; }
    .avatar-user { background: #1c2338; color: #4a5a7a; }

    .bubble { padding: 12px 16px; border-radius: 12px; max-width: 660px; line-height: 1.65; }
    .bubble-user { background: #18213a; color: #c0d0f0; font-size: 13.5px; border-bottom-right-radius: 3px; }
    .bubble-ai   { background: #13172a; border: 1px solid #1c2338; color: #ccd8f0; font-size: 13.5px; border-bottom-left-radius: 3px; }

    .text { white-space: pre-wrap; word-break: break-word; }
    .text strong { color: #fff; font-weight: 600; }
    .text em     { color: #7a8fb8; }
    .text code   { background: #1c2338; padding: 1px 5px; border-radius: 4px; font-size: 12.5px; color: #7ab8ff; }

    .time { font-size: 10px; color: #2a384f; margin-top: 7px; }

    /* ── Loading dots ── */
    .dots { display: flex; gap: 4px; align-items: center; padding: 3px 0; }
    .dots span {
      width: 5px; height: 5px; border-radius: 50%; background: #4f8ef7;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .dots span:nth-child(2) { animation-delay: .2s; }
    .dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes pulse {
      0%, 80%, 100% { transform: scale(.6); opacity: .4; }
      40%           { transform: scale(1);  opacity: 1; }
    }

    /* ── Input ── */
    .input-area { padding: 16px 28px 20px; border-top: 1px solid #1c2338; flex-shrink: 0; }
    .input-box {
      display: flex; align-items: flex-end; gap: 8px;
      background: #13172a; border: 1px solid #1c2338;
      border-radius: 11px; padding: 10px 12px; transition: border-color .15s;
    }
    .input-box.focused { border-color: #2a3a6a; }
    .textarea {
      flex: 1; background: none; border: none; outline: none;
      color: #e2e8f8; font-size: 13.5px; font-family: inherit;
      resize: none; max-height: 120px; line-height: 1.5;
    }
    .textarea::placeholder { color: #2a384f; }
    .send {
      width: 34px; height: 34px; border-radius: 7px;
      background: #1b4a8a; border: none; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .15s;
    }
    .send:hover:not(:disabled) { background: #2560b0; }
    .send:disabled { background: #1c2338; color: #2a384f; cursor: not-allowed; }
    .hint { font-size: 10.5px; color: #1c2338; margin-top: 7px; text-align: center; }
  `]
})
export class ChatComponent {
  @ViewChild('msgContainer') private msgContainer!: ElementRef;
  @ViewChild('inputEl')      private inputEl!: ElementRef;

  messages: Message[] = [];
  input    = '';
  loading  = false;
  focused  = false;
  suggestions = SUGGESTIONS;

  constructor(private http: HttpClient) {}

  onEnter(e: KeyboardEvent) {
    if (!e.shiftKey) { e.preventDefault(); this.send(); }
  }

  resize(e: Event) {
    const t = e.target as HTMLTextAreaElement;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
  }

  sendSuggestion(q: string) { this.input = q; this.send(); }

  send() {
    const content = this.input.trim();
    if (!content || this.loading) return;

    this.messages.push({ role: 'user', content, timestamp: new Date() });
    this.input = '';
    if (this.inputEl) this.inputEl.nativeElement.style.height = 'auto';

    const loader: Message = { role: 'assistant', content: '', timestamp: new Date(), loading: true };
    this.messages.push(loader);
    this.loading = true;
    this.scrollBottom();

    // Build history for API — exclude the loading placeholder
    const apiMessages = this.messages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, content: m.content }));

    this.http.post<{ reply: string }>(
      `${environment.apiUrl}/api/chat`,
      { messages: apiMessages }
    ).subscribe({
      next: (res) => {
        const idx = this.messages.indexOf(loader);
        if (idx !== -1) {
          this.messages[idx] = { role: 'assistant', content: res.reply, timestamp: new Date() };
        }
        this.loading = false;
        this.scrollBottom();
      },
      error: () => {
        const idx = this.messages.indexOf(loader);
        if (idx !== -1) {
          this.messages[idx] = {
            role: 'assistant',
            content: 'Something went wrong. Please check the API connection and try again.',
            timestamp: new Date()
          };
        }
        this.loading = false;
        this.scrollBottom();
      }
    });
  }

  clear() { this.messages = []; }

  fmt(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,     '<em>$1</em>')
      .replace(/`(.*?)`/g,       '<code>$1</code>');
  }

  private scrollBottom() {
    setTimeout(() => {
      if (this.msgContainer) {
        const el = this.msgContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}

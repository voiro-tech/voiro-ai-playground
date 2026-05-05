import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="login-shell">
      <div class="login-card">

        <!-- Logo -->
        <div class="login-logo">
          <span class="logo-name">Voiro <span class="logo-ai">AI</span></span>
          <span class="logo-tag">Intelligence Agent</span>
        </div>

        <h1 class="login-title">Sign in</h1>
        <p class="login-sub">Enter your credentials to access Voiro AI</p>

        <!-- Error -->
        <div class="error-box" *ngIf="error">
          <span>⚠</span> {{ error }}
        </div>

        <!-- Form -->
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            type="email"
            class="form-input"
            [(ngModel)]="email"
            (keydown.enter)="login()"
            placeholder="you@voiro.com"
            [disabled]="loading"
            autocomplete="email" />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            type="password"
            class="form-input"
            [(ngModel)]="password"
            (keydown.enter)="login()"
            placeholder="••••••••"
            [disabled]="loading"
            autocomplete="current-password" />
        </div>

        <button
          class="login-btn"
          (click)="login()"
          [disabled]="loading || !email || !password">
          <span *ngIf="!loading">Sign in</span>
          <span *ngIf="loading" class="btn-loading">
            <span></span><span></span><span></span>
          </span>
        </button>

        <p class="login-footer">
          Access is by invitation only.<br>
          Contact your Voiro administrator to request access.
        </p>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .login-shell {
      min-height: 100vh;
      background: #0f1117;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
    }

    .login-card {
      background: #131720;
      border: 1px solid #1c2338;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .login-logo {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }
    .logo-name { font-size: 24px; font-weight: 700; color: #fff; }
    .logo-ai   { color: #4f8ef7; }
    .logo-tag  {
      font-size: 11px; color: #4f8ef7;
      background: rgba(79,142,247,.1);
      border: 1px solid rgba(79,142,247,.2);
      border-radius: 4px; padding: 2px 8px;
      width: fit-content; font-weight: 500;
    }

    .login-title { font-size: 22px; font-weight: 700; color: #fff; }
    .login-sub   { font-size: 13px; color: #4a5a7a; margin-top: -12px; }

    .error-box {
      background: rgba(239,68,68,.1);
      border: 1px solid rgba(239,68,68,.3);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      color: #fca5a5;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12.5px; font-weight: 500; color: #7a8fb8; }
    .form-input {
      background: #0f1117;
      border: 1px solid #1c2338;
      border-radius: 8px;
      padding: 11px 14px;
      font-size: 14px;
      color: #e2e8f8;
      font-family: inherit;
      outline: none;
      transition: border-color .15s;
    }
    .form-input:focus   { border-color: #2a3a6a; }
    .form-input:disabled{ opacity: .5; cursor: not-allowed; }
    .form-input::placeholder { color: #2a384f; }

    .login-btn {
      background: #1b4a8a;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      padding: 12px;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s;
      margin-top: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 44px;
    }
    .login-btn:hover:not(:disabled) { background: #2560b0; }
    .login-btn:disabled { background: #1c2338; color: #3a4a5e; cursor: not-allowed; }

    .btn-loading {
      display: flex; gap: 4px; align-items: center;
    }
    .btn-loading span {
      width: 5px; height: 5px; border-radius: 50%;
      background: #4f8ef7;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .btn-loading span:nth-child(2) { animation-delay: .2s; }
    .btn-loading span:nth-child(3) { animation-delay: .4s; }
    @keyframes pulse {
      0%,80%,100% { transform: scale(.6); opacity: .4; }
      40%          { transform: scale(1);  opacity: 1; }
    }

    .login-footer {
      font-size: 11.5px;
      color: #374361;
      text-align: center;
      line-height: 1.6;
    }
  `]
})
export class LoginComponent {
  email    = '';
  password = '';
  loading  = false;
  error    = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password || this.loading) return;
    this.loading = true;
    this.error   = '';

    this.auth.login(this.email, this.password, environment.apiUrl).subscribe({
        next: () => {
        this.loading = false;
        this.router.navigate(['/']);
        },
        error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Invalid email or password. Please try again.';
        }
    });
  }
}
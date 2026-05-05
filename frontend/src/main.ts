import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { ChatComponent } from './app/chat/chat.component';
import { BillingComponent } from './app/billing/billing.component';
import { LoginComponent } from './app/login/login.component';
import { authGuard } from './app/auth.guard';

const routes: Routes = [
  { path: 'login',   component: LoginComponent },
  { path: '',        component: ChatComponent,   canActivate: [authGuard] },
  { path: 'billing', component: BillingComponent, canActivate: [authGuard] },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
  ]
}).catch(err => console.error(err));
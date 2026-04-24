import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app/app.component';
import { ChatComponent } from './app/chat/chat.component';
import { BillingComponent } from './app/billing/billing.component';

const routes: Routes = [
  { path: '',        component: ChatComponent },
  { path: 'billing', component: BillingComponent },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
  ]
}).catch(err => console.error(err));
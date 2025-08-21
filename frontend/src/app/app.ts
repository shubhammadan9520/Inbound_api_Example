import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AdminComponent } from './admin/admin';
import { DynamicUiComponent } from './dynamic-ui/dynamic-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AdminComponent, DynamicUiComponent, HttpClientModule],
  template: `
    <div style="padding: 20px;">
      <h1>Schema Mapper Demo</h1>
      <app-admin></app-admin>
      <app-dynamic-ui></app-dynamic-ui>
    </div>
  `,
  styles: []
})
export class AppComponent {}
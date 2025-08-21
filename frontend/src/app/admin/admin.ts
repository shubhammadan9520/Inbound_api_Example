import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2>Admin UI: Add Mapping</h2>
    <mat-form-field>
      <input matInput placeholder="Client ID" [(ngModel)]="mapping.client_id">
    </mat-form-field>
    <mat-form-field>
      <input matInput placeholder="Internal Field" [(ngModel)]="mapping.internal_field">
    </mat-form-field>
    <mat-form-field>
      <input matInput placeholder="Client Field" [(ngModel)]="mapping.client_field">
    </mat-form-field>
    <mat-form-field>
      <mat-select placeholder="Direction" [(ngModel)]="mapping.direction">
        <mat-option value="both">Both</mat-option>
        <mat-option value="inbound">Inbound</mat-option>
        <mat-option value="outbound">Outbound</mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field>
      <input matInput placeholder="Transform (e.g., uppercase)" [(ngModel)]="mapping.transform">
    </mat-form-field>
    <button mat-raised-button color="primary" (click)="addMapping()">Add Mapping</button>
  `,
})
export class AdminComponent {
  mapping = { client_id: '', internal_field: '', client_field: '', direction: 'both', transform: '' };

  constructor(private http: HttpClient) {}

  addMapping() {
    this.http.post('http://localhost:3000/mappings', this.mapping).subscribe(
      response => alert('Mapping added successfully!'),
      error => alert('Error: ' + error.message)
    );
  }
}
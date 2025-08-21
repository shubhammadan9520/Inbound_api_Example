import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dynamic-ui',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2>Dynamic UI: Manage Client Data</h2>
    <mat-form-field>
      <input matInput placeholder="Client ID" [(ngModel)]="clientId">
    </mat-form-field>
    <button mat-raised-button color="primary" (click)="loadFormFields()">Load Dynamic Form</button>
    <button mat-raised-button color="accent" (click)="fetchAndSyncInboundData()" style="margin-left: 10px;">Fetch and Sync Inbound Data</button>
    <form *ngIf="formFields.length">
      <div *ngFor="let field of formFields">
        <mat-form-field>
          <input matInput [placeholder]="field" [(ngModel)]="formData[field]" [ngModelOptions]="{standalone: true}">
        </mat-form-field>
      </div>
      <button mat-raised-button color="primary" (click)="submitForm()">Submit to Both Tables</button>
      <button mat-raised-button color="warn" (click)="submitToClientOnly()" style="margin-left: 10px;">Submit to Client Person Only</button>
    </form>
    <h3 *ngIf="syncedData.length">Synced Data for Client: {{ clientId }}</h3>
    <div *ngFor="let record of syncedData">
      <pre>{{ record | json }}</pre>
    </div>
  `,
})
export class DynamicUiComponent implements OnInit {
  clientId = '';
  formFields: string[] = [];
  formData: any = {};
  syncedData: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Optionally load default
  }

  loadFormFields() {
    this.http.get('http://localhost:3000/client-schema').subscribe(
      (fields: any) => {
        this.formFields = fields;
        this.formData = {};
        fields.forEach((field: string) => this.formData[field] = '');
      },
      error => alert('Error loading form fields: ' + error.message)
    );
  }

  fetchAndSyncInboundData() {
    if (!this.clientId) {
      alert('Please enter a Client ID');
      return;
    }
    this.http.get(`http://localhost:3000/sync-inbound/${this.clientId}`).subscribe(
      (response: any) => {
        this.loadSyncedData();
        alert('Inbound data synced successfully!');
      },
      error => alert('Error syncing inbound data: ' + error.message)
    );
  }

  submitForm() {
    if (!this.clientId) {
      alert('Please enter a Client ID');
      return;
    }
    this.http.post(`http://localhost:3000/post-data/${this.clientId}`, this.formData).subscribe(
      response => {
        alert('Data submitted to both tables successfully!');
        this.loadSyncedData();
      },
      error => alert('Error submitting data: ' + error.message)
    );
  }

  submitToClientOnly() {
    if (!this.clientId) {
      alert('Please enter a Client ID');
      return;
    }
    this.http.post(`http://localhost:3000/post-to-client/${this.clientId}`, this.formData).subscribe(
      response => {
        alert('Data submitted to client_person successfully!');
        this.loadSyncedData();
      },
      error => alert('Error submitting data to client_person: ' + error.message)
    );
  }

  loadSyncedData() {
    this.http.get(`http://localhost:3000/internal-person/${this.clientId}`).subscribe(
      (data: any) => this.syncedData = data,
      error => alert('Error loading synced data: ' + error.message)
    );
  }
}
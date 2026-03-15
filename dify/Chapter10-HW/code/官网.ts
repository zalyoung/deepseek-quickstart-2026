// chat-message.interface.ts
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  mode: 'standard' | 'reasoning';
  isSearchEnhanced?: boolean;
  reasoningSteps?: string[]; // For reasoning mode
}

// api-key.interface.ts
export interface APIKey {
  id: string;
  key: string;
  createdAt: Date;
  isActive: boolean;
  usage: {
    tokens: number;
    requests: number;
  };
  permissions?: string[]; // For future permission control
  expiresAt?: Date; // For expiration policy
}

// user-settings.interface.ts
export interface UserSettings {
  theme: 'light' | 'dark';
  defaultMode: 'standard' | 'reasoning';
  enableSearch: boolean;
  language?: 'en' | 'zh'; // For future i18n support
}

// chat.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from './chat-message.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messages: ChatMessage[] = [];
  private messageSubject = new Subject<ChatMessage>();

  sendMessage(content: string, mode: 'standard' | 'reasoning', isSearchEnhanced = false): Observable<ChatMessage> {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
      mode,
      isSearchEnhanced
    };
    this.messages.unshift(userMessage);
    this.messageSubject.next(userMessage);
    
    // Simulate SSE response
    return new Observable(observer => {
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: this.generateId(),
          content: this.generateResponse(content, mode),
          role: 'assistant',
          timestamp: new Date(),
          mode,
          isSearchEnhanced
        };
        if (mode === 'reasoning') {
          assistantMessage.reasoningSteps = [
            'Analyzing user intent...',
            'Retrieving relevant knowledge...',
            'Constructing response...'
          ];
        }
        this.messages.unshift(assistantMessage);
        observer.next(assistantMessage);
        observer.complete();
      }, 300); // Simulate TTFB < 500ms
    });
  }

  getMessages(): ChatMessage[] {
    return [...this.messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private generateResponse(input: string, mode: 'standard' | 'reasoning'): string {
    return mode === 'reasoning' 
      ? `Based on thorough analysis: ${input} relates to...` 
      : `Response to: ${input}`;
  }
}

// api-key.service.ts
import { Injectable } from '@angular/core';
import { APIKey } from './api-key.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private apiKeys: APIKey[] = [];

  createKey(): APIKey {
    const newKey: APIKey = {
      id: this.generateId(),
      key: this.generateApiKey(),
      createdAt: new Date(),
      isActive: true,
      usage: { tokens: 0, requests: 0 }
    };
    this.apiKeys.push(newKey);
    return newKey;
  }

  getKeys(): APIKey[] {
    return [...this.apiKeys];
  }

  toggleKeyStatus(id: string): void {
    const key = this.apiKeys.find(k => k.id === id);
    if (key) key.isActive = !key.isActive;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private generateApiKey(): string {
    return `sk-${Math.random().toString(36).substring(2, 18)}`;
  }
}

// chat.component.ts
import { Component, OnInit } from '@angular/core';
import { ChatService } from './chat.service';
import { ChatMessage } from './chat-message.interface';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  newMessage = '';
  currentMode: 'standard' | 'reasoning' = 'standard';
  isSearchEnhanced = false;
  isLoading = false;
  showReasoning = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.messages = this.chatService.getMessages();
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    this.isLoading = true;
    this.chatService.sendMessage(this.newMessage, this.currentMode, this.isSearchEnhanced)
      .subscribe({
        this.isLoading = false;
        this.newMessage = '';
      });
  }

  toggleMode(): void {
    this.currentMode = this.currentMode === 'standard' ? 'reasoning' : 'standard';
  }

  toggleSearch(): void {
    this.isSearchEnhanced = !this.isSearchEnhanced;
  }
}

// chat.component.html
<div class="chat-container">
  <div class="sidebar">
    <button class="new-chat-btn">New Chat</button>
    <div class="history-list">
      <div *ngFor="let msg of messages" class="history-item">
        {{ msg.content | truncate:30 }}
      </div>
    </div>
  </div>

  <div class="chat-area">
    <div class="message-container">
      <div *ngFor="let msg of messages" [class.user]="msg.role === 'user'" class="message">
        <div class="content" [innerHTML]="msg.content | markdown"></div>
        <div *ngIf="msg.reasoningSteps && showReasoning" class="reasoning">
          <div *ngFor="let step of msg.reasoningSteps">{{ step }}</div>
        </div>
      </div>
      <div *ngIf="isLoading" class="loading">Thinking...</div>
    </div>

    <div class="input-area">
      <div class="controls">
        <button (click)="toggleMode()">{{ currentMode | titlecase }} Mode</button>
        <label>
          <input type="checkbox" [(ngModel)]="isSearchEnhanced">
          Web Search
        </label>
        <button *ngIf="currentMode === 'reasoning'" (click)="showReasoning = !showReasoning">
          {{ showReasoning ? 'Hide' : 'Show' }} Reasoning
        </button>
      </div>
      <textarea [(ngModel)]="newMessage" (keydown.enter)="sendMessage()"></textarea>
      <button (click)="sendMessage()">Send</button>
    </div>
  </div>
</div>

// markdown.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import * as marked from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    // Configure marked for code highlighting
    marked.setOptions({
      highlight: (code, lang) => {
        const hljs = require('highlight.js');
        return lang 
          ? hljs.highlight(lang, code).value 
          : hljs.highlightAuto(code).value;
      }
    });
    return this.sanitizer.bypassSecurityTrustHtml(marked.parse(value));
  }
}
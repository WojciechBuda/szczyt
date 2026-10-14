export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  order: number;
  isVisible: boolean;
}

export interface ChatbotSettings {
  enabled: boolean;
  provider: 'anthropic' | 'openai';
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
}

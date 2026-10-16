export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Faq {
  id: number;
  question: string;
  questionEn?: string | null;
  answer: string;
  answerEn?: string | null;
  order: number;
  isVisible: boolean;
}

export interface ChatbotSettings {
  enabled: boolean;
  provider: 'anthropic' | 'openai';
  model: string;
  systemPrompt: string;
  welcomeMessage: string;
  welcomeMessageEn?: string | null;
}

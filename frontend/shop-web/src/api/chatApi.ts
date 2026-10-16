import { supabase } from '../lib/supabaseClient';
import { ChatMessage, Faq, ChatbotSettings } from '../types/Chat';

interface FaqRow {
  id: number;
  question: string;
  question_en: string | null;
  answer: string;
  answer_en: string | null;
  order: number;
  is_visible: boolean;
}

function toFaq(row: FaqRow): Faq {
  return { id: row.id, question: row.question, questionEn: row.question_en, answer: row.answer, answerEn: row.answer_en, order: row.order, isVisible: row.is_visible };
}

export const chatApi = {
  /** Sends the full conversation so far to the chat-support Edge Function and returns the assistant's reply. */
  sendMessage: async (messages: ChatMessage[], lang: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('chat-support', { body: { messages, lang } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.reply as string;
  },

  /** Public — just enough for the widget to greet the visitor without calling the AI. */
  getPublicSettings: async (): Promise<{ enabled: boolean; welcomeMessage: string; welcomeMessageEn: string | null }> => {
    const { data, error } = await supabase.from('chatbot_public_settings').select('enabled, welcome_message, welcome_message_en').single();
    if (error) throw error;
    return { enabled: data.enabled, welcomeMessage: data.welcome_message, welcomeMessageEn: data.welcome_message_en };
  },

  // Visible FAQ list — shown as quick-suggestion chips in the widget, and on any FAQ page.
  listVisibleFaqs: async (): Promise<Faq[]> => {
    const { data, error } = await supabase.from('faqs').select('id, question, question_en, answer, answer_en, order, is_visible').eq('is_visible', true).order('order');
    if (error) throw error;
    return (data as FaqRow[]).map(toFaq);
  },

  // Admin
  listAllFaqs: async (): Promise<Faq[]> => {
    const { data, error } = await supabase.from('faqs').select('id, question, question_en, answer, answer_en, order, is_visible').order('order');
    if (error) throw error;
    return (data as FaqRow[]).map(toFaq);
  },

  saveFaqs: async (faqs: Faq[]): Promise<void> => {
    const toKeepIds = faqs.filter((f) => f.id > 0).map((f) => f.id);

    // Delete FAQs the admin removed from the list.
    if (toKeepIds.length > 0) {
      const { error: deleteError } = await supabase.from('faqs').delete().not('id', 'in', `(${toKeepIds.join(',')})`);
      if (deleteError) throw deleteError;
    } else {
      const { error: deleteError } = await supabase.from('faqs').delete().gte('id', 0);
      if (deleteError) throw deleteError;
    }

    const newOnes = faqs.filter((f) => f.id <= 0);
    const existingOnes = faqs.filter((f) => f.id > 0);

    if (existingOnes.length > 0) {
      const results = await Promise.all(
        existingOnes.map((f) =>
          supabase.from('faqs').update({ question: f.question, answer: f.answer, order: f.order, is_visible: f.isVisible }).eq('id', f.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    }

    if (newOnes.length > 0) {
      const { error } = await supabase.from('faqs').insert(
        newOnes.map((f) => ({ question: f.question, answer: f.answer, order: f.order, is_visible: f.isVisible }))
      );
      if (error) throw error;
    }
  },

  getSettings: async (): Promise<ChatbotSettings> => {
    const { data, error } = await supabase.from('chatbot_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return {
      enabled: data.enabled,
      provider: data.provider,
      model: data.model,
      systemPrompt: data.system_prompt,
      welcomeMessage: data.welcome_message,
    };
  },

  updateSettings: async (settings: ChatbotSettings): Promise<void> => {
    const { error } = await supabase.from('chatbot_settings').upsert({
      id: 1,
      enabled: settings.enabled,
      provider: settings.provider,
      model: settings.model,
      system_prompt: settings.systemPrompt,
      welcome_message: settings.welcomeMessage,
    });
    if (error) throw error;
  },
};

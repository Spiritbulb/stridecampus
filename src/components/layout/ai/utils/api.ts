import { Message } from '../types';
import { buildContextPrompt } from './prompts';
import { User } from '@/utils/supabaseClient';

export const sendMessageToAI = async (userInput: string, messages: Message[], user: User | null = null): Promise<string> => {
  const contextualPrompt = buildContextPrompt(userInput, messages, user);
  
  const response = await fetch('https://stride-media-api.spiritbulb.workers.dev/ai/text-generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: contextualPrompt,
      model: '@cf/meta/llama-2-7b-chat-int8',
      max_tokens: 250,
      temperature: 0.8
    })
  });

  if (!response.ok) {
    console.log(`Api failed ${response.status}`);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return parseAIResponse(data);
};

const parseAIResponse = (data: any): string => {
  let aiResponse = data.response?.response || data.response || 
                  data.result?.response || data.result?.text || 
                  data.text || data.result || data;
  
  if (typeof aiResponse !== 'string') {
    aiResponse = aiResponse?.response || aiResponse?.text || aiResponse?.content || 
                aiResponse?.message || JSON.stringify(aiResponse) || '';
  }
  
  aiResponse = aiResponse.replace(/^Nia:\s*/i, '').trim();
  
  return aiResponse || "Eish, I'm speechless rn 💀 Try again?";
};
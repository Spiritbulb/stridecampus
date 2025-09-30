import { Message } from '../types';
import { buildContextPrompt } from './prompts';
import { User } from '@/utils/supabaseClient';
import { API_CONFIG, secureFetch, apiRateLimiter, sanitizeInput, INPUT_VALIDATION } from '@/config/security';

export const sendMessageToAI = async (userInput: string, messages: Message[], user: User | null = null): Promise<string> => {
  // Rate limiting check
  if (!apiRateLimiter.isAllowed()) {
    throw new Error('Rate limit exceeded. Please wait before sending another message.');
  }

  // Sanitize user input
  const sanitizedInput = sanitizeInput(userInput, INPUT_VALIDATION.MAX_STRING_LENGTH);
  if (!sanitizedInput) {
    throw new Error('Invalid input provided');
  }

  const contextualPrompt = await buildContextPrompt(sanitizedInput, messages, user);
  
  try {
    const response = await secureFetch(`${API_CONFIG.BASE_URL}/ai/text-generation`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: contextualPrompt,
        model: '@cf/openai/gpt-oss-120b',
        max_tokens: 250,
        temperature: 0.8,
        stream: false
      })
    });

    if (!response.ok) {
      console.log(`Api failed ${response.status}`);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return parseAIResponse(data);
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};

export const sendMessageToAIStream = async (
  userInput: string, 
  messages: Message[], 
  user: User | null = null,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<void> => {
  // Rate limiting check
  if (!apiRateLimiter.isAllowed()) {
    onError(new Error('Rate limit exceeded. Please wait before sending another message.'));
    return;
  }

  // Sanitize user input
  const sanitizedInput = sanitizeInput(userInput, INPUT_VALIDATION.MAX_STRING_LENGTH);
  if (!sanitizedInput) {
    onError(new Error('Invalid input provided'));
    return;
  }

  const contextualPrompt = await buildContextPrompt(sanitizedInput, messages, user);
  
  try {
    const response = await secureFetch(`${API_CONFIG.BASE_URL}/ai/text-generation`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: contextualPrompt,
        model: '@cf/openai/gpt-oss-120b',
        max_tokens: 250,
        temperature: 0.8,
        stream: true
      })
    });

    if (!response.ok) {
      console.log(`Api failed ${response.status}`);
      onError(new Error(`API request failed with status ${response.status}`));
      return;
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      onError(new Error('No response body available'));
      return;
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in buffer as it might be incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Handle different streaming formats
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              if (jsonStr === '[DONE]') {
                // End of stream
                break;
              }
              
              const data = JSON.parse(jsonStr);
              const textChunk = data.data?.response?.response || 
                              data.data?.response || 
                              data.response?.response || 
                              data.response || 
                              data.result?.response || 
                              data.result?.text || 
                              data.text || 
                              data.result || 
                              data.choices?.[0]?.delta?.content ||
                              data.choices?.[0]?.text ||
                              '';
              
              if (typeof textChunk === 'string' && textChunk.length > 0) {
                console.log('Streaming chunk received:', textChunk);
                fullResponse += textChunk;
                onChunk(textChunk);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', trimmedLine, parseError);
              // Skip invalid JSON lines
              continue;
            }
          } else if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
            // Handle direct JSON objects
            try {
              const data = JSON.parse(trimmedLine);
              const textChunk = data.data?.response?.response || 
                              data.data?.response || 
                              data.response?.response || 
                              data.response || 
                              data.result?.response || 
                              data.result?.text || 
                              data.text || 
                              data.result || 
                              data.choices?.[0]?.delta?.content ||
                              data.choices?.[0]?.text ||
                              '';
              
              if (typeof textChunk === 'string' && textChunk.length > 0) {
                console.log('Streaming JSON chunk received:', textChunk);
                fullResponse += textChunk;
                onChunk(textChunk);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming JSON:', trimmedLine, parseError);
              continue;
            }
          }
        }
      }
      
      // Clean up the response
      const cleanedResponse = parseAIResponse({ response: fullResponse });
      onComplete(cleanedResponse);
      
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    console.error('AI Streaming API Error:', error);
    onError(error as Error);
  }
};

const parseAIResponse = (data: any): string => {
  let aiResponse = data.data?.response?.response || 
                  data.data?.response || 
                  data.response?.response || 
                  data.response || 
                  data.result?.response || 
                  data.result?.text || 
                  data.text || 
                  data.result || 
                  data;
  
  if (typeof aiResponse !== 'string') {
    aiResponse = aiResponse?.response || aiResponse?.text || aiResponse?.content || 
                aiResponse?.message || JSON.stringify(aiResponse) || '';
  }
  
  aiResponse = aiResponse.replace(/^Nia:\s*/i, '').trim();
  
  return aiResponse || "Eish, I'm speechless rn 💀 Try again?";
};
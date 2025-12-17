import { GoogleGenAI, Type } from "@google/genai";
import Constants from 'expo-constants';

// Initialize Gemini with API key from Expo constants
const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates book details from a simple title query using Gemini.
 */
export const generateBookDetails = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide details for the book or topic: "${query}". Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            genre: { type: Type.STRING },
            description: { type: Type.STRING },
            pages: { type: Type.INTEGER },
          },
          required: ["title", "author", "genre", "description", "pages"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini generateBookDetails error:", error);
    throw error;
  }
};

/**
 * Chat with the AI Librarian.
 */
export const chatWithLibrarian = async (history: { role: string; parts: { text: string }[] }[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are Shoseki, a knowledgeable, warm, and cozy librarian assistant. 
        Your goal is to help users find books, discuss literature, and manage their reading lists.
        Keep your tone calm, intellectual, yet inviting. Use metaphors involving books, tea, and quiet corners where appropriate.
        Keep responses concise (under 100 words) unless asked for a detailed summary.`,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "I apologize, I seem to have lost my train of thought. Please try again.";
  }
};

/**
 * Suggest a reading list based on a mood.
 */
export const suggestBooksByMood = async (mood: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 3 books for a reader who is feeling "${mood}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
};
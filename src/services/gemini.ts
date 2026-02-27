import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

export interface ImagePart {
  mimeType: string;
  data: string; // base64
}

export const getGeminiResponse = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemInstruction?: string,
  lastMessageImages?: ImagePart[]
) => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY / VITE_GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = messages.map((m, i) => {
    const isLastUser = i === messages.length - 1 && m.role === 'user';
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
      { text: m.content || '(无文字)' }
    ];
    if (isLastUser && lastMessageImages?.length) {
      for (const img of lastMessageImages) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
    }
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts,
    };
  });

  const model = ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents,
    config: {
      systemInstruction: systemInstruction || "你是一个专业的中国法律助手。请用简洁、专业且易懂的语言回答用户的法律问题。如果问题涉及复杂的法律诉讼，请建议用户咨询专业律师。用户可能附带图片，请结合图片内容回答。",
    }
  });

  const response = await model;
  return response.text || "抱歉，我无法生成回复。";
};

export const generateChatTitle = async (messages: { role: 'user' | 'assistant', content: string }[]) => {
  if (!apiKey) return "新对话";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `根据以下对话内容，生成一个简短的标题（不超过10个字）：\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "你是一个标题生成器。只返回标题文本，不要有任何解释或标点符号。",
    }
  });

  return response.text?.trim() || "法律咨询";
};

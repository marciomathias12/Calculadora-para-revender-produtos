
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStrategicAnalysis = async (
  analysis: AnalysisResult,
  history: ChatMessage[]
): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    Você é o consultor de importação "YUANWARE AI", especialista em Streetwear e logística China-Brasil.
    Sua personalidade é direta, profissional, agressiva mas cautelosa, focada em ROI e viabilidade de mercado.
    
    Contexto da Importação Atual:
    - Investimento Total: R$ ${analysis.totalInvestmentBRL.toFixed(2)}
    - Lucro Previsto: R$ ${analysis.totalProfitBRL.toFixed(2)}
    - ROI: ${analysis.roi.toFixed(2)}%
    - Itens: ${analysis.items.map(i => `${i.name} (Qtde: ${i.quantity})`).join(', ')}
    
    Responda em Português do Brasil. Use termos de importação como "desembaraço", "spread", "lastro", "hype".
    Seja honesto se o pacote compensa ou não. Se o ROI estiver baixo, seja crítico.
  `;

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Sem resposta do servidor.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao processar consultoria estratégica.";
  }
};

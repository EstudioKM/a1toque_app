import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { Source } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GoogleGenAI: API Key is missing. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const FAST_MODEL = 'gemini-3-flash-preview';
const POWERFUL_MODEL = 'gemini-3.1-pro-preview';

const cleanAndParseJSON = (text: any, defaultValue: any) => {
  try {
    if (!text || typeof text !== 'string') {
      return defaultValue;
    }
    
    let cleanedText = text.replace(/```json\n?|```/g, '').trim();
    if (!cleanedText || typeof cleanedText !== 'string') return defaultValue;

    const start = cleanedText.indexOf('{');
    const end = cleanedText.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
        cleanedText = cleanedText.substring(start, end + 1);
    } else if (start === -1 && !cleanedText.startsWith('{')) {
        return defaultValue;
    }

    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return defaultValue;
  }
};

const generateContentWithRetry = async (
  request: GenerateContentParameters,
  signal?: AbortSignal,
  maxRetries: number = 2
): Promise<GenerateContentResponse> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ai = getAI();
      if (!ai) throw new Error("GoogleGenAI: API Key not set");
      return await ai.models.generateContent(request);
    } catch (error: any) {
      if (signal?.aborted) {
        throw error;
      }
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("API Fatal Error");
};

export const generateNewsDraftFromTopic = async (topic: string, systemInstruction: string, searchDomains: string[] = [], signal?: AbortSignal) => {
    try {
        const domainQuery = searchDomains.length > 0 
            ? ` (${searchDomains.map(d => `site:${d}`).join(' OR ')})`
            : '';
        const searchQuery = `"${topic}"${domainQuery}`;
        
        const prompt = `Actúa como periodista deportivo de investigación. Tu objetivo es redactar una noticia veraz y contrastada sobre: "${topic}". 
          
          INSTRUCCIONES DE INVESTIGACIÓN:
          1. Utiliza la herramienta googleSearch para encontrar información reciente y confiable.
          2. Prioriza los hechos confirmados. Si hay rumores, identifícalos como tales.
          3. Busca múltiples fuentes para validar los datos clave (fechas, nombres, resultados).
          
          REGLAS DE ESTILO: ${systemInstruction}.
          
          CONSULTA DE BÚSQUEDA: ${searchQuery}.
          
          SALIDA REQUERIDA (JSON):
          { 
            "title": "Título impactante", 
            "excerpt": "Resumen breve", 
            "category": "Categoría adecuada", 
            "imageUrl": "Palabra clave para imagen", 
            "blocks": [
              {"type": "heading", "content": "Subtítulo"},
              {"type": "text", "content": "Párrafo de contenido..."},
              {"type": "quote", "content": "Cita relevante", "caption": "Autor de la cita"}
            ] 
          }`;

        const response = await generateContentWithRetry({
            model: POWERFUL_MODEL,
            contents: prompt,
            config: { tools: [{ googleSearch: {} }], temperature: 0.2 } // Menor temperatura para mayor precisión
        }, signal);
        
        const draft = cleanAndParseJSON(response.text, null);
        if (!draft) throw new Error("IA JSON fail");

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        draft.sources = groundingChunks ? groundingChunks
              .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
              .filter((s): s is Source => !!s) : [];
        
        return draft;
    } catch (error) { return null; }
};

export const generateNewsFromUrl = async (url: string, systemInstruction: string, signal?: AbortSignal) => {
    try {
        const prompt = `Reversiona esta noticia: ${url}. Estilo: ${systemInstruction}. Salida: JSON { title, excerpt, category, imageUrl, blocks }`;
        const response = await generateContentWithRetry({
            model: POWERFUL_MODEL,
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        }, signal);
        const draft = cleanAndParseJSON(response.text, null);
        if (draft) draft.sources = [{ uri: url, title: 'Original' }];
        return draft;
    } catch (error) { return null; }
};

export const generateSocialMediaContent = async (title: string, excerpt: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `CCommunity Manager experto. Crea posteo para: "${title}". Resumen: "${excerpt}". Instrucciones: ${systemInstruction}. Reglas de copy: ${copyInstruction}. JSON: { shortTitle, copy }`;
  const res = await generateContentWithRetry({ model: FAST_MODEL, contents: prompt });
  return cleanAndParseJSON(res.text, { shortTitle: "A1TOQUE", copy: "Posteo generado." });
};

export const generateSocialMediaContentFromTopic = async (topic: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `CCommunity Manager experto. Post sobre: "${topic}". Reglas: ${systemInstruction}. Copy: ${copyInstruction}. JSON: { shortTitle, copy }`;
  const res = await generateContentWithRetry({ model: FAST_MODEL, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
  return cleanAndParseJSON(res.text, { shortTitle: "A1TOQUE", copy: "Posteo generado." });
};

export const improveSocialMediaCopy = async (currentCopy: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `Mejora este copy: "${currentCopy}". Estilo: ${systemInstruction}. Reglas: ${copyInstruction}. JSON: { copy }`;
  const res = await generateContentWithRetry({ model: FAST_MODEL, contents: prompt });
  return cleanAndParseJSON(res.text, { copy: currentCopy });
};

export const summarizeArticle = async (content: string) => {
  try {
    const res = await generateContentWithRetry({ model: FAST_MODEL, contents: `Resume en 1 tweet: ${content.substring(0, 2000)}` });
    return res.text || "Sin resumen.";
  } catch (error) { return "Error IA."; }
};
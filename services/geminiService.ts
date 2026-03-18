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

const FAST_MODEL = 'gemini-3.1-flash-lite-preview';
const POWERFUL_MODEL = 'gemini-3.1-pro-preview';

const cleanAndParseJSON = (text: any, defaultValue: any) => {
  try {
    if (!text || typeof text !== 'string') {
      return defaultValue;
    }
    
    let cleanedText = text.replace(/```json\n?|```/g, '').trim();
    if (!cleanedText || typeof cleanedText !== 'string') return defaultValue;

    const start = (cleanedText || '').indexOf('{');
    const end = (cleanedText || '').lastIndexOf('}');
    
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
          
          REGLAS ESTRICTAS PARA EL TÍTULO (CRÍTICO PARA EL DISEÑO):
          1. LONGITUD MÁXIMA: El título DEBE tener entre 50 y un MÁXIMO ABSOLUTO de 80 caracteres (contando espacios).
          2. ESTILO DIRECTO: Ve al grano. Usa voz activa. Elimina palabras de relleno, artículos innecesarios o introducciones largas.
          3. IMPACTO VISUAL: Debe ser un título "punchy", con gancho, pero sin caer en el clickbait barato.
          4. FORMATO: No incluyas punto final. No uses comillas en los títulos bajo ninguna circunstancia.
          
          REGLAS DE ESTILO: ${systemInstruction}.
          CRÍTICO: Debes escribir el texto de forma natural, con espacios en blanco separando cada palabra. NUNCA escribas palabras pegadas (ejemplo incorrecto: "Elpróximo27demarzo").
          
          CONSULTA DE BÚSQUEDA: ${searchQuery}.
          
          SALIDA REQUERIDA (JSON):
          { 
            "title": "Título impactante (50-80 caracteres)", 
            "excerpt": "Resumen breve", 
            "category": "Categoría adecuada", 
            "imageUrl": "Palabra clave para imagen", 
            "blocks": [
              {"type": "heading", "content": "Subtítulo con espacios normales"},
              {"type": "text", "content": "Párrafo de contenido con espacios normales entre cada palabra..."},
              {"type": "quote", "content": "Cita relevante con espacios", "caption": "Autor de la cita"}
            ] 
          }`;

        const response = await generateContentWithRetry({
            model: POWERFUL_MODEL,
            contents: prompt,
            config: { 
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json"
            }
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
        const prompt = `Reversiona esta noticia: ${url}. Estilo: ${systemInstruction}. 
        
        REGLAS ESTRICTAS PARA EL TÍTULO (CRÍTICO PARA EL DISEÑO):
        1. LONGITUD MÁXIMA: El título DEBE tener entre 50 y un MÁXIMO ABSOLUTO de 80 caracteres (contando espacios).
        2. ESTILO DIRECTO: Ve al grano. Usa voz activa. Elimina palabras de relleno, artículos innecesarios o introducciones largas.
        3. IMPACTO VISUAL: Debe ser un título "punchy", con gancho, pero sin caer en el clickbait barato.
        4. FORMATO: No incluyas punto final. No uses comillas en los títulos bajo ninguna circunstancia.
        
        CRÍTICO: Escribe el texto de forma natural, con espacios en blanco separando cada palabra. NUNCA escribas palabras pegadas.
        Salida: JSON { "title": "Título (50-80 caracteres)", "excerpt": "Resumen", "category": "Categoría", "imageUrl": "Palabra clave", "blocks": [...] }`;
        const response = await generateContentWithRetry({
            model: POWERFUL_MODEL,
            contents: prompt,
            config: { 
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json"
            }
        }, signal);
        const draft = cleanAndParseJSON(response.text, null);
        if (draft) draft.sources = [{ uri: url, title: 'Original' }];
        return draft;
    } catch (error) { return null; }
};

export const generateSocialMediaContentFast = async (title: string, excerpt: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `Actúa como un Community Manager experto y estratega de contenido. 
  Tu objetivo es crear un posteo de alto impacto para redes sociales basado EXCLUSIVAMENTE en la información proporcionada:
  Título: "${title}"
  Resumen: "${excerpt}"
  
  INSTRUCCIONES OBLIGATORIAS:
  1. NO busques información adicional en internet. Usa solo el contexto dado.
  2. Adapta el tono según: ${systemInstruction}.
  3. Sigue las reglas de copy: ${copyInstruction}.
  4. Escribe de forma natural, con espacios correctos entre palabras.
  5. El campo "shortTitle" NO PUEDE TENER MÁS DE 26 CARACTERES.
  
  JSON: { "shortTitle": "Título corto (máx 26 carac)", "copy": "Texto del posteo" }`;
  
  const res = await generateContentWithRetry({ 
    model: FAST_MODEL, 
    contents: prompt,
    config: { 
      responseMimeType: "application/json" 
    }
  });
  
  const data = cleanAndParseJSON(res.text, { shortTitle: "A1TOQUE", copy: "Posteo generado." });
  data.sources = [];
  return data;
};

export const generateSocialMediaContentFromTopic = async (topic: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `Actúa como un Community Manager experto y estratega de contenido. 
  Tu objetivo es crear un posteo de alto impacto para redes sociales sobre: "${topic}".
  
  INSTRUCCIONES OBLIGATORIAS:
  1. SIEMPRE utiliza la herramienta googleSearch para investigar el tema a fondo. Busca noticias de último minuto, resultados recientes y contexto relevante en internet.
  2. Si el tema es una URL, investígala y busca información adicional relacionada para darle más valor al posteo.
  3. Adapta el tono según estas reglas de personalidad: ${systemInstruction}.
  4. Sigue estas directrices de redacción (copywriting): ${copyInstruction}.
  5. Escribe de forma natural, con espacios correctos entre palabras.
  6. El campo "shortTitle" NO PUEDE TENER MÁS DE 26 CARACTERES.

  JSON: { "shortTitle": "Título corto (máx 26 carac)", "copy": "Texto del posteo con datos reales, emojis y hashtags" }`;
  
  const res = await generateContentWithRetry({ 
    model: POWERFUL_MODEL, 
    contents: prompt, 
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    } 
  });
  
  const data = cleanAndParseJSON(res.text, { shortTitle: "A1TOQUE", copy: "Posteo generado." });
  
  const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
  data.sources = groundingChunks ? groundingChunks
        .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
        .filter((s): s is Source => !!s) : [];
        
  return data;
};

export const refineSocialMediaContent = async (currentTitle: string, currentCopy: string, instructions: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `Actúa como un Community Manager experto.
  Tienes este posteo actual:
  Título: "${currentTitle}"
  Copy: "${currentCopy}"
  
  El usuario pide esta modificación: "${instructions}"
  
  INSTRUCCIONES OBLIGATORIAS:
  1. SIEMPRE utiliza googleSearch para validar datos, buscar información adicional solicitada por el usuario o encontrar noticias de último momento que mejoren la respuesta.
  2. Reformula el título y el copy incorporando la petición del usuario y los datos reales encontrados.
  3. Mantén el tono definido por: ${systemInstruction}.
  4. Sigue las directrices de redacción: ${copyInstruction}.
  5. CRÍTICO: El campo "shortTitle" NO PUEDE TENER MÁS DE 26 CARACTERES.
  
  JSON: { "shortTitle": "Título corto (máx 26 carac)", "copy": "Texto del posteo reformulado con datos actualizados" }`;
  
  const res = await generateContentWithRetry({ 
    model: POWERFUL_MODEL, 
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json" 
    }
  });
  
  const data = cleanAndParseJSON(res.text, { shortTitle: currentTitle, copy: currentCopy });
  
  const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
  data.sources = groundingChunks ? groundingChunks
        .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
        .filter((s): s is Source => !!s) : [];
        
  return data;
};

export const improveSocialMediaCopy = async (currentCopy: string, systemInstruction: string, copyInstruction: string) => {
  const prompt = `Mejora este copy: "${currentCopy}". Estilo: ${systemInstruction}. Reglas: ${copyInstruction}. 
  CRÍTICO: Escribe con espacios normales entre las palabras.
  JSON: { copy }`;
  const res = await generateContentWithRetry({ 
    model: FAST_MODEL, 
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return cleanAndParseJSON(res.text, { copy: currentCopy });
};

export const summarizeArticle = async (content: string) => {
  try {
    const res = await generateContentWithRetry({ model: FAST_MODEL, contents: `Resume en 1 tweet: ${content.substring(0, 2000)}` });
    return res.text || "Sin resumen.";
  } catch (error) { return "Error IA."; }
};
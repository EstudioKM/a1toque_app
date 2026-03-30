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
const POWERFUL_MODEL = 'gemini-3.1-flash-lite-preview'; // Usamos Lite en ambos para mitigar problemas de spending cap

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
  maxRetries: number = 5
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
      
      const isRateLimit = error.message?.includes('429') || error.status === 429;
      const isSpendingCap = error.message?.includes('spending cap') || JSON.stringify(error).includes('spending cap');
      
      if (isSpendingCap) {
        const msg = "Límite de gasto de la API alcanzado. Por favor, ve a console.cloud.google.com, selecciona tu proyecto y revisa 'Billing' -> 'Budgets & alerts' para aumentar el límite o desactivar el tope de gasto.";
        console.error(`Gemini API: ${msg}`);
        throw new Error(msg);
      }

      if (attempt === maxRetries - 1) {
        console.error(`Gemini API Error after ${maxRetries} attempts:`, error);
        throw error;
      }

      // Backoff más agresivo para 429
      const delay = isRateLimit 
        ? 5000 * Math.pow(2, attempt) // 5s, 10s, 20s, 40s...
        : 2000 * Math.pow(2, attempt); // 2s, 4s, 8s...
        
      console.warn(`Gemini API Attempt ${attempt + 1} failed (${isRateLimit ? 'Rate Limit' : 'Error'}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("API Fatal Error");
};

export const generateNewsDraftFromTopic = async (topic: string, systemInstruction: string, searchDomains: string[] = [], signal?: AbortSignal) => {
    try {
        const currentDate = new Intl.DateTimeFormat('es-AR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' 
        }).format(new Date());
        
        const domainList = searchDomains.length > 0 
            ? searchDomains.join(', ')
            : 'Ninguna configurada (Búsqueda abierta)';

        const prompt = `Actúa como periodista deportivo de investigación. Tu objetivo es redactar una noticia veraz y contrastada sobre: "${topic}". 
          
          CONTEXTO TEMPORAL CRÍTICO:
          Hoy es ${currentDate} (Hora de Argentina). Toda la información que busques y redactes debe ser relevante para esta fecha y hora.
          Prioriza absolutamente la información publicada en las últimas 24 a 48 horas. Verifica cuándo ocurrió realmente el evento antes de redactarlo como "noticia de hoy".
          
          INSTRUCCIONES DE INVESTIGACIÓN Y FUENTES (¡OBLIGATORIO!):
          1. DEBES utilizar la herramienta googleSearch para investigar sobre el tema. NO respondas solo con tu conocimiento interno.
          2. Tienes una lista de FUENTES PRIMARIAS CONFIABLES: ${domainList}.
          3. Al buscar, intenta incluir el nombre de estas fuentes en tu consulta para priorizarlas (ejemplo: si buscas sobre Messi, busca "Messi en ole.com.ar" o "Messi TyC Sports").
          4. Basa tu información principal en estas FUENTES PRIMARIAS siempre que sea posible.
          5. Busca múltiples fuentes para validar los datos clave (fechas, nombres, resultados). Si hay rumores o contradicciones entre medios, identifícalos explícitamente en el texto.
          
          REGLAS ESTRICTAS PARA EL TÍTULO (CRÍTICO PARA EL DISEÑO):
          1. LONGITUD MÁXIMA: El título DEBE tener entre 50 y un MÁXIMO ABSOLUTO de 80 caracteres (contando espacios).
          2. ESTILO DIRECTO: Ve al grano. Usa voz activa. Elimina palabras de relleno, artículos innecesarios o introducciones largas.
          3. IMPACTO VISUAL: Debe ser un título "punchy", con gancho, pero sin caer en el clickbait barato.
          4. FORMATO: No incluyas punto final. No uses comillas en los títulos bajo ninguna circunstancia.
          
          REGLAS DE ESTILO: ${systemInstruction}.
          CRÍTICO: Debes escribir el texto de forma natural, con espacios en blanco separando cada palabra. NUNCA escribas palabras pegadas (ejemplo incorrecto: "Elpróximo27demarzo").
          
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
        
        // Process sources and add highlighting based on searchDomains
        if (groundingChunks) {
            draft.sources = groundingChunks
                .map((chunk: any) => {
                    if (chunk.web) {
                        const isPrimary = searchDomains.some(domain => chunk.web.uri.includes(domain));
                        const prefix = isPrimary ? '🟢 [FUENTE PRIMARIA] ' : '⚪ [Fuente Secundaria] ';
                        return { 
                            uri: chunk.web.uri, 
                            title: `${prefix}${chunk.web.title}` 
                        };
                    }
                    return null;
                })
                .filter((s): s is Source => !!s);
        } else {
            draft.sources = [];
        }
        
        return draft;
    } catch (error) { 
        console.error("Error in generateNewsDraftFromTopic:", error);
        return null; 
    }
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
    } catch (error) { 
        console.error("Error in generateNewsFromUrl:", error);
        return null; 
    }
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

export const generateSocialMediaContentFromTopic = async (topic: string, systemInstruction: string, copyInstruction: string, searchDomains: string[] = []) => {
  const currentDate = new Intl.DateTimeFormat('es-AR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' 
  }).format(new Date());
  
  const domainList = searchDomains.length > 0 
      ? searchDomains.join(', ')
      : 'Ninguna configurada (Búsqueda abierta)';

  const prompt = `Actúa como un Community Manager experto y estratega de contenido. 
  Tu objetivo es crear un posteo de alto impacto para redes sociales sobre: "${topic}".
  
  CONTEXTO TEMPORAL CRÍTICO:
  Hoy es ${currentDate} (Hora de Argentina). Toda la información que busques y redactes debe ser relevante para esta fecha y hora.
  Prioriza absolutamente la información publicada en las últimas 24 a 48 horas.
  
  INSTRUCCIONES DE INVESTIGACIÓN Y FUENTES (¡OBLIGATORIO!):
  1. DEBES utilizar la herramienta googleSearch para investigar sobre el tema. NO respondas solo con tu conocimiento interno.
  2. Tienes una lista de FUENTES PRIMARIAS CONFIABLES: ${domainList}.
  3. Al buscar, intenta incluir el nombre de estas fuentes en tu consulta para priorizarlas (ejemplo: si buscas sobre Messi, busca "Messi en ole.com.ar" o "Messi TyC Sports").
  4. Basa tu información principal en estas FUENTES PRIMARIAS siempre que sea posible.
  5. Si el tema es una URL, investígala y busca información adicional relacionada para darle más valor al posteo.
  
  INSTRUCCIONES DE REDACCIÓN:
  1. Adapta el tono según estas reglas de personalidad: ${systemInstruction}.
  2. Sigue estas directrices de redacción (copywriting): ${copyInstruction}.
  3. Escribe de forma natural, con espacios correctos entre palabras.
  4. El campo "shortTitle" NO PUEDE TENER MÁS DE 26 CARACTERES.

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
  
  if (groundingChunks && Array.isArray(groundingChunks)) {
      data.sources = groundingChunks
          .map((chunk: any) => {
              if (chunk.web) {
                  const isPrimary = searchDomains.some(domain => chunk.web.uri.includes(domain));
                  const prefix = isPrimary ? '🟢 [FUENTE PRIMARIA] ' : '⚪ [Fuente Secundaria] ';
                  return { 
                      uri: chunk.web.uri, 
                      title: `${prefix}${chunk.web.title}` 
                  };
              }
              return null;
          })
          .filter((s): s is Source => !!s);
  } else {
      data.sources = [];
  }
        
  return data;
};

export const refineSocialMediaContent = async (currentTitle: string, currentCopy: string, instructions: string, systemInstruction: string, copyInstruction: string, searchDomains: string[] = []) => {
  const currentDate = new Intl.DateTimeFormat('es-AR', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' 
  }).format(new Date());
  
  const domainList = searchDomains.length > 0 
      ? searchDomains.join(', ')
      : 'Ninguna configurada (Búsqueda abierta)';

  const prompt = `Actúa como un Community Manager experto.
  Tienes este posteo actual:
  Título: "${currentTitle}"
  Copy: "${currentCopy}"
  
  El usuario pide esta modificación: "${instructions}"
  
  CONTEXTO TEMPORAL CRÍTICO:
  Hoy es ${currentDate} (Hora de Argentina). Toda la información que busques y redactes debe ser relevante para esta fecha y hora.
  Prioriza absolutamente la información publicada en las últimas 24 a 48 horas.
  
  INSTRUCCIONES DE INVESTIGACIÓN Y FUENTES (¡OBLIGATORIO!):
  1. DEBES utilizar la herramienta googleSearch para investigar sobre el tema. NO respondas solo con tu conocimiento interno.
  2. Tienes una lista de FUENTES PRIMARIAS CONFIABLES: ${domainList}.
  3. Al buscar, intenta incluir el nombre de estas fuentes en tu consulta para priorizarlas (ejemplo: si buscas sobre Messi, busca "Messi en ole.com.ar" o "Messi TyC Sports").
  4. Basa tu información principal en estas FUENTES PRIMARIAS siempre que sea posible.
  5. Si el tema es una URL, investígala y busca información adicional relacionada para darle más valor al posteo.
  
  INSTRUCCIONES DE REDACCIÓN:
  1. Reformula el título y el copy incorporando la petición del usuario y los datos reales encontrados.
  2. Mantén el tono definido por: ${systemInstruction}.
  3. Sigue las directrices de redacción: ${copyInstruction}.
  4. CRÍTICO: El campo "shortTitle" NO PUEDE TENER MÁS DE 26 CARACTERES.
  
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
  
  if (groundingChunks && Array.isArray(groundingChunks)) {
      data.sources = groundingChunks
          .map((chunk: any) => {
              if (chunk.web) {
                  const isPrimary = searchDomains.some(domain => chunk.web.uri.includes(domain));
                  const prefix = isPrimary ? '🟢 [FUENTE PRIMARIA] ' : '⚪ [Fuente Secundaria] ';
                  return { 
                      uri: chunk.web.uri, 
                      title: `${prefix}${chunk.web.title}` 
                  };
              }
              return null;
          })
          .filter((s): s is Source => !!s);
  } else {
      data.sources = [];
  }
        
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
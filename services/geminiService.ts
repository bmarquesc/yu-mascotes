
import { GoogleGenAI } from "@google/genai";
import { MascotStyle } from "../types";

const STYLE_PROMPTS: Record<MascotStyle, string> = {
  [MascotStyle.MINI_REALISTA]: `STYLE REFERENCE: High-end professional realistic child mascot. 
    FACE: 100% realistic photographic face, preserving every detail, expression, and genetic feature of the child in the photo. 
    BODY: Slightly stylized "doll-like" proportions but with realistic skin textures and professional studio lighting. 
    FINISH: Soft shadows, high-end toy aesthetic, extremely polished.`,
    
  [MascotStyle.MAGIA_3D]: `STYLE REFERENCE: Modern 3D animation movie style (Pixar/Disney inspired). 
    FACE: Stylized but highly recognizable version of the child. Large, expressive, sparkly eyes with detailed irises. 
    BODY: Full 3D volumetric rendering, subsurface scattering on skin for a warm glow. 
    FINISH: Vibrant saturated colors, cinematic lighting, smooth 3D surfaces.`,
    
  [MascotStyle.CARTOON_POP]: `STYLE REFERENCE: Clean 2D vector art / Modern Sticker style. 
    FACE: Simplified but characteristic features of the child, bold clean outlines. 
    BODY: Proportional 2D cartoon body, flat colors with simple cell-shading. 
    FINISH: High contrast, thick professional lines, graphic and bold visual.`,
    
  [MascotStyle.PINTURA_DOCE]: `STYLE REFERENCE: Soft digital painting illustration. 
    FACE: Artistic representation with soft brushwork, preserving the child's likeness in a delicate way. 
    BODY: Painterly textures, no harsh outlines. 
    FINISH: Warm, cozy atmosphere, pastel color palette, soft focus and artistic lighting.`
};

export async function generateMascotImage(imageBase64: string, style: MascotStyle, clothingDetails: string, partyTheme: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API_KEY não configurada. Se você estiver na Vercel, adicione-a nas Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64.split(',')[1],
    },
  };

  const styleSpecificInstructions = STYLE_PROMPTS[style];

  const promptText = `
    TASK: Generate a professional full-body child mascot based on the attached photo.
    
    ESTILO VISUAL OBRIGATÓRIO: ${styleSpecificInstructions}
    
    FIDELIDADE GENÉTICA: O rosto do mascote DEVE ser a versão exata da criança na foto. Mantenha formato de olhos, nariz, boca e expressão original.
    
    DETALHES DA ROUPA: ${clothingDetails || 'Roupas infantis luxuosas e detalhadas combinando com o estilo.'}
    
    TEMA DA FESTA (INTEGRAÇÃO): ${partyTheme ? `Tema: "${partyTheme}". Adicione elementos, cores ou pequenos acessórios que remetam a este tema de forma elegante.` : 'Sem tema específico.'}
    
    REGRAS CRÍTICAS DE SAÍDA:
    1. CORPO INTEIRO (Full Body): Gere da cabeça aos pés, pose carismática de pé.
    2. FUNDO BRANCO: Fundo totalmente limpo e branco (White background).
    3. SEM TEXTO: Proibido nomes, logos, marcas d'água ou assinaturas.
    4. QUALIDADE: Resolução 8k, iluminação profissional, visual de obra-prima.
    5. NÃO É CARICATURA: O resultado deve ser um mascote profissional, nunca uma caricatura distorcida ou engraçada.

    Apenas retorne a imagem do mascote finalizado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, { text: promptText }] },
    });

    for (const part of response.candidates?.[0].content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("A IA não retornou uma imagem. Tente novamente ou verifique se a foto está clara.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('403')) {
      throw new Error("Erro de permissão da API. Verifique sua chave e faturamento no Google AI Studio.");
    }
    throw new Error(error.message || "Erro ao gerar a arte. Tente uma foto diferente.");
  }
}

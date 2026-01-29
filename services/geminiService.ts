
import { GoogleGenAI } from "@google/genai";
import { MascotStyle } from "../types";

const STYLE_PROMPTS: Record<MascotStyle, string> = {
  [MascotStyle.MINI_REALISTA]: `STYLE REFERENCE: High-end professional realistic child mascot. 
    FACE: 100% realistic photographic face, preserving every detail, expression, and genetic feature of the child in the photo. 
    BODY: Slightly stylized "doll-like" proportions but with realistic skin textures and professional studio lighting. 
    FINISH: Soft shadows, high-end toy aesthetic, extremely polished, cinematic 8k resolution.`,
    
  [MascotStyle.MAGIA_3D]: `STYLE REFERENCE: Modern 3D animation movie style (Pixar/Disney inspired). 
    FACE: Stylized but highly recognizable version of the child. Large, expressive, sparkly eyes with detailed irises. 
    BODY: Full 3D volumetric rendering, subsurface scattering on skin for a warm glow. 
    FINISH: Vibrant saturated colors, cinematic lighting, smooth 3D surfaces, masterpiece quality.`,
    
  [MascotStyle.CARTOON_POP]: `STYLE REFERENCE: Clean 2D vector art / Modern Sticker style. 
    FACE: Simplified but characteristic features of the child, bold clean outlines. 
    BODY: Proportional 2D cartoon body, flat colors with simple cell-shading. 
    FINISH: High contrast, thick professional lines, graphic and bold visual, commercial illustration style.`,
    
  [MascotStyle.PINTURA_DOCE]: `STYLE REFERENCE: Soft digital painting illustration. 
    FACE: Artistic representation with soft brushwork, preserving the child's likeness in a delicate way. 
    BODY: Painterly textures, no harsh outlines, magical atmosphere. 
    FINISH: Warm, cozy atmosphere, pastel color palette, soft focus and artistic lighting, watercolor and gouache textures.`
};

export async function generateMascotImage(imageBase64: string, style: MascotStyle, clothingDetails: string, partyTheme: string): Promise<string> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("Por favor, selecione uma chave de API para continuar.");
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
    FIDELIDADE GENÉTICA: O rosto do mascote DEVE ser a versão exata da criança na foto.
    ESTILO: ${styleSpecificInstructions}
    DETALHES: ${clothingDetails || 'Roupas infantis luxuosas.'}
    TEMA: ${partyTheme ? `Tema: ${partyTheme}` : ''}
    REGRAS: Fundo branco, corpo inteiro, sem texto.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0].content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("A IA não retornou imagem. Tente uma foto mais nítida.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("COTA ZERO: O Google exige que você ative o plano 'Pay-as-you-go' (é grátis até certo limite) no Google AI Studio para gerar imagens.");
    }
    throw new Error(error.message || "Erro ao gerar arte.");
  }
}

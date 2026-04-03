import { getApiKey, GEMINI_MODEL, SYSTEM_PROMPT } from '../constants';
import { blobToBase64 } from '../utils/audio';

function parseModelJson(text) {
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m;
  const m = t.match(fence);
  if (m) t = m[1].trim();
  return JSON.parse(t);
}

export async function callGemini({ temaText, textExplanation, audioBlob, audioMime }) {
  const GEMINI_API_KEY = getApiKey();
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Configure VITE_GEMINI_API_KEY no Netlify (Environment variables) ou no arquivo .env local.',
    );
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const userParts = [];

  const intro = `Anna está estudando medicina. O tema informado por ela é: "${temaText || 'não especificado'}".

Analise a explicação dela abaixo e siga as instruções do sistema.`;

  userParts.push({ text: intro });

  if (audioBlob && audioBlob.size > 0) {
    const b64 = await blobToBase64(audioBlob);
    let mime = audioMime || audioBlob.type || 'audio/webm';
    if (!mime.startsWith('audio/')) mime = 'audio/webm';
    userParts.push({
      inline_data: {
        mime_type: mime,
        data: b64,
      },
    });
  } else if (textExplanation && textExplanation.trim()) {
    userParts.push({
      text: `Explicação em texto da Anna:\n\n${textExplanation.trim()}`,
    });
  } else {
    throw new Error('Envie uma gravação de áudio ou digite sua explicação.');
  }

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: userParts,
      },
    ],
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.error?.message || res.statusText || 'Erro desconhecido';
    throw new Error(msg);
  }

  if (data.promptFeedback && data.promptFeedback.blockReason) {
    throw new Error('O envio foi bloqueado pelas políticas de segurança. Tente reformular.');
  }

  const cand = data.candidates && data.candidates[0];
  if (cand && (cand.finishReason === 'SAFETY' || cand.finishReason === 'RECITATION')) {
    throw new Error('A resposta foi bloqueada por segurança. Reformule a explicação e tente de novo.');
  }
  const parts = cand && cand.content && cand.content.parts;
  const outText = parts && parts.map((p) => p.text || '').join('') || '';
  if (!outText) throw new Error('Resposta vazia da API. Tente novamente.');
  try {
    return parseModelJson(outText);
  } catch {
    throw new Error('Não consegui interpretar a resposta da IA. Tente enviar de novo.');
  }
}

import { GEMINI_MODEL, SYSTEM_PROMPT } from '../../src/constants.js';

function parseModelJson(text) {
  let t = String(text || '').trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m;
  const m = t.match(fence);
  if (m) t = m[1].trim();
  return JSON.parse(t);
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Configure GEMINI_API_KEY nas variáveis do Netlify.' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { temaText = '', textExplanation = '', audioBase64 = null, audioMime = '' } = payload || {};

  const userParts = [
    {
      text: `Anna está estudando medicina. O tema informado por ela é: "${temaText || 'não especificado'}".\n\nAnalise a explicação dela abaixo e siga as instruções do sistema.`,
    },
  ];

  if (audioBase64) {
    userParts.push({
      inline_data: {
        mime_type: audioMime && String(audioMime).startsWith('audio/') ? audioMime : 'audio/webm',
        data: audioBase64,
      },
    });
  } else if (textExplanation && String(textExplanation).trim()) {
    userParts.push({
      text: `Explicação em texto da Anna:\n\n${String(textExplanation).trim()}`,
    });
  } else {
    return new Response(JSON.stringify({ error: 'Envie áudio ou texto para analisar.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: userParts }],
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const upstream = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'Erro da Gemini API.' }), {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (data.promptFeedback?.blockReason) {
    return new Response(
      JSON.stringify({ error: 'O envio foi bloqueado pelas políticas de segurança.' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  const cand = data.candidates?.[0];
  if (cand && (cand.finishReason === 'SAFETY' || cand.finishReason === 'RECITATION')) {
    return new Response(
      JSON.stringify({ error: 'A resposta foi bloqueada por segurança. Reformule e tente novamente.' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  const outText = cand?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!outText) {
    return new Response(JSON.stringify({ error: 'Resposta vazia da IA.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const parsed = parseModelJson(outText);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Não foi possível interpretar a resposta JSON da IA.' }),
      {
        status: 502,
        headers: { 'content-type': 'application/json' },
      },
    );
  }
};

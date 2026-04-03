import { blobToBase64 } from '../utils/audio';

export async function callGemini({ temaText, textExplanation, audioBlob, audioMime }) {
  let audioBase64 = null;
  let mime = '';

  if (audioBlob && audioBlob.size > 0) {
    audioBase64 = await blobToBase64(audioBlob);
    mime = audioMime || audioBlob.type || 'audio/webm';
    if (!mime.startsWith('audio/')) mime = 'audio/webm';
  }

  let res;
  try {
    res = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temaText: temaText || '',
        textExplanation: textExplanation || '',
        audioBase64,
        audioMime: mime,
      }),
    });
  } catch {
    throw new Error(
      'Não consegui conectar com a função de análise. Rode com `netlify dev` para testar local.',
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Função Netlify não encontrada localmente. Use `netlify dev` (não apenas `npm run dev`).',
      );
    }
    throw new Error(data.error || 'Falha ao analisar explicação.');
  }
  return data;
}

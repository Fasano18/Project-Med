import { MAX_SESSIONS, STORAGE_KEY } from '../constants';

export function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeHistory(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveStudySession(payload) {
  const sessions = readHistory();
  sessions.unshift({
    data: new Date().toISOString(),
    tema: payload.tema,
    topicos: payload.topicos,
    perguntas: payload.perguntas,
    resumo: payload.resumo,
  });
  writeHistory(sessions);
}

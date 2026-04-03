import { useState, useMemo } from 'react';
import { readHistory, clearHistory } from '../utils/historyStorage';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function HistoryPanel({ onSelectSession, refreshKey = 0, onCleared }) {
  const [open, setOpen] = useState(false);
  const sessions = useMemo(() => readHistory(), [open, refreshKey]);

  const handleClear = () => {
    if (confirm('Tem certeza que deseja apagar todo o histórico deste aparelho?')) {
      clearHistory();
      onCleared?.();
    }
  };

  return (
    <GlassPanelSimple className="history-panel-wrap">
      <button
        type="button"
        className="btn-history-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>📖</span>
        Ver histórico
      </button>
      {open ? (
        <div className="history-drawer">
          {sessions.length === 0 ? (
            <p className="history-empty">Nenhuma sessão salva ainda.</p>
          ) : (
            <ul className="history-list">
              {sessions.map((s, idx) => (
                <li key={`${s.data}-${idx}`}>
                  <button
                    type="button"
                    className="history-row"
                    onClick={() =>
                      onSelectSession({
                        tema: s.tema,
                        resumo: s.resumo,
                        topicos: s.topicos,
                        perguntas: s.perguntas,
                        prompt_mapa_mental: s.prompt_mapa_mental,
                      })
                    }
                  >
                    <strong>{s.tema || 'Sem tema'}</strong>
                    <small>{formatDate(s.data)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn-clear-history" onClick={handleClear}>
            Limpar histórico
          </button>
        </div>
      ) : null}
    </GlassPanelSimple>
  );
}

function GlassPanelSimple({ children, className = '' }) {
  return <div className={`glass-panel ${className}`.trim()}>{children}</div>;
}

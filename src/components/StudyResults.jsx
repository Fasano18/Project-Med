import { useState, forwardRef } from 'react';

export const StudyResults = forwardRef(function StudyResults({ data }, ref) {
  const [openHints, setOpenHints] = useState(() => ({}));
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const toggleHint = (i) => {
    setOpenHints((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const promptMapa = data.prompt_mapa_mental?.trim();

  const handleCopyPrompt = async () => {
    if (!promptMapa) return;
    try {
      await navigator.clipboard.writeText(promptMapa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="results-stack" ref={ref}>
      <section className="glass-panel result-section">
        <div className="section-heading">
          <span className="section-icon" aria-hidden>
            📚
          </span>
          <h2>Tópicos importantes</h2>
        </div>
        {data.tema ? (
          <p className="tema-pill">
            <span className="tema-pill-label">Tema</span>
            {data.tema}
          </p>
        ) : null}
        {data.resumo ? <div className="resumo-card">{data.resumo}</div> : null}
        <div className="topic-grid">
          {(data.topicos || []).map((tp, i) => (
            <article
              key={`${tp.titulo}-${i}`}
              className="topic-card"
              style={{ animationDelay: `${80 + i * 50}ms` }}
            >
              <div className="topic-card-accent" aria-hidden />
              <h3>{tp.titulo}</h3>
              <p>{tp.conteudo}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-panel result-section">
        <div className="section-heading">
          <span className="section-icon" aria-hidden>
            📝
          </span>
          <h2>Sua provinha</h2>
        </div>
        <ol className="flash-list">
          {(data.perguntas || []).map((pq, i) => (
            <li key={i} className="flash-item" style={{ animationDelay: `${100 + i * 45}ms` }}>
              <span className="flash-num" aria-hidden>
                {i + 1}
              </span>
              <p className="flash-q">{pq.pergunta}</p>
              <button type="button" className="btn-hint" onClick={() => toggleHint(i)}>
                {openHints[i] ? 'Ocultar dica' : 'Ver dica'}
                <span className="btn-hint-ico" aria-hidden>
                  {openHints[i] ? '🔒' : '💡'}
                </span>
              </button>
              {openHints[i] ? (
                <div className="hint-reveal" role="note">
                  {pq.dica}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {promptMapa ? (
        <section className="glass-panel result-section prompt-mapa-section">
          <div className="section-heading">
            <span className="section-icon" aria-hidden>
              🧠
            </span>
            <h2>Prompt para mapa mental (ChatGPT)</h2>
          </div>
          <p className="prompt-mapa-intro">
            Copie o texto abaixo e cole no ChatGPT para pedir um <strong>mapa mental</strong> alinhado ao que
            você estudou — já vem detalhado, só colar.
          </p>
          <div className="prompt-mapa-box">
            <pre className="prompt-mapa-text" dir="ltr">
              {promptMapa}
            </pre>
          </div>
          <button type="button" className="btn-copy-prompt" onClick={handleCopyPrompt}>
            {copied ? 'Copiado!' : 'Copiar prompt'}
            <span aria-hidden>{copied ? '✓' : '📋'}</span>
          </button>
        </section>
      ) : null}
    </div>
  );
});

StudyResults.displayName = 'StudyResults';

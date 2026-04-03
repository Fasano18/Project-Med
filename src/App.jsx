import { useState, useRef, useCallback } from 'react';
import { WelcomeHeader } from './components/WelcomeHeader';
import { GlassPanel } from './components/GlassPanel';
import { StudyResults } from './components/StudyResults';
import { HistoryPanel } from './components/HistoryPanel';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { callGemini } from './api/gemini';
import { getApiKey } from './constants';
import { saveStudySession } from './utils/historyStorage';

export default function App() {
  const [tema, setTema] = useState('');
  const [texto, setTexto] = useState('');
  const [textOpen, setTextOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [historyTick, setHistoryTick] = useState(0);

  const resultsRef = useRef(null);

  const {
    isRecording,
    blob: recordedBlob,
    mime: recordedMime,
    audioUrl,
    hint: recHint,
    toggleRecording,
    resetRecording,
  } = useAudioRecorder();

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const runSubmit = async (mode) => {
    setError('');
    const temaText = tema.trim();
    const textoAlt = texto.trim();

    if (!getApiKey()) {
      setError(
        'Defina VITE_GEMINI_API_KEY no Netlify (Environment variables) ou no .env local e faça um novo deploy.',
      );
      return;
    }

    let useAudio = false;
    let useText = false;
    if (mode === 'audio') {
      useAudio = !!(recordedBlob && recordedBlob.size > 0);
      if (!useAudio) {
        setError('Grave um áudio antes de enviar ou use o botão principal com texto.');
        return;
      }
    } else {
      if (recordedBlob && recordedBlob.size > 0) useAudio = true;
      else if (textoAlt.length > 0) useText = true;
    }

    if (!useAudio && !useText) {
      setError('Grave um áudio ou escreva sua explicação antes de enviar.');
      return;
    }

    setLoading(true);
    try {
      const data = await callGemini({
        temaText,
        textExplanation: useText ? textoAlt : '',
        audioBlob: useAudio ? recordedBlob : null,
        audioMime: recordedMime || (recordedBlob && recordedBlob.type),
      });
      setResult(data);
      saveStudySession(data);
      setHistoryTick((t) => t + 1);
      scrollToResults();
    } catch (e) {
      const raw = e?.message || 'Não foi possível analisar agora. Tente de novo em instantes.';
      const isKeyProblem = /leaked|API key|api key|API_KEY|permission denied|403/i.test(raw);
      const safariHint =
        isKeyProblem || raw.includes('Configure VITE_GEMINI_API_KEY')
          ? ''
          : ' Se o problema for o áudio no Safari, tente digitar a explicação ou usar Chrome.';
      const keyHelp = raw.includes('leaked')
        ? ' Crie uma chave nova em Google AI Studio, apague a antiga, coloque só em VITE_GEMINI_API_KEY no Netlify (sem commitar no Git) e faça um novo deploy.'
        : '';
      setError(`${raw}${keyHelp}${safariHint}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAudio = () => {
    setTexto('');
    runSubmit('audio');
  };

  const handleSessionFromHistory = (session) => {
    if (!session) return;
    setResult(session);
    scrollToResults();
  };

  return (
    <div className="app-shell">
      <div className="bg-blob bg-blob-a" aria-hidden />
      <div className="bg-blob bg-blob-b" aria-hidden />
      <div className="bg-grid" aria-hidden />

      <div className="wrap">
        <WelcomeHeader />

        <GlassPanel aria-label="Tema" delay={80}>
          <label className="field-label" htmlFor="tema">
            Qual é o tema?
          </label>
          <input
            id="tema"
            className="input-tema"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Qual assunto você vai explicar hoje? (ex: Ciclo de Krebs, Hipertensão...)"
            autoComplete="off"
          />
        </GlassPanel>

        <GlassPanel aria-label="Gravação" delay={120}>
          <div className="panel-head">
            <span className="panel-badge">Voz</span>
            <h3 className="panel-title">Grave sua explicação</h3>
          </div>
          <button
            type="button"
            className={`btn-record ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
          >
            {isRecording ? 'Parar gravação' : 'Gravar explicação'}
            <span className="btn-record-ico" aria-hidden>
              {isRecording ? '⏹️' : '🎙️'}
            </span>
          </button>
          {recHint ? <p className="rec-hint">{recHint}</p> : null}

          {audioUrl ? (
            <div className="audio-preview">
              <div className="audio-preview-head">
                <span>Ouça antes de enviar</span>
                <button type="button" className="link-quiet" onClick={resetRecording}>
                  Apagar áudio
                </button>
              </div>
              <audio className="audio-el" src={audioUrl} controls playsInline />
            </div>
          ) : null}

          <button
            type="button"
            className="btn-secondary"
            disabled={!recordedBlob || recordedBlob.size === 0 || loading}
            onClick={handleSendAudio}
          >
            Enviar para análise
            <span aria-hidden>📤</span>
          </button>

          <div className="divider-ornament">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="link-expand"
            aria-expanded={textOpen}
            onClick={() => setTextOpen((v) => !v)}
          >
            Prefiro digitar ✍️
          </button>

          <div className={textOpen ? 'collapsible open' : 'collapsible'} aria-hidden={!textOpen}>
            <label className="field-label" htmlFor="texto">
              Sua explicação em texto
            </label>
            <textarea
              id="texto"
              className="textarea-alt"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite aqui o que você lembra ou explicaria sobre o tema..."
            />
          </div>
        </GlassPanel>

        <GlassPanel delay={160}>
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={() => runSubmit('auto')}
          >
            {loading ? 'Analisando…' : 'Enviar e gerar meu estudo'}
            <span aria-hidden>{loading ? '🩷' : '✨'}</span>
          </button>

          {loading ? (
            <div className="loading-strip" role="status">
              <span className="spinner" />
              <span>Analisando sua explicação... 🩷</span>
            </div>
          ) : null}

          {error ? (
            <div className="error-box" role="alert">
              {error}
            </div>
          ) : null}
        </GlassPanel>

        <StudyResults ref={resultsRef} data={result} />

        <HistoryPanel
          onSelectSession={handleSessionFromHistory}
          refreshKey={historyTick}
          onCleared={() => setHistoryTick((t) => t + 1)}
        />

        <footer className="site-footer">
          Feito com amor e carinho pelo Leo <span aria-hidden>🩷</span>
        </footer>
      </div>
    </div>
  );
}

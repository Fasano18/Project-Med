import { useTypewriter } from '../hooks/useTypewriter';
import { WELCOME_TEXT } from '../constants';

export function WelcomeHeader() {
  const { display, done } = useTypewriter(WELCOME_TEXT, 30);

  return (
    <header className="site-header">
      <p className={`typewriter ${done ? 'done' : ''}`} aria-live="polite">
        {display}
      </p>
      <p className="subtitle">
        Explique um assunto e eu crio seus tópicos e uma provinha <span aria-hidden>🩷</span>
      </p>
    </header>
  );
}

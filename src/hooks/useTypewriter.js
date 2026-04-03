import { useState, useEffect } from 'react';

export function useTypewriter(text, speed = 32, enabled = true) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplay(text || '');
      setDone(true);
      return;
    }

    setDisplay('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed, enabled]);

  return { display, done };
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { pickMimeType } from '../utils/audio';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [mime, setMime] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [hint, setHint] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopTracks();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, stopTracks]);

  const toggleRecording = useCallback(async () => {
    setHint('');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setHint('Seu navegador não suporta gravação. Use a opção de texto ou outro navegador.');
      return;
    }

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
      setBlob(null);

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const picked = pickMimeType();
      const fallbackMime = picked || 'audio/webm';
      setMime(fallbackMime);

      let mr;
      try {
        mr = picked ? new MediaRecorder(streamRef.current, { mimeType: picked }) : new MediaRecorder(streamRef.current);
      } catch {
        mr = new MediaRecorder(streamRef.current);
      }

      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stopTracks();
        const blobType = mr.mimeType || fallbackMime || 'audio/webm';
        const nextBlob = new Blob(chunksRef.current, { type: blobType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(nextBlob);
        setBlob(nextBlob.size > 0 ? nextBlob : null);
        setAudioUrl(url);
        setMime(blobType);
        setIsRecording(false);
        mediaRecorderRef.current = null;
      };

      mr.start(200);
      setIsRecording(true);
    } catch (err) {
      stopTracks();
      console.error(err);
      setHint('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [audioUrl, stopTracks]);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setBlob(null);
    setAudioUrl('');
    setMime('');
    setHint('');
  }, [audioUrl]);

  return {
    isRecording,
    blob,
    mime,
    audioUrl,
    hint,
    setHint,
    toggleRecording,
    resetRecording,
  };
}

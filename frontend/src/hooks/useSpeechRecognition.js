/**
 * hooks/useSpeechRecognition.js
 *
 * Enregistrement audio LOCAL via MediaRecorder API (intégré au navigateur).
 * Transcription via Groq Whisper côté serveur Django — AUCUNE dépendance Google.
 * Fonctionne en HTTP local, réseau restreint, et tous navigateurs modernes.
 */

import { useState, useRef, useCallback } from 'react';

const TRANSCRIBE_URL = '/api/v1/voice/transcribe/';

export default function useSpeechRecognition({ onTranscript } = {}) {
  const [isListening,   setIsListening]   = useState(false);
  const [isTranscribing,setIsTranscribing] = useState(false);
  const [transcript,    setTranscript]    = useState('');
  const [error,         setError]         = useState(null);
  const [supported,     setSupported]     = useState(
    typeof window !== 'undefined' &&
    !!(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);

  // ── Démarrer l'enregistrement ─────────────────────────────
  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Choisir le meilleur codec disponible
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Arrêter le microphone
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) {
          setError('Aucun audio enregistré.');
          setIsTranscribing(false);
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        setIsTranscribing(true);
        try {
          const text = await sendToWhisper(blob, mimeType);
          setTranscript(text);
          onTranscript?.(text);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.onerror = (e) => {
        setError('Erreur microphone : ' + (e.error?.message || 'inconnue'));
        setIsListening(false);
      };

      recorder.start(250); // chunks toutes les 250ms
      setIsListening(true);

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone refusé — autorisez l\'accès dans votre navigateur.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucun microphone détecté.');
      } else {
        setError('Impossible d\'accéder au microphone : ' + err.message);
      }
    }
  }, [onTranscript]);

  // ── Arrêter l'enregistrement ──────────────────────────────
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // ── Toggle ────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  // ── Reset ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setError(null);
    chunksRef.current = [];
  }, [stop]);

  return {
    isListening,
    isTranscribing,
    transcript,
    interimText: '',   // Pas d'interim avec MediaRecorder (transcription post-enregistrement)
    error,
    supported,
    start,
    stop,
    toggle,
    reset,
  };
}

// ── Envoi du blob audio à Django/Groq Whisper ─────────────────
async function sendToWhisper(blob, mimeType) {
  const token = localStorage.getItem('access_token');

  const formData = new FormData();
  // Nommer le fichier avec la bonne extension pour que Groq l'accepte
  const ext = mimeType?.includes('ogg') ? 'ogg'
            : mimeType?.includes('mp4') ? 'mp4'
            : 'webm';
  formData.append('audio', blob, `recording.${ext}`);
  formData.append('language', 'fr');

  const response = await fetch(TRANSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // NE PAS mettre Content-Type ici — FormData le gère automatiquement
    },
    body: formData,
  });

  if (!response.ok) {
    let msg = `Erreur serveur (${response.status})`;
    try {
      const data = await response.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.transcript) {
    throw new Error('Transcription vide — parlez plus fort ou réessayez.');
  }
  return data.transcript;
}
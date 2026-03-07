/**
 * components/voice/VoiceDictation.jsx
 * Compatible avec useSpeechRecognition basé sur MediaRecorder + Groq Whisper.
 * Aucune dépendance Google — fonctionne en HTTP local et réseau restreint.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import useVoiceToForm from '../../hooks/useVoiceToForm';

const STATES = {
  idle:         { color: '#00a8ff', bg: 'rgba(0,168,255,0.1)',  border: 'rgba(0,168,255,0.25)',  label: 'Dicter'         },
  listening:    { color: '#ff4d6a', bg: 'rgba(255,77,106,0.1)', border: 'rgba(255,77,106,0.4)',  label: 'Enregistrement' },
  transcribing: { color: '#9b8afb', bg: 'rgba(155,138,251,0.1)',border: 'rgba(155,138,251,0.35)',label: 'Transcription'  },
  extracting:   { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.35)', label: 'Analyse...'     },
  success:      { color: '#00e5a0', bg: 'rgba(0,229,160,0.1)',  border: 'rgba(0,229,160,0.35)',  label: 'Rempli !'       },
  error:        { color: '#ff4d6a', bg: 'rgba(255,77,106,0.08)',border: 'rgba(255,77,106,0.3)',  label: 'Erreur'         },
};

// ── Icônes ────────────────────────────────────────────────────────
function MicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}
function StopIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
function SpinnerIcon({ size = 16, color = '#f5a623' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}30`, borderTopColor: color,
      borderRadius: '50%', animation: 'voice-spin 0.7s linear infinite',
    }} />
  );
}

// ── Ondes sonores animées ─────────────────────────────────────────
function SoundWave({ active, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color,
          height: active ? `${8 + Math.sin(i * 1.2) * 6}px` : '4px',
          animation: active ? 'voice-wave 0.8s ease-in-out infinite' : 'none',
          animationDelay: `${i * 0.12}s`,
          transition: 'height 0.2s ease',
        }} />
      ))}
    </div>
  );
}

// ── Timer d'enregistrement ────────────────────────────────────────
function RecordTimer({ running }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  if (!running) return null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff4d6a',
      background: 'rgba(255,77,106,0.1)', padding: '2px 6px', borderRadius: 4,
    }}>
      ● {mm}:{ss}
    </span>
  );
}

// ── Labels des champs ─────────────────────────────────────────────
const FIELD_LABELS = {
  nom: 'Nom', prenom: 'Prénom', date_naissance: 'Date naissance',
  lieu_naissance: 'Lieu naissance', sexe: 'Sexe', telephone: 'Téléphone',
  telephone2: 'Téléphone 2', email: 'Email', adresse: 'Adresse',
  wilaya: 'Wilaya', commune: 'Commune', profession: 'Profession',
  situation_familiale: 'Situation familiale', nombre_enfants: 'Nb enfants',
  niveau_instruction: 'Niveau instruction', id_national: 'N° national',
  statut_vital: 'Statut vital', antecedents_personnels: 'Antécédents perso',
  antecedents_familiaux: 'Antécédents familiaux', notes: 'Notes',
  topographie_code: 'Code topo', topographie_libelle: 'Topographie',
  morphologie_code: 'Code morpho', morphologie_libelle: 'Morphologie',
  date_diagnostic: 'Date diagnostic', stade_ajcc: 'Stade AJCC',
  tnm_t: 'T', tnm_n: 'N', tnm_m: 'M', lateralite: 'Latéralité',
  base_diagnostic: 'Base diagnostic', observations: 'Observations',
  type_traitement: 'Type traitement', date_debut: 'Début', date_fin: 'Fin',
  protocole: 'Protocole', nombre_cycles: 'Cycles', dose: 'Dose',
  intention: 'Intention', etablissement: 'Établissement',
  date_consultation: 'Date consultation', motif: 'Motif',
  poids: 'Poids (kg)', taille: 'Taille (cm)',
  performance_status: 'Performance status', evolution: 'Évolution',
  plan_traitement: 'Plan traitement', prochain_rdv: 'Prochain RDV',
};

// ── Panel transcription + résultats ──────────────────────────────
function TranscriptPanel({ transcript, fields, uiState, color }) {
  const hasFields = fields && Object.keys(fields).length > 0;

  return (
    <div style={{
      marginTop: 10, background: 'var(--bg-elevated)',
      border: `1px solid ${color}30`, borderRadius: 10,
      overflow: 'hidden', animation: 'voice-fadein 0.2s ease',
    }}>
      {transcript && (
        <div style={{ padding: '10px 14px', borderBottom: hasFields ? `1px solid ${color}20` : 'none' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Transcription
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {transcript}
          </p>
        </div>
      )}

      {/* Spinner pendant l'extraction LLM */}
      {uiState === 'extracting' && (
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SpinnerIcon size={14} color="#f5a623" />
          <span style={{ fontSize: 12, color: '#f5a623' }}>Extraction des champs en cours...</span>
        </div>
      )}

      {hasFields && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: '#00e5a0', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', display: 'inline-block' }} />
            {Object.keys(fields).length} champ{Object.keys(fields).length > 1 ? 's' : ''} détecté{Object.keys(fields).length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(fields).map(([key, val]) => (
              <div key={key} style={{
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(0,229,160,0.08)',
                border: '1px solid rgba(0,229,160,0.2)', fontSize: 11.5,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>
                  {FIELD_LABELS[key] || key}
                </span>
                <span style={{ color: '#00e5a0', fontWeight: 600 }}>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasFields && transcript && uiState !== 'extracting' && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,77,106,0.8)' }}>
            ⚠️ Aucun champ reconnu — essayez de dicter plus clairement
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function VoiceDictation({ formType = 'patient', onFieldsExtracted, compact = false }) {
  const [uiState,         setUiState]         = useState('idle');
  const [extractedFields, setExtractedFields] = useState(null);
  const [showPanel,       setShowPanel]       = useState(false);

  const { extractFields, isExtracting, extractError } = useVoiceToForm(formType);

  // ── Callback quand la transcription Whisper est prête ─────
  const handleTranscript = useCallback(async (text) => {
    if (!text?.trim()) return;

    setUiState('extracting');
    setShowPanel(true);

    const fields = await extractFields(text);

    if (fields && Object.keys(fields).length > 0) {
      setExtractedFields(fields);
      setUiState('success');
      onFieldsExtracted?.(fields);
      setTimeout(() => setUiState('idle'), 3000);
    } else {
      setUiState('error');
      setTimeout(() => setUiState('idle'), 2500);
    }
  }, [extractFields, onFieldsExtracted]);

  const {
    isListening, isTranscribing, transcript, error,
    supported, start, stop, toggle, reset,
  } = useSpeechRecognition({ onTranscript: handleTranscript });

  // État UI courant
  const currentUiState = isTranscribing ? 'transcribing'
    : isExtracting    ? 'extracting'
    : isListening     ? 'listening'
    : uiState;

  const s = STATES[currentUiState] || STATES.idle;

  const handleClick = useCallback(() => {
    if (currentUiState === 'extracting' || currentUiState === 'transcribing') return;
    if (currentUiState === 'success' || currentUiState === 'error') {
      reset();
      setExtractedFields(null);
      setUiState('idle');
      return;
    }
    toggle();
    setShowPanel(true);
  }, [currentUiState, toggle, reset]);

  if (!supported) {
    return (
      <div style={{
        padding: '8px 14px', borderRadius: 8, fontSize: 12,
        background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
        color: '#f5a623',
      }}>
        ⚠️ Saisie vocale non supportée — utilisez un navigateur moderne (Chrome, Firefox, Edge)
      </div>
    );
  }

  const isBusy = currentUiState === 'transcribing' || currentUiState === 'extracting';

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @keyframes voice-spin   { to { transform: rotate(360deg); } }
        @keyframes voice-wave   { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.8); } }
        @keyframes voice-fadein { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes voice-pulse  { 0%,100% { box-shadow: 0 0 0 0 rgba(255,77,106,0.4); } 50% { box-shadow: 0 0 0 8px rgba(255,77,106,0); } }
      `}</style>

      {/* ── Bouton principal ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleClick}
          disabled={isBusy}
          title={isListening ? 'Arrêter l\'enregistrement' : 'Démarrer la dictée vocale'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: compact ? '7px 10px' : '8px 16px',
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 8,
            cursor: isBusy ? 'wait' : 'pointer',
            color: s.color, fontSize: 12.5, fontWeight: 600,
            fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
            animation: isListening ? 'voice-pulse 1.5s infinite' : 'none',
            opacity: isBusy ? 0.85 : 1,
          }}
        >
          {currentUiState === 'transcribing' || currentUiState === 'extracting' ? (
            <SpinnerIcon size={16} color={s.color} />
          ) : isListening ? (
            <StopIcon size={16} />
          ) : (
            <MicIcon size={16} color={s.color} />
          )}

          {isListening && <SoundWave active={true} color={s.color} />}
          {!compact && <span>{s.label}</span>}
        </button>

        {/* Timer pendant l'enregistrement */}
        <RecordTimer running={isListening} />

        {/* Hint mode */}
        {!compact && !isListening && !isBusy && (
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 }}>
            Cliquez pour dicter — sans Google
          </span>
        )}

        {/* Bouton masquer/afficher panel */}
        {(transcript || extractedFields) && (
          <button
            onClick={() => setShowPanel(v => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', fontSize: 11,
              padding: '4px 6px', fontFamily: 'var(--font-body)',
            }}
          >
            {showPanel ? '▲ masquer' : '▼ voir'}
          </button>
        )}
      </div>

      {/* ── Erreurs ── */}
      {(error || extractError) && (
        <div style={{
          marginTop: 8, padding: '7px 12px', borderRadius: 7, fontSize: 12,
          background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)',
          color: '#ff4d6a', animation: 'voice-fadein 0.2s ease',
        }}>
          {error || extractError}
        </div>
      )}

      {/* ── Panel transcription + champs ── */}
      {showPanel && (transcript || extractedFields || currentUiState === 'extracting') && (
        <TranscriptPanel
          transcript={transcript}
          fields={extractedFields}
          uiState={currentUiState}
          color={s.color}
        />
      )}
    </div>
  );
}

export function VoiceMiniButton({ formType, onFieldsExtracted }) {
  return <VoiceDictation formType={formType} onFieldsExtracted={onFieldsExtracted} compact={true} />;
}
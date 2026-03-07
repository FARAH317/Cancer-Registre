import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { diagnosticService } from '../../services/diagnosticService';
import { AppLayout } from '../../components/layout/Sidebar';
import VoiceDictation from '../../components/voice/VoiceDictation';

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Histologie'    },
  { label: 'Staging TNM'  },
  { label: 'Marqueurs'     },
  { label: 'Prise en charge' },
];

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const LATERALITE_OPTIONS = [
  { v: '0', l: 'Non applicable' },
  { v: '1', l: 'Droite' },
  { v: '2', l: 'Gauche' },
  { v: '3', l: 'Unilatéral, NOS' },
  { v: '4', l: 'Bilatéral' },
  { v: '5', l: 'Ligne médiane' },
  { v: '9', l: 'Non précisé' },
];

const BASE_DIAG_OPTIONS = [
  { v: '0', l: 'Certificat de décès uniquement' },
  { v: '1', l: 'Clinique seulement' },
  { v: '2', l: 'Clinique + investigations' },
  { v: '4', l: 'Biochimie / immunologie' },
  { v: '5', l: 'Cytologie' },
  { v: '6', l: 'Histologie — métastase' },
  { v: '7', l: 'Histologie — tumeur primitive' },
  { v: '9', l: 'Inconnu' },
];

const TYPE_DIAG_OPTIONS = [
  { v: 'initial',   l: 'Initial' },
  { v: 'recidive',  l: 'Récidive' },
  { v: 'metastase', l: 'Métastase' },
  { v: 'second',    l: 'Second cancer primaire' },
];

const STADE_OPTIONS = [
  '0', 'I', 'IA', 'IB', 'II', 'IIA', 'IIB', 'IIC',
  'III', 'IIIA', 'IIIB', 'IIIC', 'IV', 'U',
];

const ETAT_OPTIONS = [
  { v: 'localise',              l: 'Localisé'             },
  { v: 'extension_regionale',   l: 'Extension régionale'  },
  { v: 'metastatique',          l: 'Métastatique'         },
  { v: 'non_determine',         l: 'Non déterminé'        },
];

const GRADE_OPTIONS = [
  { v: 'I',   l: 'Grade I — bien différencié'           },
  { v: 'II',  l: 'Grade II — modérément différencié'    },
  { v: 'III', l: 'Grade III — peu différencié'          },
  { v: 'IV',  l: 'Grade IV — indifférencié'             },
  { v: 'U',   l: 'Grade inconnu'                        },
];

const MARQUEUR_OPTIONS = [
  { v: 'positif',   l: '+ Positif'  },
  { v: 'negatif',   l: '– Négatif'  },
  { v: 'equivoque', l: '~ Équivoque' },
  { v: 'inconnu',   l: 'Inconnu'    },
];

const MOLEC_OPTIONS = [
  { v: 'positif',   l: 'Muté / Positif'   },
  { v: 'negatif',   l: 'Non muté / Négatif' },
  { v: 'amplifie',  l: 'Amplifié'          },
  { v: 'surexprime',l: 'Sur-exprimé'       },
  { v: 'inconnu',   l: 'Inconnu'           },
  { v: 'non_fait',  l: 'Non fait'          },
];

const STATUT_DOSSIER_OPTIONS = [
  { v: 'en_cours',    l: 'En cours'  },
  { v: 'valide',      l: 'Validé'    },
  { v: 'archive',     l: 'Archivé'   },
];

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function NewDiagnosticPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId      = searchParams.get('patient') || '';

  const [step,       setStep]       = useState(0);
  const [saved,      setSaved]      = useState([{}, {}, {}, {}]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } =
    useForm({ mode: 'onSubmit', defaultValues: { patient: patientId } });

  // ── Navigation entre steps ────────────────────────────────
  const onStepSubmit = async (data) => {
    const updated = saved.map((s, i) => i === step ? data : s);
    setSaved(updated);

    if (step < 3) {
      setStep(step + 1);
      reset({ ...saved[step + 1], patient: patientId });
      return;
    }

    // Envoi final
    setSubmitting(true);
    try {
      const payload = buildPayload(updated, patientId);
      const { data: diag } = await diagnosticService.create(payload);
      toast.success('Diagnostic créé avec succès !');
      navigate(`/diagnostics/${diag.id}`);
    } catch (err) {
      const errs = err.response?.data;
      toast.error(errs ? Object.values(errs).flat().join(' ') : 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Remplissage depuis la voix ────────────────────────────
  const applyVoiceFields = (fields) => {
    Object.entries(fields).forEach(([key, value]) => {
      setValue(key, value, { shouldValidate: true });
    });
  };

  return (
    <AppLayout title="Nouveau Diagnostic">
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* ── Stepper ────────────────────────────────────────── */}
        <div style={{
          display: 'flex', marginBottom: 28,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
          {STEPS.map((s, i) => (
            <div key={i} onClick={() => i < step && setStep(i)} style={{
              flex: 1, padding: '14px 12px', textAlign: 'center',
              background: i === step ? 'var(--accent-dim)' : i < step ? 'rgba(0,229,160,0.08)' : 'transparent',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: i < step ? 'pointer' : 'default', transition: 'all 0.2s',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600,
                color: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--text-muted)',
              }}>
                {i < step ? '✓ ' : ''}{s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Formulaire ─────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
        }}>
          <form onSubmit={handleSubmit(onStepSubmit)}>

            {/* ══════════════════════════════════════════════════
                STEP 0 — Histologie & Morphologie
                ══════════════════════════════════════════════════ */}
            {step === 0 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle>Histologie & Morphologie tumorale</SectionTitle>

                {/* 🎤 Saisie vocale — identique à NewPatientPage */}
                <VoiceDictation
                  formType="diagnostic"
                  onFieldsExtracted={applyVoiceFields}
                />
                <Divider />

                {/* Champ patient caché */}
                <input type="hidden" {...register('patient')} value={patientId} />

                <Row>
                  <Field label="Code topographie (ICD-O-3) *" error={errors.topographie_code?.message}>
                    <input
                      {...register('topographie_code', { required: 'Code topographie requis' })}
                      placeholder="Ex: C50.9"
                      style={inputStyle(errors.topographie_code)}
                    />
                  </Field>
                  <Field label="Libellé topographie">
                    <input
                      {...register('topographie_libelle')}
                      placeholder="Ex: Sein, sans précision"
                      style={inputStyle()}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Code morphologie (ICD-O-3)">
                    <input
                      {...register('morphologie_code')}
                      placeholder="Ex: 8500/3"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="Libellé morphologie">
                    <input
                      {...register('morphologie_libelle')}
                      placeholder="Ex: Carcinome canalaire infiltrant"
                      style={inputStyle()}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Type de diagnostic">
                    <select {...register('type_diagnostic')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {TYPE_DIAG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Latéralité">
                    <select {...register('lateralite')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {LATERALITE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Base du diagnostic">
                    <select {...register('base_diagnostic')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {BASE_DIAG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Grade histologique">
                    <select {...register('grade_histologique')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {GRADE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                </Row>
                <Field label="Variante histologique">
                  <input
                    {...register('variante_histologique')}
                    placeholder="Ex: Lobulaire, Mucineux..."
                    style={inputStyle()}
                  />
                </Field>
                <Field label="Immunohistochimie (IHC)">
                  <textarea
                    {...register('immunohistochimie')}
                    rows={3}
                    placeholder="Ex: RE+++ 90%, RP+ 40%, HER2 négatif, Ki67 15%..."
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }}
                  />
                </Field>
                <Field label="Rapport anatomopathologique complet">
                  <textarea
                    {...register('rapport_complet')}
                    rows={4}
                    placeholder="Compte-rendu anatomopathologique..."
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }}
                  />
                </Field>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 1 — Staging TNM & Stade
                ══════════════════════════════════════════════════ */}
            {step === 1 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle>Staging TNM & Classification</SectionTitle>

                {/* 🎤 Saisie vocale */}
                <VoiceDictation
                  formType="diagnostic"
                  onFieldsExtracted={applyVoiceFields}
                />
                <Divider />

                <Row>
                  <Field label="Date du diagnostic *" error={errors.date_diagnostic?.message}>
                    <input
                      type="date"
                      {...register('date_diagnostic', { required: 'Date requise' })}
                      style={inputStyle(errors.date_diagnostic)}
                    />
                  </Field>
                  <Field label="Stade AJCC">
                    <select {...register('stade_ajcc')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {STADE_OPTIONS.map(s => <option key={s} value={s}>Stade {s}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="État d'extension">
                    <select {...register('etat_cancer')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {ETAT_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Type TNM">
                    <select {...register('tnm_type')} style={selectStyle()}>
                      <option value="c">cTNM — Clinique</option>
                      <option value="p">pTNM — Pathologique</option>
                      <option value="y">yTNM — Post-thérapeutique</option>
                    </select>
                  </Field>
                </Row>

                <SectionTitle style={{ marginTop: 20 }}>Valeurs TNM</SectionTitle>
                <Row>
                  <Field label="T — Tumeur primitive">
                    <input
                      {...register('tnm_t')}
                      placeholder="Ex: T2, Tis, T4b"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="N — Ganglions régionaux">
                    <input
                      {...register('tnm_n')}
                      placeholder="Ex: N0, N1, N2a"
                      style={inputStyle()}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="M — Métastases à distance">
                    <input
                      {...register('tnm_m')}
                      placeholder="Ex: M0, M1, M1a"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="Édition TNM">
                    <input
                      {...register('tnm_edition')}
                      type="number"
                      placeholder="Ex: 8"
                      style={inputStyle()}
                    />
                  </Field>
                </Row>
                <Row>
                  <Field label="Taille de la tumeur (mm)">
                    <input
                      {...register('taille_tumeur')}
                      type="number"
                      placeholder="Ex: 25"
                      style={inputStyle()}
                    />
                  </Field>
                  <Field label="Ganglions envahis / prélevés">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input {...register('nombre_ganglions')} type="number" placeholder="Envahis" style={inputStyle()} />
                      <input {...register('nombre_ganglions_preleves')} type="number" placeholder="Prélevés" style={inputStyle()} />
                    </div>
                  </Field>
                </Row>
                <Field label="Sites métastasiques">
                  <input
                    {...register('metastases_sites')}
                    placeholder="Ex: Foie, poumons, os..."
                    style={inputStyle()}
                  />
                </Field>
                <Field label="Performance status (OMS 0–4)">
                  <select {...register('performance_status')} style={selectStyle()}>
                    <option value="">— Sélectionner —</option>
                    <option value="0">0 — Activité normale</option>
                    <option value="1">1 — Symptômes légers</option>
                    <option value="2">2 — Alité &lt; 50% du temps</option>
                    <option value="3">3 — Alité &gt; 50% du temps</option>
                    <option value="4">4 — Complètement invalide</option>
                    <option value="U">U — Inconnu</option>
                  </select>
                </Field>
                <Field label="Observations cliniques">
                  <textarea
                    {...register('observations')}
                    rows={3}
                    placeholder="Contexte clinique, symptômes présentés..."
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }}
                  />
                </Field>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 2 — Marqueurs biologiques
                ══════════════════════════════════════════════════ */}
            {step === 2 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle>Marqueurs biologiques & Récepteurs</SectionTitle>

                {/* 🎤 Saisie vocale */}
                <VoiceDictation
                  formType="diagnostic"
                  onFieldsExtracted={applyVoiceFields}
                />
                <Divider />

                <SectionTitle style={{ marginTop: 4 }}>Récepteurs hormonaux & HER2</SectionTitle>
                <Row>
                  <Field label="Récepteurs œstrogènes (RE)">
                    <select {...register('recepteur_re')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {MARQUEUR_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="% RE">
                    <input {...register('recepteur_re_pourcentage')} type="number" min="0" max="100" placeholder="Ex: 90" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Récepteurs progestérone (RP)">
                    <select {...register('recepteur_rp')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      {MARQUEUR_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="% RP">
                    <input {...register('recepteur_rp_pourcentage')} type="number" min="0" max="100" placeholder="Ex: 40" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="HER2 (IHC)">
                    <select {...register('her2')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      <option value="positif">✓ Positif (3+)</option>
                      <option value="equivoque">~ Équivoque (2+)</option>
                      <option value="negatif">✗ Négatif (0/1+)</option>
                      <option value="inconnu">Inconnu</option>
                    </select>
                  </Field>
                  <Field label="HER2 FISH">
                    <select {...register('her2_fish')} style={selectStyle()}>
                      <option value="non_fait">Non fait</option>
                      <option value="amplifie">Amplifié</option>
                      <option value="non_amplifie">Non amplifié</option>
                    </select>
                  </Field>
                </Row>

                <SectionTitle style={{ marginTop: 20 }}>Marqueurs tumoraux</SectionTitle>
                <Row>
                  <Field label="Ki67 (%)"><input {...register('ki67')} placeholder="Ex: 15%" style={inputStyle()} /></Field>
                  <Field label="PSA (ng/mL)"><input {...register('psa')} placeholder="Ex: 4.2" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="CEA"><input {...register('cea')} placeholder="Ex: 3.5 ng/mL" style={inputStyle()} /></Field>
                  <Field label="CA 19-9"><input {...register('ca_19_9')} placeholder="Ex: 37 U/mL" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="CA 125"><input {...register('ca_125')} placeholder="Ex: 35 U/mL" style={inputStyle()} /></Field>
                  <Field label="AFP"><input {...register('afp')} placeholder="Ex: 10 ng/mL" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="PD-L1"><input {...register('pdl1')} placeholder="Ex: 50%" style={inputStyle()} /></Field>
                  <Field label="Statut MMR">
                    <select {...register('mmr_status')} style={selectStyle()}>
                      <option value="">— Sélectionner —</option>
                      <option value="proficient">pMMR — Proficient</option>
                      <option value="deficient">dMMR — Déficient</option>
                      <option value="inconnu">Inconnu</option>
                    </select>
                  </Field>
                </Row>

                <SectionTitle style={{ marginTop: 20 }}>Biologie moléculaire</SectionTitle>
                <Row>
                  <Field label="EGFR"><select {...register('egfr')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="KRAS"><select {...register('kras')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="BRAF"><select {...register('braf')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="ALK"><select {...register('alk')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="BRCA1"><select {...register('brca1')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="BRCA2"><select {...register('brca2')} style={selectStyle()}><option value="">—</option>{MOLEC_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="TMB (mut/Mb)"><input {...register('tmb')} type="number" placeholder="Ex: 12" style={inputStyle()} /></Field>
                  <Field label="Panel NGS"><input {...register('panel_ngs')} placeholder="Ex: Foundation One CDx" style={inputStyle()} /></Field>
                </Row>
                <Field label="Thérapie ciblée recommandée">
                  <input {...register('therapie_ciblee_recommandee')} placeholder="Ex: Trastuzumab + Pertuzumab" style={inputStyle()} />
                </Field>
                <Field label="Autres marqueurs / altérations">
                  <textarea {...register('autres_marqueurs')} rows={2} placeholder="Autres données biologiques..." style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 3 — Prise en charge & Récapitulatif
                ══════════════════════════════════════════════════ */}
            {step === 3 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle>Prise en charge médicale</SectionTitle>

                {/* 🎤 Saisie vocale */}
                <VoiceDictation
                  formType="diagnostic"
                  onFieldsExtracted={applyVoiceFields}
                />
                <Divider />

                <Row>
                  <Field label="Médecin diagnostiqueur">
                    <input {...register('medecin_diagnostiqueur')} placeholder="Dr Benali" style={inputStyle()} />
                  </Field>
                  <Field label="Établissement de diagnostic">
                    <input {...register('etablissement_diagnostic')} placeholder="CHU Oran" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Date du 1er symptôme">
                    <input type="date" {...register('date_premier_symptome')} style={inputStyle()} />
                  </Field>
                  <Field label="N° de dossier local">
                    <input {...register('numero_dossier')} placeholder="Ex: D-2024-0042" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="CIM-10 — Code">
                    <input {...register('cim10_code')} placeholder="Ex: C50.9" style={inputStyle()} />
                  </Field>
                  <Field label="CIM-10 — Libellé">
                    <input {...register('cim10_libelle')} placeholder="Ex: Tumeur maligne du sein" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Statut du dossier">
                    <select {...register('statut_dossier')} style={selectStyle()}>
                      {STATUT_DOSSIER_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Diagnostic principal">
                    <select {...register('est_principal')} style={selectStyle()}>
                      <option value="true">Oui</option>
                      <option value="false">Non</option>
                    </select>
                  </Field>
                </Row>

                <SectionTitle style={{ marginTop: 20 }}>Imagerie réalisée</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                  {[
                    { key: 'img_scanner',       label: 'Scanner'        },
                    { key: 'img_irm_cerebrale', label: 'IRM cérébrale'  },
                    { key: 'img_pet_scan',      label: 'PET-Scan'       },
                    { key: 'img_echographie',   label: 'Échographie'    },
                    { key: 'img_radiographie',  label: 'Radiographie'   },
                    { key: 'img_scintigraphie', label: 'Scintigraphie'  },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0' }}>
                      <input type="checkbox" {...register(key)} style={{ width: 15, height: 15, accentColor: 'var(--accent)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                    </label>
                  ))}
                </div>

                {/* Récapitulatif — identique au style NewPatientPage */}
                <div style={{
                  marginTop: 24, padding: '14px 16px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(0,168,255,0.2)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
                    Récapitulatif du diagnostic
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Topographie :</strong>{' '}
                    {saved[0]?.topographie_code || '—'} — {saved[0]?.topographie_libelle || '—'}
                    <br />
                    <strong style={{ color: 'var(--text-primary)' }}>Date :</strong>{' '}
                    {saved[1]?.date_diagnostic || '—'} ·{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>Stade :</strong>{' '}
                    {saved[1]?.stade_ajcc ? `Stade ${saved[1].stade_ajcc}` : '—'}
                    <br />
                    <strong style={{ color: 'var(--text-primary)' }}>TNM :</strong>{' '}
                    {[saved[1]?.tnm_t, saved[1]?.tnm_n, saved[1]?.tnm_m].filter(Boolean).join(' ') || '—'}
                    <br />
                    <strong style={{ color: 'var(--text-primary)' }}>Morphologie :</strong>{' '}
                    {saved[0]?.morphologie_libelle || saved[0]?.morphologie_code || '—'}
                  </div>
                </div>
              </div>
            )}

            {/* ── Navigation ─────────────────────────────────── */}
            <div style={{
              display: 'flex', gap: 10, marginTop: 28,
              paddingTop: 20, borderTop: '1px solid var(--border)',
            }}>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => { setStep(s => s - 1); reset(saved[step - 1]); }}
                  style={{
                    flex: '0 0 110px', padding: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)', fontSize: 13.5, cursor: 'pointer',
                  }}
                >Retour</button>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1, padding: '12px',
                  background: step === 3
                    ? 'linear-gradient(135deg, var(--success), #00b38a)'
                    : 'linear-gradient(135deg, #00a8ff, #0080cc)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  color: '#fff', fontSize: 13.5, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting
                  ? <><Spinner /> Enregistrement...</>
                  : step === 3 ? 'Enregistrer le diagnostic' : 'Continuer'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS PAYLOAD
// ─────────────────────────────────────────────────────────────
function buildPayload(steps, patientId) {
  const payload = Object.assign({}, ...steps);
  payload.patient = patientId;
  // Nettoyage des champs vides
  Object.keys(payload).forEach(k => {
    if (payload[k] === '' || payload[k] === undefined) delete payload[k];
  });
  // Convertir est_principal en booléen
  if ('est_principal' in payload) {
    payload.est_principal = payload.est_principal === 'true' || payload.est_principal === true;
  }
  // Convertir les checkboxes
  ['img_scanner','img_irm_cerebrale','img_pet_scan','img_echographie','img_radiographie','img_scintigraphie'].forEach(k => {
    if (k in payload) payload[k] = Boolean(payload[k]);
  });
  return payload;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPOSANTS — identiques à NewPatientPage
// ─────────────────────────────────────────────────────────────
function SectionTitle({ children, style: s }) {
  return (
    <h3 style={{
      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
      marginBottom: 18, fontFamily: 'var(--font-display)', ...s,
    }}>{children}</h3>
  );
}
function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>;
}
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500,
        color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.3,
      }}>{label}</label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 11.5, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
function Divider() {
  return <div style={{ margin: '12px 0', height: 1, background: 'var(--border)' }} />;
}
function Spinner() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}
const inputStyle = (err) => ({
  width: '100%', padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid ' + (err ? 'var(--danger)' : 'var(--border-light)'),
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontSize: 13.5,
  outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
});
const selectStyle = (err) => ({ ...inputStyle(err), cursor: 'pointer' });
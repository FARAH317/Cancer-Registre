import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { traitementService } from '../../services/traitementService';
import { patientService } from '../../services/patientService';
import { diagnosticService } from '../../services/diagnosticService';
import { AppLayout } from '../../components/layout/Sidebar';

const TYPE_CONFIG = {
  chimio:    { label: 'Chimiothérapie',  color: '#00a8ff' },
  radio:     { label: 'Radiothérapie',   color: '#f5a623' },
  chirurgie: { label: 'Chirurgie',       color: '#ff4d6a' },
  hormono:   { label: 'Hormonothérapie', color: '#00e5a0' },
  immuno:    { label: 'Immunothérapie',  color: '#c084fc' },
};

export default function NewTraitementPage() {
  const navigate = useNavigate();
  // ✅ FIX : récupérer aussi setSearchParams
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'chimio';
  const cfg  = TYPE_CONFIG[type] || TYPE_CONFIG.chimio;

  const [submitting,  setSubmitting]  = useState(false);
  const [patients,    setPatients]    = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      patient:              searchParams.get('patient') || '',
      intention:            'curatif',
      statut:               'planifie',
      tnm_type:             'c',
      voie_administration:  'iv_perf',
      voie_abord:           'ouverte',
      type_chirurgie:       'curative',
      ligne:                1,
      association_chimio:   false,
      curage_ganglionnaire: false,
      medicaments:          [],
    },
  });

  const { fields: medFields, append: addMed, remove: removeMed } = useFieldArray({ control, name: 'medicaments' });
  const patientId = watch('patient');

  useEffect(() => {
    patientService.list({ page_size: 200 }).then(({ data }) => setPatients(data.results || data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientId) { setDiagnostics([]); return; }
    diagnosticService.parPatient(patientId).then(({ data }) => setDiagnostics(data || [])).catch(() => setDiagnostics([]));
  }, [patientId]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      Object.keys(payload).forEach(k => { if (payload[k] === '' || payload[k] === null) delete payload[k]; });
      const svc = traitementService[type];
      const { data: result } = await svc.create(payload);
      toast.success(`${cfg.label} enregistré avec succès !`);
      navigate(`/traitements/${type}/${result.id}`);
    } catch (err) {
      const errs = err.response?.data;
      toast.error(errs ? Object.values(errs).flat().join(' ') : 'Erreur lors de la création.');
    } finally { setSubmitting(false); }
  };

  return (
    <AppLayout title={`Nouveau traitement – ${cfg.label}`}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* ✅ FIX : <button type="button" onClick> au lieu de <a href> */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSearchParams({ type: k })}
              style={{
                padding: '8px 14px',
                background: k === type ? `${v.color}18` : 'var(--bg-card)',
                border: `1px solid ${k === type ? v.color + '40' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-md)',
                color: k === type ? v.color : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: k === type ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all .15s',
                fontFamily: 'var(--font-body)',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: `1px solid ${cfg.color}20`, borderRadius: 'var(--radius-lg)', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Nouveau – {cfg.label}
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Commun : Patient, Diagnostic, Dates */}
            <Section title="Patient & Contexte">
              <Row2>
                <Field label="Patient *" error={errors.patient?.message}>
                  <select {...register('patient', { required: 'Champ requis' })} style={selectSt}>
                    <option value="">Sélectionner...</option>
                    {patients.map(p => (
                      <option style={{ backgroundColor: 'white' }} key={p.id} value={p.id}>{p.registration_number} – {p.full_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Diagnostic associé">
                  <select {...register('diagnostic')} style={selectSt}>
                    <option value="">Aucun / Non spécifié</option>
                    {diagnostics.map(d => (
                      <option style={{ backgroundColor: 'white' }} key={d.id} value={d.id}>{d.topographie_code} – {d.topographie_libelle} ({new Date(d.date_diagnostic).toLocaleDateString('fr-DZ')})</option>
                    ))}
                  </select>
                </Field>
              </Row2>
              <Row2>
                <Field label="Date de début *" error={errors.date_debut?.message}>
                  <input type="date" {...register('date_debut', { required: 'Champ requis' })} style={inputSt} />
                </Field>
                <Field label="Date de fin (prévue)">
                  <input type="date" {...register('date_fin')} style={inputSt} />
                </Field>
              </Row2>
              <Row2>
                <Field label="Intention thérapeutique">
                  <select {...register('intention')} style={selectSt}>
                    <option style={{ backgroundColor: 'white' }} value="curatif">Curatif</option>
                    <option style={{ backgroundColor: 'white' }} value="adjuvant">Adjuvant</option>
                    <option style={{ backgroundColor: 'white' }} value="neo_adjuvant">Néo-adjuvant</option>
                    <option style={{ backgroundColor: 'white' }} value="palliatif">Palliatif</option>
                    <option style={{ backgroundColor: 'white' }} value="prophylactique">Prophylactique</option>
                  </select>
                </Field>
                <Field label="Statut">
                  <select {...register('statut')} style={selectSt}>
                    <option style={{ backgroundColor: 'white' }} value="planifie">Planifié</option>
                    <option style={{ backgroundColor: 'white' }} value="en_cours">En cours</option>
                    <option style={{ backgroundColor: 'white' }} value="termine">Terminé</option>
                    <option style={{ backgroundColor: 'white' }} value="suspendu">Suspendu</option>
                    <option style={{ backgroundColor: 'white' }} value="abandonne">Abandonné</option>
                  </select>
                </Field>
              </Row2>
              <Row2>
                <Field label="Établissement">
                  <input {...register('etablissement')} placeholder="CHU Oran" style={inputSt} />
                </Field>
                <Field label="Médecin responsable">
                  <input {...register('medecin')} placeholder="Dr. Benali" style={inputSt} />
                </Field>
              </Row2>
            </Section>

            {/* ── CHIMIO spécifique ─────────────────────────── */}
            {type === 'chimio' && <>
              <Section title="Protocole de chimiothérapie">
                <Row2>
                  <Field label="Protocole">
                    <input {...register('protocole')} placeholder="Ex: AC-T, FOLFOX, R-CHOP, BEP" style={inputSt} />
                  </Field>
                  <Field label="Ligne de traitement">
                    <select {...register('ligne')} style={selectSt}>
                      {[1, 2, 3, 4, 5].map(n => <option style={{ backgroundColor: 'white' }} key={n} value={n}>{n === 1 ? '1ère' : `${n}ème`} ligne</option>)}
                    </select>
                  </Field>
                </Row2>
                <Row3>
                  <Field label="Nombre de cycles prévu">
                    <input type="number" {...register('nombre_cycles')} min={1} placeholder="Ex: 6" style={inputSt} />
                  </Field>
                  <Field label="Cycles réalisés">
                    <input type="number" {...register('cycles_realises')} min={0} defaultValue={0} style={inputSt} />
                  </Field>
                  <Field label="Intervalle (jours)">
                    <input type="number" {...register('intervalle_jours')} placeholder="Ex: 21" style={inputSt} />
                  </Field>
                </Row3>
                <Field label="Voie d'administration">
                  <select {...register('voie_administration')} style={selectSt}>
                    <option style={{ backgroundColor: 'white' }} value="iv_perf">IV Perfusion</option>
                    <option style={{ backgroundColor: 'white' }} value="iv_bolus">IV Bolus</option>
                    <option style={{ backgroundColor: 'white' }} value="po">Per os (oral)</option>
                    <option style={{ backgroundColor: 'white' }} value="sc">Sous-cutanée</option>
                    <option style={{ backgroundColor: 'white' }} value="im">Intramusculaire</option>
                    <option style={{ backgroundColor: 'white' }} value="it">Intrathécale</option>
                    <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                  </select>
                </Field>
              </Section>
              <Section title="Médicaments du protocole">
                {medFields.map((field, idx) => (
                  <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 36px', gap: 8, marginBottom: 10, alignItems: 'end' }}>
                    <Field label={idx === 0 ? 'DCI *' : ''}>
                      <input {...register(`medicaments.${idx}.dci`, { required: true })} placeholder="Ex: Doxorubicine" style={inputSt} />
                    </Field>
                    <Field label={idx === 0 ? 'Dose' : ''}>
                      <input type="number" {...register(`medicaments.${idx}.dose`)} placeholder="60" style={inputSt} />
                    </Field>
                    <Field label={idx === 0 ? 'Unité' : ''}>
                      <select {...register(`medicaments.${idx}.unite_dose`)} style={selectSt}>
                        <option style={{ backgroundColor: 'white' }} value="mg/m2">mg/m²</option>
                        <option style={{ backgroundColor: 'white' }} value="mg/kg">mg/kg</option>
                        <option style={{ backgroundColor: 'white' }} value="mg">mg</option>
                        <option style={{ backgroundColor: 'white' }} value="AUC">AUC</option>
                        <option style={{ backgroundColor: 'white' }} value="UI">UI</option>
                      </select>
                    </Field>
                    <Field label={idx === 0 ? 'Jours' : ''}>
                      <input {...register(`medicaments.${idx}.jour_administration`)} placeholder="J1" style={inputSt} />
                    </Field>
                    <div style={{ paddingBottom: 2 }}>
                      <button type="button" onClick={() => removeMed(idx)} style={{ width: 32, height: 36, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 6, color: '#ff4d6a', cursor: 'pointer', fontSize: 16 }}>×</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addMed({ dci: '', dose: '', unite_dose: 'mg/m2', jour_administration: 'J1' })}
                  style={{ padding: '7px 14px', background: 'rgba(0,168,255,0.08)', border: '1px dashed rgba(0,168,255,0.3)', borderRadius: 8, color: '#00a8ff', fontSize: 12, cursor: 'pointer' }}>
                  + Ajouter un médicament
                </button>
              </Section>
              <Section title="Évaluation de la réponse">
                <Row2>
                  <Field label="Réponse tumorale">
                    <select {...register('reponse_tumorale')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="">Non évaluée</option>
                      <option style={{ backgroundColor: 'white' }} value="RC">RC – Réponse complète</option>
                      <option style={{ backgroundColor: 'white' }} value="RP">RP – Réponse partielle</option>
                      <option style={{ backgroundColor: 'white' }} value="SD">SD – Stabilisation</option>
                      <option style={{ backgroundColor: 'white' }} value="PD">PD – Progression</option>
                      <option style={{ backgroundColor: 'white' }} value="NE">NE – Non évaluable</option>
                    </select>
                  </Field>
                  <Field label="Date d'évaluation">
                    <input type="date" {...register('date_evaluation')} style={inputSt} />
                  </Field>
                </Row2>
                <Row2>
                  <Field label="Grade de toxicité (CTCAE)">
                    <select {...register('toxicite_grade')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="">—</option>
                      {[0, 1, 2, 3, 4, 5].map(g => <option style={{ backgroundColor: 'white' }} key={g} value={g}>Grade {g}{g === 0 ? ' – Aucune' : g === 1 ? ' – Légère' : g === 2 ? ' – Modérée' : g === 3 ? ' – Sévère' : g === 4 ? ' – Engageant le pronostic vital' : ' – Décès'}</option>)}
                    </select>
                  </Field>
                  <Field label="Description toxicité">
                    <input {...register('toxicite_description')} placeholder="Ex: Neutropénie G3" style={inputSt} />
                  </Field>
                </Row2>
              </Section>
            </>}

            {/* ── RADIO spécifique ──────────────────────────── */}
            {type === 'radio' && <>
              <Section title="Paramètres de radiothérapie">
                <Row2>
                  <Field label="Site irradié *" error={errors.site_irradie?.message}>
                    <input {...register('site_irradie', { required: 'Champ requis' })} placeholder="Ex: Sein gauche, Pelvis" style={inputSt} />
                  </Field>
                  <Field label="Technique">
                    <select {...register('technique')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="RTE">Radiothérapie externe (RTE)</option>
                      <option style={{ backgroundColor: 'white' }} value="RCMI">RCMI (modulation d'intensité)</option>
                      <option style={{ backgroundColor: 'white' }} value="RTE_3D">RTE conformationnelle 3D</option>
                      <option style={{ backgroundColor: 'white' }} value="STRT">Stéréotaxie (SBRT/SRST)</option>
                      <option style={{ backgroundColor: 'white' }} value="curie">Curiethérapie</option>
                      <option style={{ backgroundColor: 'white' }} value="tomo">Tomothérapie</option>
                      <option style={{ backgroundColor: 'white' }} value="cyber">CyberKnife</option>
                      <option style={{ backgroundColor: 'white' }} value="proton">Protonthérapie</option>
                      <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                    </select>
                  </Field>
                </Row2>
                <Row3>
                  <Field label="Dose totale (Gy)">
                    <input type="number" step="0.1" {...register('dose_totale_gy')} placeholder="Ex: 50" style={inputSt} />
                  </Field>
                  <Field label="Dose/séance (Gy)">
                    <input type="number" step="0.1" {...register('dose_par_seance_gy')} placeholder="Ex: 2" style={inputSt} />
                  </Field>
                  <Field label="Nombre de séances">
                    <input type="number" {...register('nombre_seances')} placeholder="Ex: 25" style={inputSt} />
                  </Field>
                </Row3>
                <Row2>
                  <Field label="Séances réalisées">
                    <input type="number" {...register('seances_realisees')} defaultValue={0} style={inputSt} />
                  </Field>
                  <Field label="Énergie (MeV)">
                    <input {...register('energie_mev')} placeholder="Ex: 6MV, 15MV" style={inputSt} />
                  </Field>
                </Row2>
                <Field label="">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" {...register('association_chimio')} style={{ width: 14, height: 14 }} />
                    Radiochimiothérapie concomitante
                  </label>
                </Field>
              </Section>
              <Section title="Toxicités">
                <Row2>
                  <Field label="Toxicité aiguë">
                    <textarea {...register('toxicite_aigue')} rows={2} placeholder="Mucite, Épidermite..." style={{ ...inputSt, resize: 'vertical' }} />
                  </Field>
                  <Field label="Toxicité tardive">
                    <textarea {...register('toxicite_tardive')} rows={2} placeholder="Fibrose, Lymphœdème..." style={{ ...inputSt, resize: 'vertical' }} />
                  </Field>
                </Row2>
              </Section>
            </>}

            {/* ── CHIRURGIE spécifique ─────────────────────── */}
            {type === 'chirurgie' && <>
              <Section title="Détails de l'acte chirurgical">
                <Field label="Intitulé de l'acte *" error={errors.intitule_acte?.message}>
                  <input {...register('intitule_acte', { required: 'Champ requis' })} placeholder="Ex: Mastectomie totale gauche + curage axillaire" style={inputSt} />
                </Field>
                <Row2>
                  <Field label="Type de chirurgie">
                    <select {...register('type_chirurgie')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="curative">Curative</option>
                      <option style={{ backgroundColor: 'white' }} value="palliative">Palliative</option>
                      <option style={{ backgroundColor: 'white' }} value="cyto">Cytoréductrice</option>
                      <option style={{ backgroundColor: 'white' }} value="recons">Reconstructrice</option>
                      <option style={{ backgroundColor: 'white' }} value="diagnostic">Diagnostique / biopsie</option>
                      <option style={{ backgroundColor: 'white' }} value="ganglion">Curage ganglionnaire</option>
                      <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                    </select>
                  </Field>
                  <Field label="Voie d'abord">
                    <select {...register('voie_abord')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="ouverte">Chirurgie ouverte</option>
                      <option style={{ backgroundColor: 'white' }} value="laparo">Laparoscopie</option>
                      <option style={{ backgroundColor: 'white' }} value="thoraco">Thoracoscopie</option>
                      <option style={{ backgroundColor: 'white' }} value="robot">Robotique</option>
                      <option style={{ backgroundColor: 'white' }} value="endo">Endoscopie</option>
                      <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                    </select>
                  </Field>
                </Row2>
                <Row2>
                  <Field label="Chirurgien">
                    <input {...register('chirurgien')} placeholder="Dr. Benali" style={inputSt} />
                  </Field>
                  <Field label="Marges de résection">
                    <select {...register('marges_resection')} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="">Non renseigné</option>
                      <option style={{ backgroundColor: 'white' }} value="R0">R0 – Marges saines</option>
                      <option style={{ backgroundColor: 'white' }} value="R1">R1 – Microscopiquement incomplète</option>
                      <option style={{ backgroundColor: 'white' }} value="R2">R2 – Macroscopiquement incomplète</option>
                      <option style={{ backgroundColor: 'white' }} value="RX">RX – Non évaluable</option>
                    </select>
                  </Field>
                </Row2>
                <Row3>
                  <Field label="">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
                      <input type="checkbox" {...register('curage_ganglionnaire')} style={{ width: 14, height: 14 }} />
                      Curage ganglionnaire
                    </label>
                  </Field>
                  <Field label="Ganglions prélevés">
                    <input type="number" {...register('nb_ganglions_preleves')} placeholder="Ex: 15" style={inputSt} />
                  </Field>
                  <Field label="Ganglions envahis">
                    <input type="number" {...register('nb_ganglions_envahis')} placeholder="Ex: 3" style={inputSt} />
                  </Field>
                </Row3>
                <Row2>
                  <Field label="Durée d'hospitalisation (jours)">
                    <input type="number" {...register('duree_hospitalisation')} placeholder="Ex: 5" style={inputSt} />
                  </Field>
                </Row2>
                <Field label="Complications">
                  <textarea {...register('complications')} rows={2} placeholder="Ex: Infection du site opératoire..." style={{ ...inputSt, resize: 'vertical' }} />
                </Field>
                <Field label="Compte rendu opératoire">
                  <textarea {...register('compte_rendu_operatoire')} rows={3} placeholder="Résumé du compte rendu..." style={{ ...inputSt, resize: 'vertical' }} />
                </Field>
              </Section>
            </>}

            {/* ── HORMONO spécifique ───────────────────────── */}
            {type === 'hormono' && <>
              <Section title="Hormonothérapie">
                <Row2>
                  <Field label="Type *" error={errors.type_hormonotherapie?.message}>
                    <select {...register('type_hormonotherapie', { required: 'Champ requis' })} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="">Sélectionner...</option>
                      <option style={{ backgroundColor: 'white' }} value="anti_estro">Anti-estrogène (Tamoxifène)</option>
                      <option style={{ backgroundColor: 'white' }} value="anti_andro">Anti-androgène</option>
                      <option style={{ backgroundColor: 'white' }} value="aromatase">Inhibiteur de l'aromatase</option>
                      <option style={{ backgroundColor: 'white' }} value="lhrh">Analogue LH-RH</option>
                      <option style={{ backgroundColor: 'white' }} value="progest">Progestatif</option>
                      <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                    </select>
                  </Field>
                  <Field label="Molécule (DCI) *" error={errors.molecule?.message}>
                    <input {...register('molecule', { required: 'Champ requis' })} placeholder="Ex: Tamoxifène, Anastrozole, Leuproréline" style={inputSt} />
                  </Field>
                </Row2>
                <Row2>
                  <Field label="Dose (mg/jour)">
                    <input type="number" step="0.01" {...register('dose_mg_jour')} placeholder="Ex: 20" style={inputSt} />
                  </Field>
                  <Field label="Durée prévue (mois)">
                    <input type="number" {...register('duree_mois_prevue')} placeholder="Ex: 60" style={inputSt} />
                  </Field>
                </Row2>
              </Section>
            </>}

            {/* ── IMMUNO spécifique ────────────────────────── */}
            {type === 'immuno' && <>
              <Section title="Immunothérapie / Thérapie ciblée">
                <Row2>
                  <Field label="Type *" error={errors.type_immunotherapie?.message}>
                    <select {...register('type_immunotherapie', { required: 'Champ requis' })} style={selectSt}>
                      <option style={{ backgroundColor: 'white' }} value="">Sélectionner...</option>
                      <option style={{ backgroundColor: 'white' }} value="checkpoint">Inhibiteur de checkpoint (anti-PD1, anti-PDL1)</option>
                      <option style={{ backgroundColor: 'white' }} value="anti_her2">Anti-HER2 (Trastuzumab, Pertuzumab)</option>
                      <option style={{ backgroundColor: 'white' }} value="anti_vegf">Anti-VEGF (Bevacizumab)</option>
                      <option style={{ backgroundColor: 'white' }} value="anti_egfr">Anti-EGFR (Cetuximab)</option>
                      <option style={{ backgroundColor: 'white' }} value="imatinib">Inhibiteur de tyrosine kinase (Imatinib, Erlotinib)</option>
                      <option style={{ backgroundColor: 'white' }} value="cart">CAR-T Cell</option>
                      <option style={{ backgroundColor: 'white' }} value="autre">Autre</option>
                    </select>
                  </Field>
                  <Field label="Molécule (DCI) *" error={errors.molecule?.message}>
                    <input {...register('molecule', { required: 'Champ requis' })} placeholder="Ex: Pembrolizumab, Trastuzumab" style={inputSt} />
                  </Field>
                </Row2>
                <Row3>
                  <Field label="Dose">
                    <input {...register('dose')} placeholder="Ex: 200mg q3w" style={inputSt} />
                  </Field>
                  <Field label="Nombre de cycles">
                    <input type="number" {...register('nombre_cycles')} placeholder="Ex: 8" style={inputSt} />
                  </Field>
                  <Field label="Biomarqueur cible">
                    <input {...register('biomarqueur_cible')} placeholder="Ex: PDL1, HER2, EGFR" style={inputSt} />
                  </Field>
                </Row3>
                <Field label="Réponse tumorale">
                  <select {...register('reponse_tumorale')} style={selectSt}>
                    <option style={{ backgroundColor: 'white' }} value="">Non évaluée</option>
                    <option style={{ backgroundColor: 'white' }} value="RC">RC – Réponse complète</option>
                    <option style={{ backgroundColor: 'white' }} value="RP">RP – Réponse partielle</option>
                    <option style={{ backgroundColor: 'white' }} value="SD">SD – Stabilisation</option>
                    <option style={{ backgroundColor: 'white' }} value="PD">PD – Progression</option>
                    <option style={{ backgroundColor: 'white' }} value="NE">NE – Non évaluable</option>
                  </select>
                </Field>
              </Section>
            </>}

            {/* Observations communes */}
            <Section title="Observations">
              <Field label="Notes cliniques">
                <textarea {...register('observations')} rows={3} placeholder="Informations complémentaires..." style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }} />
              </Field>
            </Section>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={() => navigate('/traitements')} style={{ flex: '0 0 110px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                ← Annuler
              </button>
              <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <><Spinner /> Enregistrement...</> : `Enregistrer ${cfg.label.toLowerCase()}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</div>
      {children}
    </div>
  );
}
function Row2({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>; }
function Row3({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>{children}</div>; }
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: 0.3 }}>{label}</label>}
      {children}
      {error && <p style={{ marginTop: 3, fontSize: 11, color: 'var(--danger)' }}>⚠ {error}</p>}
    </div>
  );
}
function Spinner() { return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />; }

const inputSt  = { width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' };
const selectSt = { ...inputSt, cursor: 'pointer' };
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { suiviService } from '../../services/suiviService';
import { patientService } from '../../services/patientService';
import { AppLayout } from '../../components/layout/Sidebar';

export default function NewConsultationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients]     = useState([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      patient:           searchParams.get('patient') || '',
      type_consultation: 'suivi',
      statut:            'realisee',
    }
  });

  const poids = watch('poids_kg');
  const taille = watch('taille_cm');
  const imc = poids && taille ? (poids / ((taille/100) ** 2)).toFixed(1) : null;

  useEffect(() => {
    patientService.list({ page_size: 200 }).then(({ data }) => setPatients(data.results || data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      const { data: result } = await suiviService.consultations.create(payload);
      toast.success('Consultation enregistrée !');
      navigate(`/suivi/consultations/${result.id}`);
    } catch (err) {
      toast.error(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Erreur');
    } finally { setSubmitting(false); }
  };

  return (
    <AppLayout title="Nouvelle Consultation de Suivi">
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid rgba(155,138,251,0.2)', borderRadius:'var(--radius-lg)', padding:'28px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:24 }}>📋</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Consultation de suivi</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            <Section title="Patient & Contexte">
              <Row2>
                <Field label="Patient *" error={errors.patient?.message}>
                  <select {...register('patient', { required: 'Champ requis' })} style={selSt}>
                    <option value="">Sélectionner un patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.registration_number} – {p.full_name}</option>)}
                  </select>
                </Field>
                <Field label="Date de consultation *" error={errors.date_consultation?.message}>
                  <input type="date" {...register('date_consultation', { required: 'Champ requis' })} style={inputSt} />
                </Field>
              </Row2>
              <Row2>
                <Field label="Type de consultation">
                  <select {...register('type_consultation')} style={selSt}>
                    <option value="suivi">Suivi standard</option>
                    <option value="post_trt">Post-traitement</option>
                    <option value="urgence">Urgence</option>
                    <option value="bilan">Bilan d'extension</option>
                    <option value="annonce">Consultation d'annonce</option>
                    <option value="palliative">Soins palliatifs</option>
                    <option value="psycho">Psycho-oncologie</option>
                    <option value="dietet">Diététique</option>
                  </select>
                </Field>
                <Field label="Statut">
                  <select {...register('statut')} style={selSt}>
                    <option value="realisee">Réalisée</option>
                    <option value="planifiee">Planifiée</option>
                    <option value="annulee">Annulée</option>
                    <option value="reportee">Reportée</option>
                  </select>
                </Field>
              </Row2>
              <Field label="Établissement">
                <input {...register('etablissement')} placeholder="CHU Oran" style={inputSt} />
              </Field>
            </Section>

            <Section title="Paramètres cliniques">
              <Row3>
                <Field label="Poids (kg)">
                  <input type="number" step="0.1" {...register('poids_kg')} placeholder="70.5" style={inputSt} />
                </Field>
                <Field label="Taille (cm)">
                  <input type="number" {...register('taille_cm')} placeholder="170" style={inputSt} />
                </Field>
                <Field label="IMC (calculé)">
                  <div style={{ padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontFamily:'var(--font-mono)', fontSize:13, color: imc ? (imc < 18.5 || imc > 30 ? '#f5a623' : '#00e5a0') : 'var(--text-muted)' }}>
                    {imc ? `${imc} kg/m²` : '—'}
                  </div>
                </Field>
              </Row3>
              <Row3>
                <Field label="TA Systolique (mmHg)">
                  <input type="number" {...register('ta_systolique')} placeholder="120" style={inputSt} />
                </Field>
                <Field label="TA Diastolique (mmHg)">
                  <input type="number" {...register('ta_diastolique')} placeholder="80" style={inputSt} />
                </Field>
                <Field label="Fréquence cardiaque">
                  <input type="number" {...register('frequence_cardiaque')} placeholder="75" style={inputSt} />
                </Field>
              </Row3>
              <Row2>
                <Field label="Température (°C)">
                  <input type="number" step="0.1" {...register('temperature')} placeholder="37.2" style={inputSt} />
                </Field>
                <Field label="Performance Status (ECOG)">
                  <select {...register('ps_ecog')} style={selSt}>
                    <option value="">— Non évalué —</option>
                    <option value="0">PS 0 – Asymptomatique</option>
                    <option value="1">PS 1 – Symptomatique, activité normale</option>
                    <option value="2">PS 2 – Symptomatique, alité {'<'}50%</option>
                    <option value="3">PS 3 – Alité {'>'}50% de la journée</option>
                    <option value="4">PS 4 – Grabataire</option>
                  </select>
                </Field>
              </Row2>
            </Section>

            <Section title="Évolution de la maladie">
              <Row2>
                <Field label="Évolution tumorale">
                  <select {...register('evolution_maladie')} style={selSt}>
                    <option value="">— Non évaluée —</option>
                    <option value="stable">Stable</option>
                    <option value="regression">Régression</option>
                    <option value="progression">Progression</option>
                    <option value="remission">Rémission complète</option>
                    <option value="inconnu">Non évaluable</option>
                  </select>
                </Field>
                <Field label="Prochaine consultation">
                  <input type="date" {...register('prochaine_consultation')} style={inputSt} />
                </Field>
              </Row2>
              <Field label="Marqueurs biologiques">
                <input {...register('marqueurs_biologiques')} placeholder="CEA: 2.1, CA125: 35, PSA: 4.2..." style={inputSt} />
              </Field>
            </Section>

            <Section title="Compte rendu clinique">
              <Field label="Motif de consultation">
                <textarea {...register('motif')} rows={2} placeholder="Suivi post-chimiothérapie cycle 4..." style={{ ...inputSt, resize:'vertical', lineHeight:1.6 }} />
              </Field>
              <Field label="Examen clinique">
                <textarea {...register('examen_clinique')} rows={3} placeholder="État général satisfaisant, PS 1. Pas d'adénopathie palpable..." style={{ ...inputSt, resize:'vertical', lineHeight:1.6 }} />
              </Field>
              <Field label="Conclusion">
                <textarea {...register('conclusion')} rows={2} placeholder="Réponse tumorale satisfaisante, tolérance correcte..." style={{ ...inputSt, resize:'vertical', lineHeight:1.6 }} />
              </Field>
              <Field label="Conduite à tenir">
                <textarea {...register('conduite_a_tenir')} rows={3} placeholder="Poursuite chimio cycle 5. Bilan hépatique. Prochain RDV dans 3 semaines..." style={{ ...inputSt, resize:'vertical', lineHeight:1.6 }} />
              </Field>
            </Section>

            <div style={{ display:'flex', gap:10, paddingTop:20, borderTop:'1px solid var(--border)' }}>
              <button type="button" onClick={() => navigate('/suivi')} style={{ flex:'0 0 110px', padding:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>← Annuler</button>
              <button type="submit" disabled={submitting} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg, #9b8afb, #7c6fcd)', border:'none', borderRadius:'var(--radius-md)', color:'#fff', fontSize:13.5, fontWeight:600, fontFamily:'var(--font-display)', cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:submitting?0.7:1 }}>
                {submitting ? <><Spin/> Enregistrement...</> : ' Enregistrer la consultation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ── New Evenement Page (inline) ───────────────────────────────────
export function NewEvenementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients]     = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onSubmit',
    defaultValues: { patient: searchParams.get('patient') || '', resolu: false }
  });

  useEffect(() => {
    patientService.list({ page_size: 200 }).then(({ data }) => setPatients(data.results || data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { data: result } = await suiviService.evenements.create(data);
      toast.success('Événement enregistré !');
      navigate(`/suivi`);
    } catch (err) {
      toast.error(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Erreur');
    } finally { setSubmitting(false); }
  };

  return (
    <AppLayout title="Nouvel Événement Clinique">
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid rgba(255,120,50,0.2)', borderRadius:'var(--radius-lg)', padding:'28px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:24 }}>⚡</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Événement clinique</h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Section title="Patient & Événement">
              <Row2>
                <Field label="Patient *" error={errors.patient?.message}>
                  <select {...register('patient', { required: 'Champ requis' })} style={selSt}>
                    <option value="">Sélectionner...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.registration_number} – {p.full_name}</option>)}
                  </select>
                </Field>
                <Field label="Date de l'événement *" error={errors.date_evenement?.message}>
                  <input type="date" {...register('date_evenement', { required: 'Champ requis' })} style={inputSt} />
                </Field>
              </Row2>
              <Row2>
                <Field label="Type d'événement *" error={errors.type_evenement?.message}>
                  <select {...register('type_evenement', { required: 'Champ requis' })} style={selSt}>
                    <option value="">Sélectionner...</option>
                    <option value="hospit">Hospitalisation</option>
                    <option value="complic">Complication</option>
                    <option value="recidive">Récidive / Rechute</option>
                    <option value="meta">Nouvelle métastase</option>
                    <option value="toxicite">Toxicité traitement</option>
                    <option value="deces">Décès</option>
                    <option value="remission">Rémission confirmée</option>
                    <option value="autre">Autre</option>
                  </select>
                </Field>
                <Field label="Sévérité (grade CTCAE)">
                  <select {...register('severite')} style={selSt}>
                    <option value="">— Non gradé —</option>
                    <option value="1">Grade 1 – Légère</option>
                    <option value="2">Grade 2 – Modérée</option>
                    <option value="3">Grade 3 – Sévère</option>
                    <option value="4">Grade 4 – Critique</option>
                    <option value="5">Grade 5 – Décès</option>
                  </select>
                </Field>
              </Row2>
              <Field label="Description *" error={errors.description?.message}>
                <textarea {...register('description', { required: 'Champ requis' })} rows={3} placeholder="Description détaillée de l'événement..." style={{ ...inputSt, resize:'vertical' }} />
              </Field>
              <Row2>
                <Field label="Date de résolution">
                  <input type="date" {...register('date_resolution')} style={inputSt} />
                </Field>
                <Field label="Durée hospitalisation (jours)">
                  <input type="number" {...register('hospitalisation_duree')} placeholder="Ex: 5" style={inputSt} />
                </Field>
              </Row2>
              <Field label="Impact sur le traitement">
                <textarea {...register('traitement_consequence')} rows={2} placeholder="Arrêt chimio, réduction de dose..." style={{ ...inputSt, resize:'vertical' }} />
              </Field>
              <Field label="">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>
                  <input type="checkbox" {...register('resolu')} style={{ width:14, height:14 }} />
                  Événement résolu
                </label>
              </Field>
            </Section>

            <div style={{ display:'flex', gap:10, paddingTop:16, borderTop:'1px solid var(--border)' }}>
              <button type="button" onClick={() => navigate('/suivi')} style={{ flex:'0 0 110px', padding:'11px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>← Annuler</button>
              <button type="submit" disabled={submitting} style={{ flex:1, padding:'11px', background:'linear-gradient(135deg, #ff7832, #ff4d6a)', border:'none', borderRadius:'var(--radius-md)', color:'#fff', fontSize:13, fontWeight:600, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:submitting?0.7:1 }}>
                {submitting ? <><Spin/> Enregistrement...</> : ' Enregistrer l\'événement'}
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
    <div style={{ marginBottom:24 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>{title}</div>
      {children}
    </div>
  );
}
function Row2({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>{children}</div>; }
function Row3({ children }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0 12px' }}>{children}</div>; }
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontSize:11.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 }}>{label}</label>}
      {children}
      {error && <p style={{ marginTop:3, fontSize:11, color:'var(--danger)' }}>⚠ {error}</p>}
    </div>
  );
}
function Spin() { return <div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />; }
const inputSt = { width:'100%', padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:13, outline:'none', fontFamily:'var(--font-body)', boxSizing:'border-box' };
const selSt   = { ...inputSt, cursor:'pointer' };

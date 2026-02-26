import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { patientService } from '../../services/patientService';
import { AppLayout } from '../../components/layout/Sidebar';

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent',
  'Ghardaïa','Relizane',
];

const STEPS = [
  { label: 'Identité',      icon: '👤' },
  { label: 'Coordonnées',   icon: '📍' },
  { label: 'Profil',        icon: '📋' },
  { label: 'Antécédents',   icon: '🏥' },
];

export default function NewPatientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState([{}, {}, {}, {}]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    mode: 'onSubmit',
  });

  const onStepSubmit = async (data) => {
    const updated = saved.map((s, i) => i === step ? data : s);
    setSaved(updated);
    if (step < 3) { setStep(s => s + 1); reset(saved[step + 1]); return; }

    // Final submit
    setSubmitting(true);
    try {
      const payload = Object.assign({}, ...updated);
      // Nettoyer les champs vides
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === undefined) delete payload[k];
      });
      const { data: patient } = await patientService.create(payload);
      toast.success(`Patient ${patient.registration_number} créé avec succès !`);
      navigate(`/patients/${patient.id}`);
    } catch (err) {
      const errors = err.response?.data;
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Erreur lors de la création.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Nouveau Patient">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 12px', textAlign: 'center',
              background: i === step ? 'var(--accent-dim)' : i < step ? 'rgba(0,229,160,0.08)' : 'transparent',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: i < step ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
            onClick={() => i < step && setStep(i)}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--text-muted)' }}>
                {i < step ? '✓ ' : ''}{s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
        }}>
          <form onSubmit={handleSubmit(onStepSubmit)}>

            {/* ── Step 0 : Identité ── */}
            {step === 0 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle icon="👤">Identité du patient</SectionTitle>
                <Row>
                  <Field label="Nom *" error={errors.nom?.message}>
                    <input {...register('nom', { required: 'Nom requis' })} placeholder="BENALI" style={inputStyle(errors.nom)} />
                  </Field>
                  <Field label="Prénom *" error={errors.prenom?.message}>
                    <input {...register('prenom', { required: 'Prénom requis' })} placeholder="Mohamed" style={inputStyle(errors.prenom)} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Nom de jeune fille">
                    <input {...register('nom_jeune_fille')} placeholder="Si applicable" style={inputStyle()} />
                  </Field>
                  <Field label="N° identité nationale">
                    <input {...register('id_national')} placeholder="Ex: 1234567890" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Sexe *" error={errors.sexe?.message}>
                    <select {...register('sexe', { required: 'Sexe requis' })} style={selectStyle(errors.sexe)}>
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                      <option value="U">Inconnu</option>
                    </select>
                  </Field>
                  <Field label="Date de naissance">
                    <input type="date" {...register('date_naissance')} style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Âge au diagnostic">
                    <input type="number" {...register('age_diagnostic')} placeholder="Ex: 54" min="0" max="120" style={inputStyle()} />
                  </Field>
                  <Field label="Lieu de naissance">
                    <input {...register('lieu_naissance')} placeholder="Oran" style={inputStyle()} />
                  </Field>
                </Row>
                <Field label="Nationalité">
                  <input {...register('nationalite')} defaultValue="Algérienne" style={inputStyle()} />
                </Field>
              </div>
            )}

            {/* ── Step 1 : Coordonnées ── */}
            {step === 1 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle icon="📍">Coordonnées & Adresse</SectionTitle>
                <Field label="Adresse complète">
                  <textarea {...register('adresse')} placeholder="Rue, N°, quartier..." rows={2}
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
                <Row>
                  <Field label="Commune">
                    <input {...register('commune')} placeholder="Oran" style={inputStyle()} />
                  </Field>
                  <Field label="Wilaya">
                    <select {...register('wilaya')} style={selectStyle()}>
                      <option value="">Sélectionner</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Code postal">
                    <input {...register('code_postal')} placeholder="31000" style={inputStyle()} />
                  </Field>
                  <Field label="Téléphone principal">
                    <input {...register('telephone')} placeholder="+213 5xx xxx xxx" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Téléphone secondaire">
                    <input {...register('telephone2')} placeholder="+213 5xx xxx xxx" style={inputStyle()} />
                  </Field>
                  <Field label="Email">
                    <input type="email" {...register('email')} placeholder="patient@email.com" style={inputStyle()} />
                  </Field>
                </Row>
                <SectionTitle icon="🚨" style={{ marginTop: 24 }}>Contact d'urgence</SectionTitle>
                <Row>
                  <Field label="Nom du contact">
                    <input {...register('contact_nom')} placeholder="Benali" style={inputStyle()} />
                  </Field>
                  <Field label="Prénom">
                    <input {...register('contact_prenom')} placeholder="Ali" style={inputStyle()} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Lien de parenté">
                    <input {...register('contact_lien')} placeholder="Ex: Époux, Fils, Sœur" style={inputStyle()} />
                  </Field>
                  <Field label="Téléphone">
                    <input {...register('contact_telephone')} placeholder="+213 5xx xxx xxx" style={inputStyle()} />
                  </Field>
                </Row>
              </div>
            )}

            {/* ── Step 2 : Profil ── */}
            {step === 2 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle icon="📋">Profil socio-démographique</SectionTitle>
                <Row>
                  <Field label="Niveau d'instruction">
                    <select {...register('niveau_instruction')} style={selectStyle()}>
                      <option value="9">Inconnu</option>
                      <option value="0">Aucun</option>
                      <option value="1">Primaire</option>
                      <option value="2">Moyen</option>
                      <option value="3">Secondaire</option>
                      <option value="4">Supérieur</option>
                    </select>
                  </Field>
                  <Field label="Profession">
                    <select {...register('profession')} style={selectStyle()}>
                      <option value="INC">Inconnu</option>
                      <option value="AGR">Agriculteur</option>
                      <option value="FON">Fonctionnaire</option>
                      <option value="COM">Commerçant</option>
                      <option value="ART">Artisan</option>
                      <option value="ETU">Étudiant</option>
                      <option value="RET">Retraité</option>
                      <option value="SEM">Sans emploi</option>
                      <option value="FFO">Femme au foyer</option>
                      <option value="PSA">Professionnel de santé</option>
                      <option value="AUT">Autre</option>
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Situation familiale">
                    <select {...register('situation_familiale')} style={selectStyle()}>
                      <option value="inconnu">Inconnu</option>
                      <option value="celibataire">Célibataire</option>
                      <option value="marie">Marié(e)</option>
                      <option value="divorce">Divorcé(e)</option>
                      <option value="veuf">Veuf/Veuve</option>
                    </select>
                  </Field>
                  <Field label="Nombre d'enfants">
                    <input type="number" {...register('nombre_enfants')} placeholder="0" min="0" style={inputStyle()} />
                  </Field>
                </Row>
                <SectionTitle icon="🏥" style={{ marginTop: 24 }}>Prise en charge</SectionTitle>
                <Field label="Établissement de prise en charge">
                  <input {...register('etablissement_pec')} placeholder="CHU Oran" style={inputStyle()} />
                </Field>
                <Row>
                  <Field label="Statut du dossier">
                    <select {...register('statut_dossier')} style={selectStyle()}>
                      <option value="nouveau">Nouveau</option>
                      <option value="traitement">En traitement</option>
                      <option value="remission">Rémission</option>
                      <option value="perdu">Perdu de vue</option>
                    </select>
                  </Field>
                  <Field label="Statut vital">
                    <select {...register('statut_vital')} style={selectStyle()}>
                      <option value="inconnu">Inconnu</option>
                      <option value="vivant">Vivant</option>
                      <option value="decede">Décédé</option>
                      <option value="perdu">Perdu de vue</option>
                    </select>
                  </Field>
                </Row>
                <Field label="Notes">
                  <textarea {...register('notes')} placeholder="Notes complémentaires..." rows={3}
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
              </div>
            )}

            {/* ── Step 3 : Antécédents ── */}
            {step === 3 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <SectionTitle icon="🏥">Antécédents médicaux</SectionTitle>
                <Field label="Antécédents personnels">
                  <textarea {...register('antecedents_personnels')} rows={3}
                    placeholder="Maladies, chirurgies, hospitalisations antérieures..."
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
                <Field label="Antécédents familiaux (cancer)">
                  <textarea {...register('antecedents_familiaux')} rows={3}
                    placeholder="Antécédents familiaux de cancer, lien de parenté..."
                    style={{ ...inputStyle(), resize: 'vertical', lineHeight: 1.5 }} />
                </Field>
                <Row>
                  <Field label="Tabagisme">
                    <select {...register('tabagisme')} style={selectStyle()}>
                      <option value="inconnu">Inconnu</option>
                      <option value="non">Non-fumeur</option>
                      <option value="ex">Ex-fumeur</option>
                      <option value="actif">Fumeur actif</option>
                    </select>
                  </Field>
                  <Field label="Consommation d'alcool">
                    <select {...register('alcool')} style={selectStyle()}>
                      <option value="inconnu">Inconnu</option>
                      <option value="non">Non</option>
                      <option value="oui">Oui</option>
                    </select>
                  </Field>
                </Row>

                {/* Résumé avant soumission */}
                <div style={{
                  marginTop: 20, padding: '14px 16px',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(0,168,255,0.2)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
                    ✓ Récapitulatif du dossier
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Patient :</strong> {saved[0]?.prenom} {saved[0]?.nom}<br/>
                    <strong style={{ color: 'var(--text-primary)' }}>Sexe :</strong> {saved[0]?.sexe === 'M' ? 'Masculin' : saved[0]?.sexe === 'F' ? 'Féminin' : '—'} ·{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>Âge :</strong> {saved[0]?.age_diagnostic || '—'} ans<br/>
                    <strong style={{ color: 'var(--text-primary)' }}>Wilaya :</strong> {saved[1]?.wilaya || '—'} ·{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>Tél :</strong> {saved[1]?.telephone || '—'}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)} style={{
                  flex: '0 0 110px', padding: '12px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                  fontSize: 13.5, cursor: 'pointer',
                }}>← Retour</button>
              )}
              <button type="submit" disabled={submitting} style={{
                flex: 1, padding: '12px',
                background: step === 3
                  ? 'linear-gradient(135deg, var(--success), #00b38a)'
                  : 'linear-gradient(135deg, #00a8ff, #0080cc)',
                border: 'none', borderRadius: 'var(--radius-md)',
                color: '#fff', fontSize: 13.5, fontWeight: 600,
                fontFamily: 'var(--font-display)', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: submitting ? 0.7 : 1,
              }}>
                {submitting
                  ? <><Spinner /> Enregistrement...</>
                  : step === 3 ? '✓ Enregistrer le patient' : 'Continuer →'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function SectionTitle({ icon, children, style: s }) {
  return (
    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18, fontFamily: 'var(--font-display)', ...s }}>
      <span>{icon}</span>{children}
    </h3>
  );
}
function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>;
}
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ marginTop: 4, fontSize: 11.5, color: 'var(--danger)' }}>⚠ {error}</p>}
    </div>
  );
}
function Spinner() {
  return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />;
}
const inputStyle = (err) => ({
  width: '100%', padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: `1px solid ${err ? 'var(--danger)' : 'var(--border-light)'}`,
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontSize: 13.5,
  outline: 'none', fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
});
const selectStyle = (err) => ({
  ...inputStyle(err), cursor: 'pointer',
});

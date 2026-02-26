import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

const STATUT_COLORS = {
  nouveau:    { bg: 'rgba(155,138,251,0.15)', color: '#9b8afb', border: 'rgba(155,138,251,0.3)' },
  traitement: { bg: 'rgba(0,168,255,0.12)',   color: '#00a8ff', border: 'rgba(0,168,255,0.3)' },
  remission:  { bg: 'rgba(0,229,160,0.12)',   color: '#00e5a0', border: 'rgba(0,229,160,0.3)' },
  perdu:      { bg: 'rgba(245,166,35,0.12)',  color: '#f5a623', border: 'rgba(245,166,35,0.3)' },
  decede:     { bg: 'rgba(255,77,106,0.12)',  color: '#ff4d6a', border: 'rgba(255,77,106,0.3)' },
  archive:    { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identite');

  useEffect(() => {
    patientService.get(id)
      .then(({ data }) => setPatient(data))
      .catch(() => { toast.error('Patient introuvable'); navigate('/patients'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <AppLayout title="Fiche Patient">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Chargement du dossier...
        </div>
      </div>
    </AppLayout>
  );

  if (!patient) return null;

  const sc = STATUT_COLORS[patient.statut_dossier] || STATUT_COLORS.archive;
  const TABS = [
    { key: 'identite',    label: 'Identité' },
    { key: 'coordonnees', label: 'Coordonnées' },
    { key: 'profil',      label: 'Profil' },
    { key: 'antecedents', label: 'Antécédents' },
    { key: 'contacts',    label: 'Contacts' },
  ];

  return (
    <AppLayout title="Fiche Patient">
      {/* Header card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: patient.sexe === 'F' ? 'linear-gradient(135deg, rgba(245,101,196,0.2), rgba(245,101,196,0.1))' : 'linear-gradient(135deg, rgba(0,168,255,0.2), rgba(0,168,255,0.1))',
            border: `2px solid ${patient.sexe === 'F' ? 'rgba(245,101,196,0.3)' : 'rgba(0,168,255,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {patient.sexe === 'F' ? '👩' : '👨'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                {patient.nom} {patient.prenom}
              </h2>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              }}>{patient.statut_label}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Info icon="🗂" val={patient.registration_number} mono />
              <Info icon="📅" val={patient.age ? `${patient.age} ans` : '—'} />
              <Info icon="📍" val={patient.wilaya || '—'} />
              <Info icon="👨‍⚕️" val={patient.medecin_referent_info?.full_name || '—'} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/patients/${id}/modifier`} style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '9px 18px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ✏️ Modifier
            </button>
          </Link>
          <Link to="/patients" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '9px 18px', background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
            }}>
              ← Retour
            </button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)', overflow: 'hidden',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: '12px 8px', background: 'none',
            border: 'none', borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12.5, fontWeight: activeTab === t.key ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'var(--font-body)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>

        {activeTab === 'identite' && (
          <Grid>
            <InfoRow label="N° Enregistrement" value={patient.registration_number} mono />
            <InfoRow label="N° Identité nationale" value={patient.id_national || '—'} mono />
            <InfoRow label="Nom complet" value={`${patient.nom} ${patient.prenom}`} />
            <InfoRow label="Nom de jeune fille" value={patient.nom_jeune_fille || '—'} />
            <InfoRow label="Sexe" value={patient.sexe_label} />
            <InfoRow label="Date de naissance" value={patient.date_naissance ? new Date(patient.date_naissance).toLocaleDateString('fr-DZ') : '—'} />
            <InfoRow label="Âge" value={patient.age ? `${patient.age} ans` : patient.age_diagnostic ? `${patient.age_diagnostic} ans (au diagnostic)` : '—'} />
            <InfoRow label="Lieu de naissance" value={patient.lieu_naissance || '—'} />
            <InfoRow label="Nationalité" value={patient.nationalite || '—'} />
            <InfoRow label="Statut vital" value={patient.statut_vital_label} />
            {patient.date_deces && <InfoRow label="Date de décès" value={new Date(patient.date_deces).toLocaleDateString('fr-DZ')} />}
            {patient.cause_deces && <InfoRow label="Cause du décès" value={patient.cause_deces} />}
          </Grid>
        )}

        {activeTab === 'coordonnees' && (
          <Grid>
            <InfoRow label="Adresse" value={patient.adresse || '—'} full />
            <InfoRow label="Commune" value={patient.commune || '—'} />
            <InfoRow label="Wilaya" value={patient.wilaya || '—'} />
            <InfoRow label="Code postal" value={patient.code_postal || '—'} mono />
            <InfoRow label="Téléphone" value={patient.telephone || '—'} mono />
            <InfoRow label="Téléphone 2" value={patient.telephone2 || '—'} mono />
            <InfoRow label="Email" value={patient.email || '—'} />
          </Grid>
        )}

        {activeTab === 'profil' && (
          <Grid>
            <InfoRow label="Niveau d'instruction" value={patient.instruction_label} />
            <InfoRow label="Profession" value={patient.profession_label} />
            <InfoRow label="Situation familiale" value={patient.situation_familiale || '—'} />
            <InfoRow label="Nombre d'enfants" value={patient.nombre_enfants ?? '—'} />
            <InfoRow label="Établissement de PEC" value={patient.etablissement_pec || '—'} />
            <InfoRow label="Médecin référent" value={patient.medecin_referent_info?.full_name || '—'} />
            <InfoRow label="Statut dossier" value={patient.statut_label} />
            {patient.notes && <InfoRow label="Notes" value={patient.notes} full />}
            <InfoRow label="Enregistré le" value={new Date(patient.date_enregistrement).toLocaleString('fr-DZ')} />
            <InfoRow label="Dernière modification" value={new Date(patient.date_modification).toLocaleString('fr-DZ')} />
          </Grid>
        )}

        {activeTab === 'antecedents' && (
          <Grid>
            <InfoRow label="Tabagisme" value={patient.tabagisme} />
            <InfoRow label="Alcool" value={patient.alcool} />
            <InfoRow label="Antécédents personnels" value={patient.antecedents_personnels || 'Aucun renseigné'} full />
            <InfoRow label="Antécédents familiaux" value={patient.antecedents_familiaux || 'Aucun renseigné'} full />
          </Grid>
        )}

        {activeTab === 'contacts' && (
          <div>
            {patient.contacts_urgence?.length > 0 ? (
              patient.contacts_urgence.map((c, i) => (
                <div key={i} style={{
                  padding: '14px 18px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 10,
                  display: 'flex', gap: 24, flexWrap: 'wrap',
                }}>
                  <InfoRow label="Nom" value={`${c.nom} ${c.prenom}`} />
                  <InfoRow label="Lien" value={c.lien} />
                  <InfoRow label="Téléphone" value={c.telephone} mono />
                  {c.telephone2 && <InfoRow label="Téléphone 2" value={c.telephone2} mono />}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                Aucun contact d'urgence enregistré
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────
function Info({ icon, val, mono }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-secondary)' }}>
      {icon} <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', color: 'var(--text-primary)' }}>{val}</span>
    </span>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>{children}</div>;
}

function InfoRow({ label, value, mono, full }) {
  return (
    <div style={{
      padding: '10px 0', borderBottom: '1px solid var(--border)',
      gridColumn: full ? '1 / -1' : 'auto',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: 13.5, color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

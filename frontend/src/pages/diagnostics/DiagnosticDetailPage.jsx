import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { diagnosticService } from '../../services/diagnosticService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

const STADE_COLORS = {
  '0':'#00e5a0','I':'#00e5a0','IA':'#00e5a0','IB':'#00e5a0',
  'II':'#f5a623','IIA':'#f5a623','IIB':'#f5a623','IIC':'#f5a623',
  'III':'#ff7832','IIIA':'#ff7832','IIIB':'#ff7832','IIIC':'#ff7832',
  'IV':'#ff4d6a','U':'#9ca3af',
};

export default function DiagnosticDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('icd');

  useEffect(() => {
    diagnosticService.get(id)
      .then(({ data }) => setDiag(data))
      .catch(() => { toast.error('Diagnostic introuvable'); navigate('/diagnostics'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout title="Diagnostic"><Loader /></AppLayout>;
  if (!diag)   return null;

  const stadeColor = STADE_COLORS[diag.stade_ajcc] || '#9ca3af';
  const TABS = [
    { key: 'icd',       label: ' ICD-O-3' },
    { key: 'tnm',       label: 'TNM & Stade' },
    { key: 'marqueurs', label: ' Marqueurs' },
    { key: 'etabl',     label: ' Établissement' },
  ];

  return (
    <AppLayout title="Fiche Diagnostic">

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(155,138,251,0.15)', border: '1px solid rgba(155,138,251,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                {diag.topographie_libelle || 'Diagnostic'}
              </h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Code val={diag.topographie_code} color="#00a8ff" />
                {diag.morphologie_code && <Code val={diag.morphologie_code} color="#9b8afb" />}
                {diag.tnm_complet && diag.tnm_complet !== '—' && <Code val={diag.tnm_complet} color="#00e5a0" />}
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${stadeColor}18`, color: stadeColor, border: `1px solid ${stadeColor}30`, fontFamily: 'var(--font-mono)' }}>
                  Stade {diag.stade_ajcc === 'U' ? 'Inconnu' : diag.stade_ajcc}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <InfoChip icon="👤" label={diag.patient_nom} sub={diag.patient_numero} />
            <InfoChip icon="📅" label={new Date(diag.date_diagnostic).toLocaleDateString('fr-DZ')} sub="Date de diagnostic" />
            {diag.lateralite_label && diag.lateralite !== '0' && <InfoChip icon="↔" label={diag.lateralite_label} sub="Latéralité" />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/diagnostics/${id}/modifier`} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12.5, cursor: 'pointer' }}>✏️ Modifier</button>
          </Link>
          <Link to={`/patients/${diag.patient}`} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)', borderRadius: 8, color: '#00a8ff', fontSize: 12.5, cursor: 'pointer' }}>👤 Voir patient</button>
          </Link>
          <Link to="/diagnostics" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12.5, cursor: 'pointer' }}>← Retour</button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '12px 8px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#9b8afb' : 'transparent'}`, color: tab === t.key ? '#9b8afb' : 'var(--text-muted)', fontSize: 12.5, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>

        {tab === 'icd' && (
          <Grid>
            <InfoRow label="Code Topographie ICD-O-3" value={diag.topographie_code} mono />
            <InfoRow label="Localisation" value={diag.topographie_libelle || '—'} />
            <InfoRow label="Latéralité" value={diag.lateralite_label} />
            <InfoRow label="Code Morphologie ICD-O-3" value={diag.morphologie_code || '—'} mono />
            <InfoRow label="Type histologique" value={diag.morphologie_libelle || '—'} />
            <InfoRow label="Grade histologique" value={diag.grade_label} />
            <InfoRow label="Base du diagnostic" value={diag.base_diag_label} />
            <InfoRow label="N° bloc anatomopath." value={diag.numero_bloc_anapath || '—'} mono />
            <InfoRow label="Code CIM-10" value={diag.cim10_code || '—'} mono />
            <InfoRow label="Libellé CIM-10" value={diag.cim10_libelle || '—'} />
          </Grid>
        )}

        {tab === 'tnm' && (
          <div>
            {/* TNM visual */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Type TNM', val: diag.tnm_type === 'c' ? 'Clinique (c)' : diag.tnm_type === 'p' ? 'Pathologique (p)' : 'Post-thérap. (y)', color: '#00a8ff' },
                { label: 'T – Tumeur',    val: diag.tnm_t || '—', color: '#9b8afb' },
                { label: 'N – Ganglions', val: diag.tnm_n || '—', color: '#f5a623' },
                { label: 'M – Métastases',val: diag.tnm_m || '—', color: '#ff4d6a' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', border: `1px solid ${color}25`, borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', color, marginBottom: 4 }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
            <Grid>
              <InfoRow label="TNM complet" value={diag.tnm_complet} mono />
              <InfoRow label="Édition TNM" value={`${diag.tnm_edition}e édition`} />
              <InfoRow label="Stade AJCC / UICC" value={diag.stade_label} />
              {diag.taille_tumeur && <InfoRow label="Taille tumorale" value={`${diag.taille_tumeur} mm`} />}
              {diag.nombre_ganglions !== null && <InfoRow label="Ganglions envahis" value={diag.nombre_ganglions} />}
              {diag.metastases_sites && <InfoRow label="Sites métastatiques" value={diag.metastases_sites} full />}
            </Grid>
          </div>
        )}

        {tab === 'marqueurs' && (
          <Grid>
            {[
              { label: 'Récepteur ER', val: diag.recepteur_re || '—' },
              { label: 'Récepteur PR', val: diag.recepteur_rp || '—' },
              { label: 'HER2', val: diag.her2 || '—' },
              { label: 'Ki67', val: diag.ki67 || '—' },
              { label: 'PSA', val: diag.psa || '—' },
            ].map(({ label, val }) => <InfoRow key={label} label={label} value={val} />)}
            {diag.autres_marqueurs && <InfoRow label="Autres marqueurs" value={diag.autres_marqueurs} full />}
          </Grid>
        )}

        {tab === 'etabl' && (
          <Grid>
            <InfoRow label="Établissement diagnostiqueur" value={diag.etablissement_diagnostic || '—'} />
            <InfoRow label="Médecin diagnostiqueur" value={diag.medecin_diagnostiqueur || '—'} />
            <InfoRow label="Date de création" value={new Date(diag.date_creation).toLocaleString('fr-DZ')} />
            <InfoRow label="Dernière modification" value={new Date(diag.date_modification).toLocaleString('fr-DZ')} />
            {diag.est_principal !== undefined && <InfoRow label="Diagnostic principal" value={diag.est_principal ? 'Oui' : 'Non'} />}
            {diag.date_premier_symptome && <InfoRow label="Date premiers symptômes" value={new Date(diag.date_premier_symptome).toLocaleDateString('fr-DZ')} />}
            {diag.observations && <InfoRow label="Observations" value={diag.observations} full />}
          </Grid>
        )}

      </div>
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function Code({ val, color }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, padding: '2px 8px', background: `${color}15`, borderRadius: 5, border: `1px solid ${color}25` }}>{val}</span>;
}
function InfoChip({ icon, label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}
function Grid({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>{children}</div>; }
function InfoRow({ label, value, mono, full }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value || '—'}</div>
    </div>
  );
}
function Loader() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: '#9b8afb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      Chargement...
    </div>
  </div>;
}

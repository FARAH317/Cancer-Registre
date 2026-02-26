import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { suiviService } from '../../services/suiviService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

const EVOLUTION_COLORS = {
  stable:     { color:'#00a8ff', label:'Stable' },
  regression: { color:'#00e5a0', label:'Régression' },
  progression:{ color:'#ff4d6a', label:'Progression' },
  remission:  { color:'#4ade80', label:'Rémission' },
  inconnu:    { color:'#9ca3af', label:'Non évaluable' },
};
const STATUT_COLORS = {
  planifiee:{ color:'#9b8afb' }, realisee:{ color:'#00e5a0' },
  annulee:  { color:'#ff4d6a' }, reportee:{ color:'#f5a623' },
};
const PS_COLORS = ['#00e5a0','#4ade80','#f5a623','#ff7832','#ff4d6a'];

export default function ConsultationDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suiviService.consultations.get(id)
      .then(({ data: d }) => setData(d))
      .catch(() => { toast.error('Consultation introuvable'); navigate('/suivi'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AppLayout title="Consultation">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
        <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'#9b8afb', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      </div>
    </AppLayout>
  );
  if (!data) return null;

  const sc  = STATUT_COLORS[data.statut]   || { color:'#9ca3af' };
  const ec  = EVOLUTION_COLORS[data.evolution_maladie];
  const psColor = data.ps_ecog !== null && data.ps_ecog !== undefined ? PS_COLORS[data.ps_ecog] : '#9ca3af';

  return (
    <AppLayout title="Consultation de Suivi">
      {/* Header */}
      <div style={{ background:'var(--bg-card)', border:'1px solid rgba(155,138,251,0.2)', borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:46, height:46, borderRadius:12, background:'rgba(155,138,251,0.15)', border:'1px solid rgba(155,138,251,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📋</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>
                {data.type_label}
              </h2>
              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:`${sc.color}18`, color:sc.color, border:`1px solid ${sc.color}30` }}>{data.statut_label}</span>
              {ec && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:`${ec.color}18`, color:ec.color, border:`1px solid ${ec.color}30` }}>{ec.label}</span>}
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
              <Chip  val={data.patient_nom} sub={data.patient_numero} />
              <Chip  val={new Date(data.date_consultation).toLocaleDateString('fr-DZ', { day:'numeric', month:'long', year:'numeric' })} />
              {data.medecin_nom && <Chip val={data.medecin_nom} />}
              {data.etablissement && <Chip  val={data.etablissement} />}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to={`/patients/${data.patient}`} style={{ textDecoration:'none' }}>
            <button style={btnSt('#9b8afb')}> Patient</button>
          </Link>
          <Link to="/suivi" style={{ textDecoration:'none' }}>
            <button style={btnSt('var(--text-muted)', true)}>← Retour</button>
          </Link>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Paramètres cliniques */}
        <Card title="Paramètres cliniques" color="#9b8afb">
          {data.ps_ecog !== null && data.ps_ecog !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:11, color:'var(--text-muted)', width:120 }}>Performance Status</span>
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:`${psColor}18`, color:psColor, border:`1px solid ${psColor}30`, fontFamily:'var(--font-mono)' }}>
                PS {data.ps_ecog} — {data.ps_ecog_label}
              </span>
            </div>
          )}
          {data.poids_kg && <InfoRow label="Poids" value={`${data.poids_kg} kg`} />}
          {data.taille_cm && <InfoRow label="Taille" value={`${data.taille_cm} cm`} />}
          {data.imc && (
            <InfoRow label="IMC" value={
              <span style={{ fontFamily:'var(--font-mono)', color: data.imc < 18.5 ? '#f5a623' : data.imc > 30 ? '#ff4d6a' : '#00e5a0' }}>
                {data.imc} kg/m²
              </span>
            } />
          )}
          {(data.ta_systolique || data.ta_diastolique) && (
            <InfoRow label="Tension artérielle" value={<span style={{ fontFamily:'var(--font-mono)' }}>{data.ta_systolique}/{data.ta_diastolique} mmHg</span>} />
          )}
          {data.frequence_cardiaque && <InfoRow label="FC" value={`${data.frequence_cardiaque} bpm`} />}
          {data.temperature && <InfoRow label="Température" value={`${data.temperature} °C`} />}
          {data.marqueurs_biologiques && <InfoRow label="Marqueurs bio." value={data.marqueurs_biologiques} />}
        </Card>

        {/* Évolution & Planning */}
        <Card title="Évolution & Planning" color="#00a8ff">
          {data.evolution_maladie && ec && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:11, color:'var(--text-muted)', width:120 }}>Évolution tumorale</span>
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${ec.color}18`, color:ec.color, border:`1px solid ${ec.color}30` }}>{ec.label}</span>
            </div>
          )}
          {data.prochaine_consultation && (
            <InfoRow label="Prochaine RDV" value={
              <span style={{ fontFamily:'var(--font-mono)', color:'#00a8ff' }}>
                {new Date(data.prochaine_consultation).toLocaleDateString('fr-DZ', { day:'numeric', month:'long', year:'numeric' })}
              </span>
            } />
          )}
          <InfoRow label="Date création"   value={new Date(data.date_creation).toLocaleDateString('fr-DZ')} />
          <InfoRow label="Dernière modif." value={new Date(data.date_modification).toLocaleDateString('fr-DZ')} />
          {data.qualite_vie_id && (
            <div style={{ marginTop:12 }}>
              <Link to={`/suivi/qualite-vie/${data.qualite_vie_id}`} style={{ textDecoration:'none' }}>
                <button style={{ padding:'7px 14px', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:8, color:'#00e5a0', fontSize:12, cursor:'pointer' }}>
                   Voir évaluation QdV associée
                </button>
              </Link>
            </div>
          )}
        </Card>

        {/* Compte rendu */}
        {(data.motif || data.examen_clinique || data.conclusion || data.conduite_a_tenir) && (
          <div style={{ gridColumn:'1 / -1' }}>
            <Card title="Compte rendu clinique" color="#9b8afb">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
                {data.motif          && <InfoRow label="Motif"           value={data.motif} />}
                {data.conclusion     && <InfoRow label="Conclusion"      value={data.conclusion} />}
                {data.examen_clinique && <InfoRow label="Examen clinique" value={data.examen_clinique} />}
                {data.conduite_a_tenir && <InfoRow label="Conduite à tenir" value={data.conduite_a_tenir} />}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function Card({ title, color, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
      <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, borderLeft:`3px solid ${color}` }}>{title}</div>
      <div style={{ padding:'4px 16px 14px' }}>{children}</div>
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ padding:'9px 0', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'130px 1fr', gap:12, alignItems:'start' }}>
      <span style={{ fontSize:11, color:'var(--text-muted)', paddingTop:2 }}>{label}</span>
      <span style={{ fontSize:13, color:'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  );
}
function Chip({ icon, val, sub }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:12 }}>{icon}</span>
      <div>
        <div style={{ fontSize:12.5, color:'var(--text-primary)', fontWeight:500 }}>{val}</div>
        {sub && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{sub}</div>}
      </div>
    </div>
  );
}
const btnSt = (color, ghost) => ({
  padding:'8px 14px', background: ghost ? 'var(--bg-elevated)' : `${color}12`,
  border:`1px solid ${ghost ? 'var(--border)' : color+'25'}`,
  borderRadius:8, color, fontSize:12, cursor:'pointer',
});

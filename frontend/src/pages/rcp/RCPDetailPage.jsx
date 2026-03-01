import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rcpService } from '../../services/rcpService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

const STATUT_CFG = {
  planifiee:{ color:'#9b8afb', label:'Planifiée' },
  en_cours: { color:'#00a8ff', label:'En cours'  },
  terminee: { color:'#00e5a0', label:'Terminée'  },
  annulee:  { color:'#ff4d6a', label:'Annulée'   },
  reportee: { color:'#f5a623', label:'Reportée'  },
};
const DECISION_COLORS = {
  chir:'#ff4d6a', chimio:'#00a8ff', radio:'#f5a623', hormono:'#00e5a0',
  immuno:'#c084fc', radiochim:'#fb923c', surveill:'#38bdf8', support:'#9b8afb',
  palliatif:'#6b7280', essai:'#a78bfa', second:'#9ca3af', bilan:'#60a5fa',
  abstention:'#94a3b8', autre:'#9ca3af',
};
const PRIORITE_COLORS = { urgente:'#ff4d6a', rapide:'#f5a623', normale:'#00a8ff', differee:'#9ca3af' };
const TYPE_ICONS = { sein:'', digestif:'', poumon:'', orl:'', gyneco:'', uro:'', hemato:'', neuro:'', dermato:'', os:'', pediatrique:'', palliative:'', generale:'' };

export default function RCPDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab] = useState('dossiers');
  const [showDecisionModal, setShowDecisionModal] = useState(null); // dossier id
  const [decisionForm, setDecisionForm] = useState({ type_decision:'chimio', priorite:'normale', description:'', protocole:'' });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const reload = () => {
    rcpService.reunions.get(id)
      .then(({ data: d }) => setData(d))
      .catch(() => { toast.error('RCP introuvable'); navigate('/rcp'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [id]);

  const changerStatut = async (statut) => {
    try {
      await rcpService.reunions.changerStatut(id, statut);
      toast.success('Statut mis à jour !');
      reload();
    } catch { toast.error('Erreur'); }
  };

  const ajouterDecision = async (dossierId) => {
    if (!decisionForm.description) { toast.error('Description requise'); return; }
    setSubmittingDecision(true);
    try {
      await rcpService.dossiers.ajouterDecision(dossierId, decisionForm);
      toast.success('Décision enregistrée !');
      setShowDecisionModal(null);
      setDecisionForm({ type_decision:'chimio', priorite:'normale', description:'', protocole:'' });
      reload();
    } catch { toast.error('Erreur'); }
    finally { setSubmittingDecision(false); }
  };

  const marquerDecisionRealisee = async (decisionId) => {
    try {
      await rcpService.decisions.marquerRealise(decisionId);
      toast.success('Décision marquée réalisée !');
      reload();
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <AppLayout title="RCP"><Loader /></AppLayout>;
  if (!data)   return null;

  const sc = STATUT_CFG[data.statut] || { color:'#9ca3af', label:'—' };
  const totalDecisions = data.dossiers?.reduce((s, d) => s + (d.nb_decisions || 0), 0) || 0;

  return (
    <AppLayout title="Réunion RCP">
      {/* Header */}
      <div style={{ background:'var(--bg-card)', border:`1px solid ${sc.color}20`, borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ fontSize:32, lineHeight:1 }}>{TYPE_ICONS[data.type_rcp]}</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>{data.titre}</h2>
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:`${sc.color}18`, color:sc.color, border:`1px solid ${sc.color}30` }}>{sc.label}</span>
                <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, color:'var(--text-muted)', background:'var(--bg-elevated)', border:'1px solid var(--border)' }}>{data.type_label}</span>
              </div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <Chip icon="📅" val={new Date(data.date_reunion).toLocaleDateString('fr-DZ', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} />
                <Chip icon="⏰" val={`${data.heure_debut?.slice(0,5)}${data.heure_fin ? ' → '+data.heure_fin.slice(0,5) : ''}`} />
                {data.lieu && <Chip icon="📍" val={data.lieu} />}
                {data.coordinateur_nom && <Chip icon="👨‍⚕️" val={data.coordinateur_nom} />}
              </div>
            </div>
          </div>
          {/* Actions statut */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {data.statut === 'planifiee' && <BtnAction label="▶ Démarrer" color="#00a8ff" onClick={() => changerStatut('en_cours')} />}
            {data.statut === 'en_cours'  && <BtnAction label="✓ Terminer" color="#00e5a0" onClick={() => changerStatut('terminee')} />}
            {(data.statut === 'planifiee'||data.statut === 'en_cours') && (
              <BtnAction label="⊘ Annuler" color="#ff4d6a" onClick={() => changerStatut('annulee')} />
            )}
            <Link to="/rcp" style={{ textDecoration:'none' }}>
              <button style={{ padding:'8px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}>← Retour</button>
            </Link>
          </div>
        </div>

        {/* Métriques */}
        <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:14, borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
          {[
            { label:'Dossiers',  val:data.nombre_dossiers,          color:'#9b8afb' },
            { label:'Présents',  val:data.nombre_membres_presents,  color:'#00a8ff' },
            { label:'Décisions', val:totalDecisions,                color:'#00e5a0' },
            { label:'Prévus',    val:data.nombre_dossiers_prevus,   color:'#f5a623' },
          ].map(m => (
            <div key={m.label}>
              <span style={{ fontSize:20, fontWeight:800, fontFamily:'var(--font-display)', color:m.color }}>{m.val}</span>
              <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:5 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden', marginBottom:16 }}>
        {[
          { key:'dossiers',  label:`📋 Dossiers (${data.nombre_dossiers})`, color:'#9b8afb' },
          { key:'presences', label:`👥 Présences (${data.nombre_membres_presents})`, color:'#00a8ff' },
          { key:'cr',        label:'📝 Compte rendu', color:'#00e5a0' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, padding:'12px', background:'none', border:'none', borderBottom:`2px solid ${activeTab===t.key?t.color:'transparent'}`, color:activeTab===t.key?t.color:'var(--text-muted)', fontSize:13, fontWeight:activeTab===t.key?600:400, cursor:'pointer', fontFamily:'var(--font-body)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Dossiers tab ─────────────────────────────────────────── */}
      {activeTab === 'dossiers' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <Link to={`/rcp/dossier/nouveau?reunion=${id}`} style={{ textDecoration:'none' }}>
              <button style={{ padding:'8px 16px', background:'linear-gradient(135deg,#9b8afb,#7c6fcd)', border:'none', borderRadius:'var(--radius-md)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                + Ajouter un dossier
              </button>
            </Link>
          </div>

          {data.dossiers?.length === 0 ? (
            <EmptyState icon="📋" text="Aucun dossier patient ajouté" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {data.dossiers.map(d => (
                <div key={d.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                  {/* Dossier header */}
                  <div style={{ padding:'14px 18px', background:'var(--bg-elevated)', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(155,138,251,0.1)', color:'#9b8afb', border:'1px solid rgba(155,138,251,0.2)' }}>#{d.ordre_passage}</span>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{d.patient_nom}</div>
                        <div style={{ fontSize:10, color:'var(--accent)', fontFamily:'var(--font-mono)' }}>{d.patient_numero}</div>
                      </div>
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, background:'rgba(0,168,255,0.08)', color:'#00a8ff', border:'1px solid rgba(0,168,255,0.15)' }}>{d.type_label}</span>
                      <DossierStatutBadge statut={d.statut} label={d.statut_label} />
                    </div>
                    <button onClick={() => setShowDecisionModal(d.id)}
                      style={{ padding:'6px 14px', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:8, color:'#00e5a0', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                      + Décision
                    </button>
                  </div>

                  {/* Question */}
                  {d.question_posee && (
                    <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border)', background:'rgba(245,166,35,0.03)' }}>
                      <span style={{ fontSize:10, color:'#f5a623', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>❓ Question :</span>
                      <span style={{ fontSize:12, color:'var(--text-secondary)', marginLeft:8 }}>{d.question_posee}</span>
                    </div>
                  )}

                  {/* Décisions */}
                  {d.nb_decisions > 0 && (
                    <div style={{ padding:'10px 18px' }}>
                      <span style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>Décisions ({d.nb_decisions})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal décision */}
          {showDecisionModal && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'24px 28px', width:'100%', maxWidth:520, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
                <div style={{ fontSize:16, fontWeight:700, fontFamily:'var(--font-display)', color:'var(--text-primary)', marginBottom:18 }}>✅ Ajouter une décision RCP</div>
                <div style={{ marginBottom:12 }}>
                  <label style={labelSt}>Type de décision *</label>
                  <select value={decisionForm.type_decision} onChange={e => setDecisionForm(p => ({...p, type_decision:e.target.value}))} style={modalSelSt}>
                    <option value="chimio">Chimiothérapie</option>
                    <option value="radio">Radiothérapie</option>
                    <option value="chir">Chirurgie</option>
                    <option value="hormono">Hormonothérapie</option>
                    <option value="immuno">Immunothérapie / Thérapie ciblée</option>
                    <option value="radiochim">Radiochimiothérapie concomitante</option>
                    <option value="surveill">Surveillance active</option>
                    <option value="support">Soins de support</option>
                    <option value="palliatif">Soins palliatifs</option>
                    <option value="essai">Inclusion essai clinique</option>
                    <option value="bilan">Bilan complémentaire</option>
                    <option value="abstention">Abstention thérapeutique</option>
                    <option value="second">Demande second avis</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <div>
                    <label style={labelSt}>Priorité</label>
                    <select value={decisionForm.priorite} onChange={e => setDecisionForm(p => ({...p, priorite:e.target.value}))} style={modalSelSt}>
                      <option value="urgente">Urgente (&lt; 1 sem.)</option>
                      <option value="rapide">Rapide (&lt; 1 mois)</option>
                      <option value="normale">Normale (1–3 mois)</option>
                      <option value="differee">Différée (&gt; 3 mois)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>Protocole</label>
                    <input value={decisionForm.protocole} onChange={e => setDecisionForm(p => ({...p, protocole:e.target.value}))} placeholder="Ex: AC-T, FOLFOX..." style={modalInputSt} />
                  </div>
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={labelSt}>Description de la décision *</label>
                  <textarea value={decisionForm.description} onChange={e => setDecisionForm(p => ({...p, description:e.target.value}))} rows={3} placeholder="Chirurgie conservatrice du sein gauche avec curage axillaire..." style={{ ...modalInputSt, resize:'vertical', lineHeight:1.6 }} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setShowDecisionModal(null); setDecisionForm({ type_decision:'chimio', priorite:'normale', description:'', protocole:'' }); }}
                    style={{ flex:'0 0 90px', padding:'10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }}>Annuler</button>
                  <button onClick={() => ajouterDecision(showDecisionModal)} disabled={submittingDecision}
                    style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#00e5a0,#00c080)', border:'none', borderRadius:8, color:'#000', fontSize:13, fontWeight:700, cursor:submittingDecision?'not-allowed':'pointer', opacity:submittingDecision?0.7:1 }}>
                    {submittingDecision ? 'Enregistrement...' : '✅ Confirmer la décision'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Présences tab ─────────────────────────────────────────── */}
      {activeTab === 'presences' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          {data.presences?.length === 0 ? (
            <EmptyState icon="👥" text="Aucune présence enregistrée" />
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-elevated)' }}>
                  {['Médecin','Spécialité','Rôle','Présent'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.presences.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding:'11px 14px', fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{p.medecin_nom}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--text-secondary)' }}>{p.specialite_label}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'var(--text-muted)' }}>{p.role || '—'}</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontSize:13, color: p.present ? '#00e5a0' : '#ff4d6a' }}>
                        {p.present ? '✓ Présent' : '✗ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Compte rendu tab ──────────────────────────────────────── */}
      {activeTab === 'cr' && (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'20px 24px' }}>
          {data.objectif && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>📋 Ordre du jour</div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{data.objectif}</p>
            </div>
          )}
          {data.compte_rendu ? (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>📝 Compte rendu</div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{data.compte_rendu}</p>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📝</div>
              <div style={{ fontSize:13 }}>Compte rendu non encore rédigé</div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function BtnAction({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:'8px 14px', background:`${color}18`, border:`1px solid ${color}30`, borderRadius:8, color, fontSize:12, fontWeight:600, cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background=`${color}28`}
      onMouseLeave={e => e.currentTarget.style.background=`${color}18`}
    >{label}</button>
  );
}
function DossierStatutBadge({ statut, label }) {
  const colors = { attente:'#9ca3af', discute:'#00e5a0', reporte:'#f5a623', annule:'#ff4d6a' };
  const c = colors[statut] || '#9ca3af';
  return <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, background:`${c}15`, color:c, border:`1px solid ${c}25` }}>{label}</span>;
}
function Chip({ icon, val }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--text-secondary)' }}><span style={{ fontSize:11 }}>{icon}</span>{val}</span>;
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ padding:56, textAlign:'center' }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:13, color:'var(--text-muted)' }}>{text}</div>
    </div>
  );
}
function Loader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'#00a8ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  );
}
const labelSt     = { display:'block', fontSize:11.5, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 };
const modalInputSt = { width:'100%', padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:13, outline:'none', fontFamily:'var(--font-body)', boxSizing:'border-box' };
const modalSelSt   = { ...modalInputSt, cursor:'pointer' };

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { traitementService } from '../../services/traitementService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

// ── Config types ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  chimio:    { label: 'Chimiothérapie',  color: '#00a8ff', icon: 'Cx', bg: 'rgba(0,168,255,0.12)',   border: 'rgba(0,168,255,0.3)'   },
  radio:     { label: 'Radiothérapie',   color: '#f5a623', icon: 'Rx', bg: 'rgba(245,166,35,0.12)',  border: 'rgba(245,166,35,0.3)'  },
  chirurgie: { label: 'Chirurgie',       color: '#ff4d6a', icon: 'Ch', bg: 'rgba(255,77,106,0.12)',  border: 'rgba(255,77,106,0.3)'  },
  hormono:   { label: 'Hormonothérapie', color: '#00e5a0', icon: 'Ht', bg: 'rgba(0,229,160,0.12)',   border: 'rgba(0,229,160,0.3)'   },
  immuno:    { label: 'Immunothérapie',  color: '#c084fc', icon: 'It', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' },
};

const STATUT_META = {
  planifie:  { label: 'Planifié',  color: '#9b8afb', bg: 'rgba(155,138,251,0.12)', border: 'rgba(155,138,251,0.3)' },
  en_cours:  { label: 'En cours',  color: '#00a8ff', bg: 'rgba(0,168,255,0.12)',   border: 'rgba(0,168,255,0.3)'  },
  termine:   { label: 'Terminé',   color: '#00e5a0', bg: 'rgba(0,229,160,0.12)',   border: 'rgba(0,229,160,0.3)'  },
  suspendu:  { label: 'Suspendu',  color: '#f5a623', bg: 'rgba(245,166,35,0.12)',  border: 'rgba(245,166,35,0.3)' },
  abandonne: { label: 'Abandonné', color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',  border: 'rgba(255,77,106,0.3)' },
};

const REPONSE_C = { RC: '#00e5a0', RP: '#00a8ff', SD: '#f5a623', PD: '#ff4d6a', NE: '#6b7280', NA: '#6b7280' };
const MARGES_C  = { R0: '#00e5a0', R1: '#f5a623', R2: '#ff4d6a', RX: '#6b7280' };

const fd  = (d) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—';
const f   = (v) => (v === null || v === undefined || v === '') ? null : v;

function duree(debut, fin) {
  if (!debut) return null;
  const diff = Math.round((new Date(fin || new Date()) - new Date(debut)) / 86400000);
  if (diff < 0)   return null;
  if (diff < 30)  return `${diff} j`;
  if (diff < 365) return `${Math.round(diff / 30)} mois`;
  return `${(diff / 365).toFixed(1)} an${diff > 730 ? 's' : ''}`;
}

// ─────────────────────────────────────────────────────────────────
export default function TraitementDetailPage() {
  const { type, id } = useParams();
  const navigate     = useNavigate();
  const cfg          = TYPE_CONFIG[type] || TYPE_CONFIG.chimio;

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');

  useEffect(() => {
    const svc = traitementService[type];
    if (!svc) { navigate('/traitements'); return; }
    svc.get(id)
      .then(({ data }) => setData(data))
      .catch(() => { toast.error('Traitement introuvable'); navigate('/traitements'); })
      .finally(() => setLoading(false));
  }, [type, id, navigate]);

  if (loading) return (
    <AppLayout title="Traitement">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: cfg.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Chargement du traitement...
        </div>
      </div>
    </AppLayout>
  );
  if (!data) return null;

  const sc  = STATUT_META[data.statut] || STATUT_META.planifie;
  const dur = duree(data.date_debut, data.date_fin);

  const TABS = [
    { key: 'apercu',      label: 'Aperçu'            },
    { key: 'protocole',   label: 'Protocole'          },
    { key: 'progression', label: 'Progression'        },
    { key: 'medicaments', label: 'Médicaments'        },
    { key: 'reponse',     label: 'Réponse & Toxicité' },
  ].filter(t => {
    if (t.key === 'medicaments') return type === 'chimio' && data.medicaments?.length > 0;
    if (t.key === 'reponse')     return type === 'chimio' || type === 'immuno';
    return true;
  });

  // Flow cycle de vie
  const flow =
    data.statut === 'abandonne' ? ['planifie', 'en_cours', 'abandonne'] :
    data.statut === 'suspendu'  ? ['planifie', 'en_cours', 'suspendu']  :
    ['planifie', 'en_cours', 'termine'];
  const flowIdx = flow.indexOf(data.statut);

  return (
    <AppLayout title="Fiche Traitement">
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeIn    { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow      { 0%,100% { box-shadow: 0 0 8px ${cfg.color}40; } 50% { box-shadow: 0 0 22px ${cfg.color}80; } }
      `}</style>

      {/* ── HEADER — identique à DiagnosticDetailPage ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        animation: 'fadeIn .3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar — même style que DiagnosticDetailPage */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}18)`,
            border: `2px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: cfg.color,
            fontFamily: 'var(--font-mono)',
          }}>
            {cfg.icon}
          </div>

          <div>
            {/* Ligne titre + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {cfg.label}
              </h2>
              {/* Badge statut */}
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              }}>{sc.label}</span>
              {/* Badge intention */}
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}>{data.intention_label}</span>
              {/* Badge durée */}
              {dur && (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${cfg.color}10`, border: `1px solid ${cfg.color}20`,
                  color: cfg.color, fontFamily: 'var(--font-mono)',
                }}>{dur}</span>
              )}
            </div>

            {/* Ligne infos secondaires — même style que DiagnosticDetailPage */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <HeaderInfo label={data.patient_nom} sub={data.patient_numero} mono />
              <HeaderInfo label={fd(data.date_debut)} sub={data.date_fin ? `→ ${fd(data.date_fin)}` : 'En cours'} />
              {f(data.etablissement) && <HeaderInfo label={data.etablissement} />}
              {f(data.medecin)       && <HeaderInfo label={data.medecin} />}
            </div>
          </div>
        </div>

        {/* Boutons header */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/patients/${data.patient}`} style={{ textDecoration: 'none' }}>
            <HeaderBtn>Patient</HeaderBtn>
          </Link>
          {data.diagnostic && (
            <Link to={`/diagnostics/${data.diagnostic}`} style={{ textDecoration: 'none' }}>
              <HeaderBtn accent color={cfg.color}>Diagnostic</HeaderBtn>
            </Link>
          )}
          <Link to="/traitements" style={{ textDecoration: 'none' }}>
            <HeaderBtn>← Retour</HeaderBtn>
          </Link>
        </div>
      </div>

      {/* ── TABS — identiques à DiagnosticDetailPage ── */}
      <div style={{
        display: 'flex', marginBottom: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: '12px 6px',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === t.key ? cfg.color : 'transparent'}`,
            color: activeTab === t.key ? cfg.color : 'var(--text-muted)',
            fontSize: 11.5, fontWeight: activeTab === t.key ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── CONTENU ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        animation: 'fadeSlide .2s ease',
      }}>

        {/* ═══ APERÇU ═══ */}
        {activeTab === 'apercu' && (
          <>
            {/* Cycle de vie */}
            <SectionLabel>Cycle de vie</SectionLabel>
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                {flow.map((key, i) => {
                  const s       = STATUT_META[key];
                  const done    = i < flowIdx;
                  const current = i === flowIdx;
                  const future  = i > flowIdx;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {i > 0 && (
                        <div style={{
                          flex: 1, height: 3,
                          background: (done || current)
                            ? `linear-gradient(90deg, ${STATUT_META[flow[i-1]]?.color}, ${s.color})`
                            : 'var(--border)',
                          borderRadius: 2, transition: 'background .5s',
                        }} />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                        <div style={{
                          width: current ? 48 : 36, height: current ? 48 : 36,
                          borderRadius: '50%',
                          background: future ? 'var(--bg-elevated)' : `${s.color}18`,
                          border: `${current ? 3 : 2}px solid ${future ? 'var(--border)' : s.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: current ? 16 : 13, fontWeight: 800,
                          fontFamily: 'var(--font-mono)', color: future ? 'var(--text-muted)' : s.color,
                          filter: future ? 'grayscale(1) opacity(.3)' : 'none',
                          animation: current && data.statut === 'en_cours' ? 'glow 2s ease-in-out infinite' : 'none',
                          transition: 'all .4s',
                        }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 72 }}>
                          <div style={{ fontSize: 11, fontWeight: current ? 700 : 500, color: future ? 'var(--text-muted)' : s.color }}>
                            {s.label}
                          </div>
                          {current && (
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                              {data.statut === 'en_cours' ? '● Actif' :
                               data.statut === 'termine'  ? fd(data.date_fin) : ''}
                            </div>
                          )}
                          {done && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>Complété</div>}
                        </div>
                      </div>
                      {i === flow.length - 1 && <div style={{ flex: 1 }} />}
                    </div>
                  );
                })}
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                <KpiCard label="Début"     value={fd(data.date_debut)}                            color={cfg.color} />
                <KpiCard label="Fin"       value={data.date_fin ? fd(data.date_fin) : 'En cours'} color={cfg.color} />
                <KpiCard label="Durée"     value={dur || '—'}                                      color={cfg.color} />
                <KpiCard label="Intention" value={data.intention_label}                           color={cfg.color} />
                {type === 'chimio' && <KpiCard label="Cycles"  value={`${data.cycles_realises ?? 0} / ${data.nombre_cycles ?? '?'}`}   color={cfg.color} />}
                {type === 'radio'  && <KpiCard label="Séances" value={`${data.seances_realisees ?? 0} / ${data.nombre_seances ?? '?'}`} color={cfg.color} />}
                {type === 'chimio' && data.reponse_tumorale && (
                  <KpiCard label="Réponse" value={data.reponse_label} color={REPONSE_C[data.reponse_tumorale] || '#6b7280'} />
                )}
                {type === 'chirurgie' && data.marges_resection && (
                  <KpiCard label="Marges" value={data.marges_label} color={MARGES_C[data.marges_resection] || '#6b7280'} />
                )}
              </div>

              {/* Barre de progression */}
              {type === 'chimio' && (data.nombre_cycles ?? 0) > 0 && (
                <ProgressBar done={data.cycles_realises ?? 0} total={data.nombre_cycles} label="cycles" color={cfg.color} />
              )}
              {type === 'radio' && (data.nombre_seances ?? 0) > 0 && (
                <ProgressBar done={data.seances_realisees ?? 0} total={data.nombre_seances} label="séances" color={cfg.color} />
              )}
            </div>

            {/* Informations générales */}
            <SectionLabel>Informations générales</SectionLabel>
            <TwoColGrid>
              <InfoRow label="Statut"        value={<span style={{ color: sc.color, fontWeight: 700 }}>{data.statut_label}</span>} />
              <InfoRow label="Intention"     value={data.intention_label} />
              <InfoRow label="Date début"    value={fd(data.date_debut)} />
              {f(data.date_fin)      && <InfoRow label="Date fin"      value={fd(data.date_fin)} />}
              {f(data.etablissement) && <InfoRow label="Établissement" value={data.etablissement} />}
              {f(data.medecin)       && <InfoRow label="Médecin"       value={data.medecin} />}
              {f(data.observations)  && <InfoRow label="Observations"  value={data.observations} full />}
            </TwoColGrid>
          </>
        )}

        {/* ═══ PROTOCOLE ═══ */}
        {activeTab === 'protocole' && (
          <>
            <SectionLabel>Détail du protocole — {cfg.label}</SectionLabel>
            <TwoColGrid>

              {/* Chimiothérapie */}
              {type === 'chimio' && <>
                <InfoRow label="Protocole"     value={<span style={{ fontFamily:'var(--font-mono)', color:cfg.color, fontWeight:700 }}>{data.protocole || '—'}</span>} />
                <InfoRow label="Ligne"         value={`Ligne ${data.ligne}`} />
                <InfoRow label="Nombre cycles" value={`${data.cycles_realises ?? 0} / ${data.nombre_cycles ?? '?'}`} />
                {f(data.intervalle_jours) && <InfoRow label="Intervalle" value={`${data.intervalle_jours} jours`} />}
                <InfoRow label="Voie"          value={data.voie_label} />
              </>}

              {/* Radiothérapie */}
              {type === 'radio' && <>
                <InfoRow label="Site irradié"  value={data.site_irradie} />
                <InfoRow label="Technique"     value={data.technique_label} />
                {f(data.dose_totale_gy)     && <InfoRow label="Dose totale"   value={<span style={{ fontFamily:'var(--font-mono)', color:cfg.color }}>{data.dose_totale_gy} Gy</span>} />}
                {f(data.dose_par_seance_gy) && <InfoRow label="Dose / séance" value={`${data.dose_par_seance_gy} Gy`} />}
                <InfoRow label="Séances"       value={`${data.seances_realisees ?? 0} / ${data.nombre_seances ?? '?'}`} />
                {f(data.energie_mev)        && <InfoRow label="Énergie"       value={data.energie_mev} />}
                <InfoRow label="Radiochimiothérapie" value={data.association_chimio ? '✓ Oui' : '✗ Non'} />
              </>}

              {/* Chirurgie */}
              {type === 'chirurgie' && <>
                <InfoRow label="Acte"  value={data.intitule_acte} />
                <InfoRow label="Type"  value={data.type_label} />
                <InfoRow label="Voie"  value={data.voie_label} />
                {f(data.chirurgien) && <InfoRow label="Chirurgien" value={data.chirurgien} />}
                {f(data.marges_resection) && (
                  <InfoRow label="Marges" value={
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color: MARGES_C[data.marges_resection] || '#6b7280' }}>
                      {data.marges_label}
                    </span>
                  } />
                )}
                {data.curage_ganglionnaire && (
                  <InfoRow label="Curage" value={`${data.nb_ganglions_preleves ?? '?'} prélevés / ${data.nb_ganglions_envahis ?? '?'} envahis`} />
                )}
                {f(data.duree_hospitalisation)      && <InfoRow label="Hospitalisation"  value={`${data.duree_hospitalisation} jours`} />}
                {f(data.complications)              && <InfoRow label="Complications"     value={data.complications} full />}
                {f(data.compte_rendu_operatoire)    && <InfoRow label="Compte rendu"      value={data.compte_rendu_operatoire} full />}
              </>}

              {/* Hormonothérapie */}
              {type === 'hormono' && <>
                <InfoRow label="Type"     value={data.type_label} />
                <InfoRow label="Molécule" value={<span style={{ fontFamily:'var(--font-mono)', color:cfg.color, fontWeight:700 }}>{data.molecule}</span>} />
                {f(data.dose_mg_jour)      && <InfoRow label="Dose / jour"  value={`${data.dose_mg_jour} mg`} />}
                {f(data.duree_mois_prevue) && <InfoRow label="Durée prévue" value={`${data.duree_mois_prevue} mois`} />}
              </>}

              {/* Immunothérapie */}
              {type === 'immuno' && <>
                <InfoRow label="Type"     value={data.type_label} />
                <InfoRow label="Molécule" value={<span style={{ fontFamily:'var(--font-mono)', color:cfg.color, fontWeight:700 }}>{data.molecule}</span>} />
                {f(data.dose)              && <InfoRow label="Dose"        value={data.dose} />}
                {f(data.nombre_cycles)     && <InfoRow label="Cycles"      value={data.nombre_cycles} />}
                {f(data.biomarqueur_cible) && <InfoRow label="Biomarqueur" value={<span style={{ fontFamily:'var(--font-mono)', color:cfg.color }}>{data.biomarqueur_cible}</span>} />}
              </>}

            </TwoColGrid>
          </>
        )}

        {/* ═══ PROGRESSION ═══ */}
        {activeTab === 'progression' && (
          <>
            <SectionLabel>Suivi de progression</SectionLabel>
            <TwoColGrid>
              <InfoRow label="Statut actuel" value={
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                  {sc.label}
                </span>
              } />
              <InfoRow label="Intention"  value={data.intention_label} />
              <InfoRow label="Date début" value={fd(data.date_debut)} />
              <InfoRow label="Date fin"   value={data.date_fin ? fd(data.date_fin) : 'En cours'} />
              {type === 'chimio' && <>
                <InfoRow label="Cycles réalisés"  value={`${data.cycles_realises ?? 0} sur ${data.nombre_cycles ?? '?'}`} />
                {f(data.date_evaluation) && <InfoRow label="Date évaluation" value={fd(data.date_evaluation)} />}
              </>}
              {type === 'radio' && (
                <InfoRow label="Séances réalisées" value={`${data.seances_realisees ?? 0} sur ${data.nombre_seances ?? '?'}`} />
              )}
            </TwoColGrid>

            {type === 'chimio' && (data.nombre_cycles ?? 0) > 0 && (
              <div style={{ marginTop: 20 }}>
                <ProgressBar done={data.cycles_realises ?? 0} total={data.nombre_cycles} label="cycles réalisés" color={cfg.color} />
              </div>
            )}
            {type === 'radio' && (data.nombre_seances ?? 0) > 0 && (
              <div style={{ marginTop: 20 }}>
                <ProgressBar done={data.seances_realisees ?? 0} total={data.nombre_seances} label="séances réalisées" color={cfg.color} />
              </div>
            )}

            {f(data.observations) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Observations</SectionLabel>
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                  fontStyle: 'italic',
                }}>{data.observations}</div>
              </>
            )}
          </>
        )}

        {/* ═══ MÉDICAMENTS ═══ */}
        {activeTab === 'medicaments' && type === 'chimio' && (
          <>
            <SectionLabel>Médicaments du protocole ({data.medicaments?.length})</SectionLabel>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    {['DCI', 'Dose', 'Unité', 'Jours administration'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontSize: 10, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        borderBottom: '1px solid var(--border)', fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.medicaments?.map((m, i) => (
                    <tr key={m.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.dci}</td>
                      <td style={{ padding: '10px 14px', color: cfg.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{m.dose ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>{m.unite_dose || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{m.jour_administration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ═══ RÉPONSE & TOXICITÉ ═══ */}
        {activeTab === 'reponse' && (type === 'chimio' || type === 'immuno') && (
          <>
            <SectionLabel>Réponse tumorale</SectionLabel>
            <TwoColGrid>
              {f(data.reponse_tumorale) && (
                <InfoRow label="Réponse" value={
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: REPONSE_C[data.reponse_tumorale] || '#6b7280' }}>
                    {data.reponse_label}
                  </span>
                } />
              )}
              {f(data.date_evaluation) && <InfoRow label="Date évaluation" value={fd(data.date_evaluation)} />}
            </TwoColGrid>

            {type === 'chimio' && data.toxicite_grade != null && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Toxicité</SectionLabel>
                <TwoColGrid>
                  <InfoRow label="Grade toxicité" value={
                    <span style={{ fontWeight: 700, color:
                      data.toxicite_grade >= 3 ? '#ff4d6a' :
                      data.toxicite_grade >= 2 ? '#f5a623' : '#00e5a0'
                    }}>Grade {data.toxicite_grade}</span>
                  } />
                  {f(data.toxicite_description) && <InfoRow label="Description" value={data.toxicite_description} />}
                </TwoColGrid>
              </>
            )}

            {type === 'radio' && (f(data.toxicite_aigue) || f(data.toxicite_tardive)) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Toxicités radiothérapie</SectionLabel>
                <TwoColGrid>
                  {f(data.toxicite_aigue)   && <InfoRow label="Toxicité aiguë"  value={data.toxicite_aigue} />}
                  {f(data.toxicite_tardive) && <InfoRow label="Toxicité tardive" value={data.toxicite_tardive} />}
                </TwoColGrid>
              </>
            )}
          </>
        )}

      </div>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS — système identique à DiagnosticDetailPage
// ═══════════════════════════════════════════════════════════════

function HeaderInfo({ label, sub, mono }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontWeight: mono ? 600 : 400 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function HeaderBtn({ children, accent, color }) {
  return (
    <button style={{
      padding: '9px 18px',
      background: accent ? (color || 'var(--accent)') : 'var(--bg-elevated)',
      border: accent ? 'none' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      color: accent ? '#fff' : 'var(--text-muted)',
      fontSize: 13, cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: accent ? 600 : 400,
    }}>{children}</button>
  );
}

function SectionLabel({ children, style: ext }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: 1,
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: 12, ...ext,
    }}>{children}</div>
  );
}

function TwoColGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono, full }) {
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
      gridColumn: full ? '1 / -1' : 'auto',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}

function ProgressBar({ done, total, label, color }) {
  const pct = Math.min(100, Math.round((done / total) * 100));
  return (
    <div style={{
      marginTop: 14, padding: '10px 14px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
        <span>{done} / {total} {label}</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}
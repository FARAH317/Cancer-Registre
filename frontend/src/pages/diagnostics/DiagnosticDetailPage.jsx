import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { diagnosticService } from '../../services/diagnosticService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

// ── Couleurs ──────────────────────────────────────────────────────
const STADE_C = {
  '0':'#00e5a0','I':'#00a8ff','IA':'#00a8ff','IB':'#00a8ff',
  'II':'#9b8afb','IIA':'#9b8afb','IIB':'#9b8afb','IIC':'#9b8afb',
  'III':'#f5a623','IIIA':'#f5a623','IIIB':'#f5a623','IIIC':'#f5a623',
  'IV':'#ff4d6a','U':'#6b7280',
};
const ETAT_C     = { localise:'#00e5a0', extension_regionale:'#f5a623', metastatique:'#ff4d6a', non_determine:'#6b7280' };
const MARGES_C   = { r0:'#00e5a0', r1:'#f5a623', r2:'#ff4d6a', non_evaluables:'#6b7280' };
const MARQUEUR_C = { positif:'#00e5a0', negatif:'#ff4d6a', inconnu:'#6b7280', equivoque:'#f5a623' };
const REPONSE_C  = { RC:'#00e5a0', RP:'#00a8ff', SD:'#f5a623', PD:'#ff4d6a', NE:'#6b7280' };
const MOLEC_C    = { positif:'#00e5a0', negatif:'#ff4d6a', amplifie:'#f5a623', surexprime:'#c084fc', inconnu:'#6b7280', non_fait:'#6b7280' };
const MSI_C      = { mss:'#6b7280', msi_l:'#f5a623', msi_h:'#00a8ff', inconnu:'#6b7280' };
const MSI_L      = { mss:'MSS – Stable', msi_l:'MSI-L – Faible', msi_h:'MSI-H – Haute instabilité', inconnu:'Inconnu' };
const STATUT_T   = {
  planifie:  { bg:'rgba(155,138,251,0.12)', c:'#9b8afb', border:'rgba(155,138,251,0.3)' },
  en_cours:  { bg:'rgba(0,168,255,0.12)',   c:'#00a8ff', border:'rgba(0,168,255,0.3)'  },
  termine:   { bg:'rgba(0,229,160,0.12)',   c:'#00e5a0', border:'rgba(0,229,160,0.3)'  },
  suspendu:  { bg:'rgba(245,166,35,0.12)',  c:'#f5a623', border:'rgba(245,166,35,0.3)' },
  abandonne: { bg:'rgba(255,77,106,0.12)',  c:'#ff4d6a', border:'rgba(255,77,106,0.3)' },
};
const TYPE_TRAIT = {
  chimio:    { label:'Chimiothérapie',  c:'#00a8ff' },
  radio:     { label:'Radiothérapie',   c:'#f5a623' },
  chirurgie: { label:'Chirurgie',       c:'#ff4d6a' },
  hormono:   { label:'Hormonothérapie', c:'#00e5a0' },
  immuno:    { label:'Immunothérapie',  c:'#c084fc' },
};
const TECH_PREL = { biopsie:'Biopsie', exerese_chirurgicale:'Exérèse chirurgicale', cytoponction:'Cytoponction', liquide_biologique:'Liquide biologique', autopsie:'Autopsie' };
const QUAL_PREL = { adequate:'Adéquate', limite:'Limitée', inadequat:'Inadéquate' };
const MARGES_L  = { r0:'Saines (R0)', r1:'Microscopiques (R1)', r2:'Macroscopiques (R2)', non_evaluables:'Non évaluables' };

const f  = (v) => (v === null || v === undefined || v === '') ? null : v;
const fd = (d) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—';
const fb = (v) => v === true ? '✓ Oui' : v === false ? '✗ Non' : null;

// ── Fichiers ──────────────────────────────────────────────────────
function fileIcon(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf')                                   return { icon: 'PDF', c: '#ff4d6a' };
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return { icon: 'IMG', c: '#00a8ff' };
  if (['doc','docx'].includes(ext))                   return { icon: 'DOC', c: '#9b8afb' };
  if (['xls','xlsx','csv'].includes(ext))             return { icon: 'XLS', c: '#00e5a0' };
  if (['dcm','dicom'].includes(ext))                  return { icon: 'DCM', c: '#f5a623' };
  return { icon: 'FILE', c: '#6b7280' };
}

function FilesSection({ diagnosticId, initialFiles = [] }) {
  const [files,     setFiles]     = useState(initialFiles);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const uploadFiles = useCallback(async (newFiles) => {
    if (!newFiles.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append('fichier', file);
        formData.append('diagnostic', diagnosticId);
        const { data } = await diagnosticService.uploadFile(diagnosticId, formData);
        uploaded.push(data);
      }
      setFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} fichier(s) ajouté(s)`);
    } catch { toast.error("Erreur lors de l'upload"); }
    finally { setUploading(false); }
  }, [diagnosticId]);

  const handleDrop   = useCallback((e) => { e.preventDefault(); setDragging(false); uploadFiles(Array.from(e.dataTransfer.files)); }, [uploadFiles]);
  const handleChange = useCallback((e) => { uploadFiles(Array.from(e.target.files)); e.target.value = ''; }, [uploadFiles]);
  const removeFile   = async (fileId) => {
    try { await diagnosticService.deleteFile(diagnosticId, fileId); setFiles(p => p.filter(f => f.id !== fileId)); }
    catch { toast.error('Erreur lors de la suppression'); }
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', padding: '22px 16px', textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          background: dragging ? 'rgba(155,138,251,0.06)' : 'var(--bg-elevated)',
          transition: 'all .18s', marginBottom: files.length > 0 ? 14 : 0,
        }}>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleChange} />
        {uploading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <div style={{ width:16, height:16, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Envoi en cours...</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, fontWeight:600, color:dragging?'var(--accent)':'var(--text-secondary)', marginBottom:3 }}>
              {dragging ? 'Déposer ici' : 'Glisser-déposer vos fichiers ici'}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>ou cliquer pour parcourir · PDF, Images, DICOM, Documents</div>
          </>
        )}
      </div>
      {files.map(file => {
        const name = file.nom || (file.fichier || '').split('/').pop() || 'Fichier';
        const { icon, c } = fileIcon(name);
        return (
          <div key={file.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, marginBottom:6, transition:'border-color .12s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${c}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ width:34, height:34, borderRadius:7, background:`${c}12`, border:`1px solid ${c}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:800, color:c }}>{icon}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
              {file.taille && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{(file.taille/1024).toFixed(1)} Ko</div>}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {file.url && <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ textDecoration:'none' }}>
                <button style={{ padding:'5px 10px', background:`${c}10`, border:`1px solid ${c}25`, borderRadius:6, color:c, fontSize:11, cursor:'pointer', fontWeight:600 }}>Ouvrir</button>
              </a>}
              <button onClick={() => removeFile(file.id)} style={{ padding:'5px 8px', background:'rgba(255,77,106,0.08)', border:'1px solid rgba(255,77,106,0.2)', borderRadius:6, color:'#ff4d6a', fontSize:11, cursor:'pointer' }}>✕</button>
            </div>
          </div>
        );
      })}
      {files.length === 0 && !uploading && (
        <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginTop:8, fontStyle:'italic' }}>Aucun fichier joint</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function DiagnosticDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [d,    setD]    = useState(null);
  const [load, setLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('histologie');

  useEffect(() => {
    diagnosticService.get(id)
      .then(r => setD(r.data))
      .catch(() => { toast.error('Diagnostic introuvable'); navigate('/diagnostics'); })
      .finally(() => setLoad(false));
  }, [id, navigate]);

  if (load) return (
    <AppLayout title="Diagnostic">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Chargement du diagnostic...
        </div>
      </div>
    </AppLayout>
  );
  if (!d) return null;

  const stadeC   = STADE_C[d.stade_ajcc] || '#6b7280';
  const isTraite = d.statut_traitement !== 'non_traite';
  const tnm      = [d.tnm_t, d.tnm_n, d.tnm_m].filter(Boolean).join(' ');
  const traitements = [
    { key:'chimio',    list: d.chimiotherapies  || [] },
    { key:'radio',     list: d.radiotherapies   || [] },
    { key:'chirurgie', list: d.chirurgies        || [] },
    { key:'hormono',   list: d.hormonotherapies  || [] },
    { key:'immuno',    list: d.immunotherapies   || [] },
  ].filter(t => t.list.length > 0);

  const TABS = [
    { key: 'histologie',   label: 'Histologie'       },
    { key: 'staging',      label: 'Staging TNM'      },
    { key: 'marqueurs',    label: 'Marqueurs'         },
    { key: 'moleculaire',  label: 'Biologie mol.'     },
    { key: 'imagerie',     label: 'Imagerie'          },
    { key: 'traitements',  label: `Traitements (${d.nb_traitements || 0})` },
    { key: 'fichiers',     label: 'Fichiers'          },
  ].filter(t => {
    if (t.key === 'staging' || t.key === 'marqueurs' || t.key === 'moleculaire' || t.key === 'traitements') return isTraite;
    return true;
  });

  return (
    <AppLayout title="Dossier Diagnostic">
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes fadeIn    { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── HEADER ── même système que PatientDetailPage ── */}
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
          {/* Avatar style patient — couleur du stade */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${stadeC}20, ${stadeC}10)`,
            border: `2px solid ${stadeC}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: stadeC,
            fontFamily: 'var(--font-mono)',
          }}>
            C
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {d.topographie_libelle || d.topographie_code}
              </h2>
              {d.stade_ajcc && d.stade_ajcc !== 'U' && (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: `${stadeC}15`, color: stadeC, border: `1px solid ${stadeC}30`,
                }}>Stade {d.stade_ajcc}</span>
              )}
              {d.etat_cancer && (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${ETAT_C[d.etat_cancer]}12`, color: ETAT_C[d.etat_cancer],
                  border: `1px solid ${ETAT_C[d.etat_cancer]}30`,
                }}>{d.etat_cancer_label}</span>
              )}
              {!isTraite && (
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: 'rgba(107,114,128,0.12)', color: '#9ca3af',
                  border: '1px solid rgba(107,114,128,0.3)',
                }}>Non traité</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <HeaderInfo label={d.patient_nom} sub={d.patient_numero} mono />
              <HeaderInfo label={fd(d.date_diagnostic)} sub={d.type_diag_label} />
              <HeaderInfo label={d.topographie_code} mono />
              {tnm && <HeaderInfo label={tnm} sub="TNM" mono />}
            </div>
          </div>
        </div>

        {/* Boutons header */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/patients/${d.patient}`} style={{ textDecoration: 'none' }}>
            <HeaderBtn>Patient</HeaderBtn>
          </Link>
          <Link to={`/traitements/nouveau?patient=${d.patient}&diagnostic=${d.id}`} style={{ textDecoration: 'none' }}>
            <HeaderBtn accent>+ Traitement</HeaderBtn>
          </Link>
          <Link to="/diagnostics" style={{ textDecoration: 'none' }}>
            <HeaderBtn>← Retour</HeaderBtn>
          </Link>
        </div>
      </div>

      {/* Message si non traité */}
      {!isTraite && (
        <div style={{
          marginBottom: 14, padding: '10px 16px',
          background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.2)',
          borderRadius: 'var(--radius-md)', fontSize: 12, color: '#9ca3af',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Les onglets Staging, Marqueurs et Traitements apparaîtront une fois un traitement enregistré.
        </div>
      )}

      {/* ── TABS ── même style que PatientDetailPage ── */}
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
            borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
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

        {/* ═══ HISTOLOGIE ═══ */}
        {activeTab === 'histologie' && (
          <>
            <SectionLabel>Classification tumorale</SectionLabel>
            <TwoColGrid>
              <InfoRow label="Topographie (ICD-O-3)" value={<><span style={{ fontFamily:'var(--font-mono)', color:stadeC, fontWeight:700 }}>{d.topographie_code}</span> – {d.topographie_libelle}</>} full />
              {f(d.morphologie_code)      && <InfoRow label="Morphologie (ICD-O-3)" value={<><span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{d.morphologie_code}</span> – {d.morphologie_libelle}</>} full />}
              {f(d.categorie_cancer)      && <InfoRow label="Catégorie"             value={d.categorie_cancer === 'solide' ? 'Tumeur solide' : 'Tumeur liquide / hématologique'} />}
              {f(d.type_diagnostic)       && <InfoRow label="Type diagnostic"       value={d.type_diag_label} />}
              {f(d.base_diagnostic)       && <InfoRow label="Base du diagnostic"    value={d.base_diag_label} />}
              {f(d.lateralite) && d.lateralite !== '0' && <InfoRow label="Latéralité" value={d.lateralite_label} />}
              {f(d.variante_histologique) && <InfoRow label="Variante histologique" value={d.variante_histologique} />}
            </TwoColGrid>

            <SectionLabel style={{ marginTop: 20 }}>Grade & Différentiation</SectionLabel>
            <TwoColGrid>
              {f(d.grade_histologique) && d.grade_histologique !== 'U' ? (
                <InfoRow label="Grade (OMS)" value={
                  <span style={{ fontWeight: 700, color:
                    d.grade_histologique === 'I'   ? '#00e5a0' :
                    d.grade_histologique === 'II'  ? '#00a8ff' :
                    d.grade_histologique === 'III' ? '#f5a623' : '#ff4d6a'
                  }}>{d.grade_label}</span>
                } />
              ) : (
                <InfoRow label="Grade (OMS)" value={<span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Non renseigné</span>} />
              )}
              {f(d.differentiation)     && <InfoRow label="Différentiation" value={d.differentiation} />}
              {f(d.pronostic_evaluation) && d.pronostic_evaluation !== 'inconnu' && (
                <InfoRow label="Pronostic" value={
                  <span style={{ fontWeight: 700, color:
                    d.pronostic_evaluation === 'favorable'   ? '#00e5a0' :
                    d.pronostic_evaluation === 'defavorable' ? '#ff4d6a' : '#f5a623'
                  }}>
                    {d.pronostic_evaluation === 'favorable' ? '✓ Favorable' :
                     d.pronostic_evaluation === 'defavorable' ? '✗ Défavorable' : '~ Intermédiaire'}
                  </span>
                } />
              )}
              {f(d.performance_status) && d.performance_status !== 'U' && (
                <InfoRow label="Performance status" value={`PS ${d.performance_status} – ${d.perf_status_label}`} />
              )}
            </TwoColGrid>

            <SectionLabel style={{ marginTop: 20 }}>Anatomopathologie</SectionLabel>
            <TwoColGrid>
              {f(d.technique_prelevement)       && <InfoRow label="Technique"            value={TECH_PREL[d.technique_prelevement] || d.technique_prelevement} />}
              {f(d.qualite_prelevement)         && <InfoRow label="Qualité"              value={
                <span style={{ color: d.qualite_prelevement === 'adequate' ? '#00e5a0' : d.qualite_prelevement === 'inadequat' ? '#ff4d6a' : '#f5a623' }}>
                  {QUAL_PREL[d.qualite_prelevement] || d.qualite_prelevement}
                </span>
              } />}
              {f(d.numero_bloc_anapath)         && <InfoRow label="N° bloc"              value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.numero_bloc_anapath}</span>} />}
              {f(d.medecin_anatomopathologiste) && <InfoRow label="Anatomopathologiste"  value={d.medecin_anatomopathologiste} />}
              {f(d.laboratoire_anapath)         && <InfoRow label="Laboratoire"          value={d.laboratoire_anapath} />}
              {f(d.date_analyse_anapath)        && <InfoRow label="Date analyse"         value={fd(d.date_analyse_anapath)} />}
              {f(d.marges_chirurgicales)        && <InfoRow label="Marges chirurgicales" value={
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color: MARGES_C[d.marges_chirurgicales] || '#6b7280' }}>
                  {MARGES_L[d.marges_chirurgicales] || d.marges_chirurgicales}
                  {d.distance_marge_minimale != null ? ` · ${d.distance_marge_minimale} mm` : ''}
                </span>
              } />}
              {d.emboles_lymphatiques != null   && <InfoRow label="Emboles lymphatiques" value={fb(d.emboles_lymphatiques)} />}
              {d.emboles_vasculaires  != null   && <InfoRow label="Emboles vasculaires"  value={fb(d.emboles_vasculaires)} />}
              {d.invasion_vasculaire  != null   && <InfoRow label="Invasion vasculaire"  value={fb(d.invasion_vasculaire)} />}
              {d.invasion_perineurale != null   && <InfoRow label="Invasion périneurale" value={fb(d.invasion_perineurale)} />}
            </TwoColGrid>

            {f(d.immunohistochimie) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Immunohistochimie</SectionLabel>
                <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                  {d.immunohistochimie}
                </div>
              </>
            )}

            {f(d.observations) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Observations cliniques</SectionLabel>
                <div style={{ padding:'12px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, fontStyle:'italic' }}>
                  {d.observations}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ STAGING TNM ═══ */}
        {activeTab === 'staging' && isTraite && (
          <>
            <SectionLabel>Classification TNM</SectionLabel>
            {tnm ? (
              <>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:12 }}>
                  {d.tnm_type === 'p' ? 'pTNM – Pathologique' : d.tnm_type === 'y' ? 'yTNM – Post-thérapeutique' : 'cTNM – Clinique'}
                  {d.tnm_edition ? ` · ${d.tnm_edition}e édition` : ''}
                </div>
                <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                  {d.tnm_t && <TNMBadge l="T" v={d.tnm_t} c="#00a8ff" />}
                  {d.tnm_n && <TNMBadge l="N" v={d.tnm_n} c="#9b8afb" />}
                  {d.tnm_m && <TNMBadge l="M" v={d.tnm_m} c={d.tnm_m.startsWith('M1') ? '#ff4d6a' : '#f5a623'} />}
                </div>
                <TwoColGrid>
                  {f(d.tnm_descripteurs)    && <InfoRow label="Descripteurs"    value={d.tnm_descripteurs} />}
                  {f(d.tnm_certitude)       && <InfoRow label="Certitude"       value={d.tnm_certitude} />}
                  {f(d.tnm_date_evaluation) && <InfoRow label="Date évaluation" value={fd(d.tnm_date_evaluation)} />}
                  {f(d.tnm_commentaire)     && <InfoRow label="Commentaire"     value={d.tnm_commentaire} full />}
                </TwoColGrid>
              </>
            ) : (
              <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', padding:'8px 0' }}>TNM non renseigné</div>
            )}

            <SectionLabel style={{ marginTop: 20 }}>Stade & Extension</SectionLabel>
            <TwoColGrid>
              <InfoRow label="Stade AJCC" value={
                d.stade_ajcc === 'U'
                  ? <span style={{ color:'#6b7280' }}>Inconnu</span>
                  : <span style={{ fontWeight:800, fontSize:15, color:stadeC }}>Stade {d.stade_ajcc}</span>
              } />
              <InfoRow label="État d'extension" value={
                <span style={{ color:ETAT_C[d.etat_cancer], fontWeight:600 }}>{d.etat_cancer_label}</span>
              } />
              {f(d.performance_status) && d.performance_status !== 'U' && (
                <InfoRow label="Performance status" value={`PS ${d.performance_status} – ${d.perf_status_label}`} />
              )}
              {f(d.pronostic_evaluation) && d.pronostic_evaluation !== 'inconnu' && (
                <InfoRow label="Pronostic" value={
                  <span style={{ fontWeight:700, color: d.pronostic_evaluation==='favorable'?'#00e5a0':d.pronostic_evaluation==='defavorable'?'#ff4d6a':'#f5a623' }}>
                    {d.pronostic_evaluation==='favorable'?'✓ Favorable':d.pronostic_evaluation==='defavorable'?'✗ Défavorable':'~ Intermédiaire'}
                  </span>
                } />
              )}
              {f(d.taille_tumeur)    && <InfoRow label="Taille tumeur"     value={`${d.taille_tumeur} mm${d.taille_tumeur_3d ? ` · 3D: ${d.taille_tumeur_3d}` : ''}`} />}
              {f(d.volume_tumoral)   && <InfoRow label="Volume tumoral"    value={`${d.volume_tumoral} cm³`} />}
              {f(d.nombre_ganglions) && <InfoRow label="Ganglions envahis" value={`${d.nombre_ganglions}${d.nombre_ganglions_preleves ? ' / ' + d.nombre_ganglions_preleves + ' prélevés' : ''}`} />}
              {f(d.metastases_sites) && <InfoRow label="Sites métastatiques" value={d.metastases_sites} full />}
            </TwoColGrid>

            <SectionLabel style={{ marginTop: 20 }}>Prise en charge</SectionLabel>
            <TwoColGrid>
              {f(d.medecin_referent)         && <InfoRow label="Médecin référent"       value={d.medecin_referent} />}
              {f(d.medecin_diagnostiqueur)   && <InfoRow label="Médecin diagnostiqueur" value={d.medecin_diagnostiqueur} />}
              {f(d.etablissement_diagnostic) && <InfoRow label="Établissement"          value={d.etablissement_diagnostic} />}
              <InfoRow label="Date diagnostic"          value={fd(d.date_diagnostic)} />
              {f(d.date_premier_symptome)    && <InfoRow label="Premier symptôme"       value={fd(d.date_premier_symptome)} />}
              {f(d.numero_dossier)           && <InfoRow label="N° dossier"             value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.numero_dossier}</span>} />}
              {f(d.cim10_code)               && <InfoRow label="CIM-10"                 value={<><span style={{ fontFamily:'var(--font-mono)' }}>{d.cim10_code}</span>{d.cim10_libelle ? ` – ${d.cim10_libelle}` : ''}</>} />}
            </TwoColGrid>
          </>
        )}

        {/* ═══ MARQUEURS ═══ */}
        {activeTab === 'marqueurs' && isTraite && (
          <>
            {(d.recepteur_re || d.recepteur_rp || d.her2) && (
              <>
                <SectionLabel>Récepteurs hormonaux & HER2</SectionLabel>
                <TwoColGrid>
                  {d.recepteur_re && <InfoRow label="RE (Œstrogènes)" value={
                    <span style={{ color:MARQUEUR_C[d.recepteur_re], fontWeight:700 }}>
                      {d.recepteur_re==='positif'?'✓ Positif':d.recepteur_re==='negatif'?'✗ Négatif':'Inconnu'}
                      {d.recepteur_re_pourcentage!=null ? ` (${d.recepteur_re_pourcentage}%)` : ''}
                    </span>
                  } />}
                  {d.recepteur_rp && <InfoRow label="RP (Progestérone)" value={
                    <span style={{ color:MARQUEUR_C[d.recepteur_rp], fontWeight:700 }}>
                      {d.recepteur_rp==='positif'?'✓ Positif':d.recepteur_rp==='negatif'?'✗ Négatif':'Inconnu'}
                      {d.recepteur_rp_pourcentage!=null ? ` (${d.recepteur_rp_pourcentage}%)` : ''}
                    </span>
                  } />}
                  {d.her2 && <InfoRow label="HER2" value={
                    <span style={{ color:d.her2==='positif'?'#00e5a0':d.her2==='negatif'?'#ff4d6a':d.her2==='equivoque'?'#f5a623':'#6b7280', fontWeight:700 }}>
                      {d.her2==='positif'?'✓ Positif (3+)':d.her2==='equivoque'?'~ Équivoque (2+)':d.her2==='negatif'?'✗ Négatif (0/1+)':'Inconnu'}
                    </span>
                  } />}
                  {f(d.her2_fish) && d.her2_fish !== 'non_fait' && <InfoRow label="HER2 FISH" value={d.her2_fish==='amplifie'?'✓ Amplifié':'✗ Non amplifié'} />}
                </TwoColGrid>
              </>
            )}

            <SectionLabel style={{ marginTop: 20 }}>Marqueurs tumoraux</SectionLabel>
            <TwoColGrid>
              {f(d.ki67)    && <InfoRow label="Ki67"    value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.ki67}</span>} />}
              {f(d.psa)     && <InfoRow label="PSA"     value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.psa}</span>} />}
              {f(d.cea)     && <InfoRow label="CEA"     value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.cea}</span>} />}
              {f(d.ca_19_9) && <InfoRow label="CA 19-9" value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.ca_19_9}</span>} />}
              {f(d.ca_125)  && <InfoRow label="CA 125"  value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.ca_125}</span>} />}
              {f(d.afp)     && <InfoRow label="AFP"     value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.afp}</span>} />}
              {f(d.pdl1)    && <InfoRow label="PD-L1"   value={<span style={{ fontFamily:'var(--font-mono)' }}>{d.pdl1}</span>} />}
              {f(d.mmr_status) && <InfoRow label="MMR" value={
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:MSI_C[d.mmr_status]||'#6b7280' }}>
                  {d.mmr_status==='deficient'?'dMMR – Déficient':d.mmr_status==='proficient'?'pMMR – Proficient':'Inconnu'}
                </span>
              } />}
              {f(d.autres_marqueurs) && <InfoRow label="Autres" value={d.autres_marqueurs} full />}
            </TwoColGrid>
          </>
        )}

        {/* ═══ BIOLOGIE MOLÉCULAIRE ═══ */}
        {activeTab === 'moleculaire' && isTraite && (
          <>
            {(d.egfr||d.kras||d.nras||d.braf||d.alk||d.ros1||d.ret||d.met||d.pik3ca) && (
              <>
                <SectionLabel>Mutations oncogènes actionables</SectionLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {d.egfr   && <MolecRow gene="EGFR"   val={d.egfr}   detail={d.egfr_exon} />}
                  {d.kras   && <MolecRow gene="KRAS"   val={d.kras}   detail={d.kras_codon} />}
                  {d.nras   && <MolecRow gene="NRAS"   val={d.nras} />}
                  {d.braf   && <MolecRow gene="BRAF"   val={d.braf}   detail={d.braf_variant} />}
                  {d.alk    && <MolecRow gene="ALK"    val={d.alk} />}
                  {d.ros1   && <MolecRow gene="ROS1"   val={d.ros1} />}
                  {d.ret    && <MolecRow gene="RET"    val={d.ret} />}
                  {d.met    && <MolecRow gene="MET"    val={d.met}    detail={d.met_exon14 ? 'Exon 14 skipping' : null} />}
                  {d.pik3ca && <MolecRow gene="PIK3CA" val={d.pik3ca} />}
                </div>
              </>
            )}

            {(d.brca1||d.brca2||d.tp53||d.nf1||d.rb1||d.apc||d.cdh1||d.vhl) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Gènes suppresseurs & Prédisposition</SectionLabel>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  {d.brca1 && <MolecRow gene="BRCA1" val={d.brca1} />}
                  {d.brca2 && <MolecRow gene="BRCA2" val={d.brca2} />}
                  {d.tp53  && <MolecRow gene="TP53"  val={d.tp53} />}
                  {d.nf1   && <MolecRow gene="NF1"   val={d.nf1} />}
                  {d.rb1   && <MolecRow gene="RB1"   val={d.rb1} />}
                  {d.apc   && <MolecRow gene="APC"   val={d.apc} />}
                  {d.cdh1  && <MolecRow gene="CDH1"  val={d.cdh1} />}
                  {d.vhl   && <MolecRow gene="VHL"   val={d.vhl} />}
                </div>
              </>
            )}

            {(d.msi_statut||d.tmb||d.panel_ngs) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>MSI · TMB · Panel NGS</SectionLabel>
                <TwoColGrid>
                  {d.msi_statut && <InfoRow label="Statut MSI" value={
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:MSI_C[d.msi_statut]||'#6b7280' }}>
                      {MSI_L[d.msi_statut]||d.msi_statut}
                    </span>
                  } />}
                  {f(d.tmb) && <InfoRow label="TMB" value={
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>
                      {d.tmb} mut/Mb{d.tmb_statut ? ` · ${d.tmb_statut==='eleve'?'Élevé ≥ 10':'Bas < 10'}` : ''}
                    </span>
                  } />}
                  {f(d.panel_ngs)               && <InfoRow label="Panel NGS"   value={d.panel_ngs} />}
                  {f(d.date_test_moleculaire)   && <InfoRow label="Date test"   value={fd(d.date_test_moleculaire)} />}
                  {f(d.laboratoire_moleculaire) && <InfoRow label="Laboratoire" value={d.laboratoire_moleculaire} />}
                </TwoColGrid>
              </>
            )}

            {(d.therapie_ciblee_recommandee||d.resistances_connues||d.autres_alterations) && (
              <>
                <SectionLabel style={{ marginTop: 20 }}>Thérapie ciblée & Résistances</SectionLabel>
                <TwoColGrid>
                  {f(d.therapie_ciblee_recommandee) && <InfoRow label="Thérapie recommandée" value={<span style={{ color:'#00e5a0', fontWeight:600 }}>{d.therapie_ciblee_recommandee}</span>} />}
                  {f(d.resistances_connues)          && <InfoRow label="Résistances connues"  value={<span style={{ color:'#ff4d6a' }}>{d.resistances_connues}</span>} />}
                  {f(d.autres_alterations)           && <InfoRow label="Autres altérations"   value={d.autres_alterations} full />}
                </TwoColGrid>
              </>
            )}
          </>
        )}

        {/* ═══ IMAGERIE ═══ */}
        {activeTab === 'imagerie' && (
          <>
            <SectionLabel>Imagerie réalisée</SectionLabel>
            {(d.img_scanner||d.img_irm_cerebrale||d.img_pet_scan||d.img_echographie||d.img_radiographie||d.img_scintigraphie) ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {d.img_scanner       && <ImgBadge>Scanner</ImgBadge>}
                {d.img_irm_cerebrale && <ImgBadge>IRM cérébrale</ImgBadge>}
                {d.img_pet_scan      && <ImgBadge>PET-Scan</ImgBadge>}
                {d.img_echographie   && <ImgBadge>Échographie</ImgBadge>}
                {d.img_radiographie  && <ImgBadge>Radiographie</ImgBadge>}
                {d.img_scintigraphie && <ImgBadge>Scintigraphie</ImgBadge>}
              </div>
            ) : (
              <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>Aucune imagerie renseignée</div>
            )}

            <SectionLabel style={{ marginTop: 20 }}>Méthodes de confirmation</SectionLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {[
                { champ: d.conf_histologie_tumeur,      label: 'Histologie de tumeur primitive' },
                { champ: d.conf_cytologie,              label: 'Cytologie' },
                { champ: d.conf_microscopie_sans_histo, label: 'Microscopie sans histologie' },
                { champ: d.conf_marqueurs_biologiques,  label: 'Marqueurs biologiques / immunologiques' },
                { champ: d.conf_imagerie,               label: 'Imagerie' },
                { champ: d.conf_biopsie_medullaire,     label: 'Biopsie médullaire' },
              ].filter(m => m.champ).map(m => (
                <div key={m.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'#00e5a0', fontSize:13 }}>✓</span>
                  <span style={{ fontSize:13, color:'var(--text-primary)' }}>{m.label}</span>
                </div>
              ))}
              {f(d.methodes_confirmation_text) && (
                <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3, textTransform:'uppercase', letterSpacing:0.3 }}>Précisions</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', fontStyle:'italic' }}>{d.methodes_confirmation_text}</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ TRAITEMENTS ═══ */}
        {activeTab === 'traitements' && isTraite && (
          <>
            <SectionLabel>Traitements associés ({d.nb_traitements})</SectionLabel>
            {traitements.length === 0 ? (
              <div style={{ textAlign:'center', padding:28, color:'var(--text-muted)', fontSize:13, border:'1px dashed var(--border)', borderRadius:'var(--radius-md)' }}>
                Détails des traitements non disponibles.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {traitements.map(({ key, list }) => (
                  <TraitBlock key={key} typeKey={key} items={list} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ FICHIERS ═══ */}
        {activeTab === 'fichiers' && (
          <>
            <SectionLabel>Fichiers joints au diagnostic</SectionLabel>
            <FilesSection diagnosticId={d.id} initialFiles={d.fichiers || []} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// BLOC TRAITEMENTS (compact, accordéon)
// ═══════════════════════════════════════════════════════════════

function TraitBlock({ typeKey, items }) {
  const cfg = TYPE_TRAIT[typeKey];
  return (
    <div style={{ border:`1px solid ${cfg.c}22`, borderRadius:'var(--radius-md)', overflow:'hidden' }}>
      <div style={{ padding:'10px 16px', background:`${cfg.c}08`, borderBottom:`1px solid ${cfg.c}20`, display:'flex', gap:8, alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:700, color:cfg.c, textTransform:'uppercase', letterSpacing:0.6 }}>{cfg.label} · {items.length}</span>
      </div>
      {items.map((t, i) => <TraitCard key={t.id} t={t} typeKey={typeKey} cfg={cfg} last={i===items.length-1} />)}
    </div>
  );
}

function TraitCard({ t, typeKey, cfg, last }) {
  const [open, setOpen] = useState(true);
  const sc = STATUT_T[t.statut] || STATUT_T.planifie;
  const fd = (d) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—';
  const titre = typeKey==='chimio' ? (t.protocole || 'Protocole N/A') : typeKey==='radio' ? t.site_irradie : typeKey==='chirurgie' ? t.intitule_acte : t.molecule;

  return (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div onClick={() => setOpen(o=>!o)} style={{ padding:'11px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', background:'var(--bg-card)', transition:'background .12s' }}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'}
        onMouseLeave={e=>e.currentTarget.style.background='var(--bg-card)'}
      >
        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:sc.bg, color:sc.c, border:`1px solid ${sc.border}`, flexShrink:0 }}>{t.statut_label}</span>
        <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{titre}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{fd(t.date_debut)}{t.date_fin ? ' → '+fd(t.date_fin) : ''}</span>
        <Link to={`/traitements/${typeKey}/${t.id}`} onClick={e=>e.stopPropagation()} style={{ textDecoration:'none' }}>
          <span style={{ fontSize:11, color:cfg.c, padding:'2px 8px', border:`1px solid ${cfg.c}30`, borderRadius:6 }}>Détail →</span>
        </Link>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{ padding:'12px 16px 14px', background:'var(--bg-elevated)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px' }}>
            <InfoRow label="Intention" value={t.intention_label} />
            {typeKey==='chimio' && <InfoRow label="Cycles" value={`${t.cycles_realises}/${t.nombre_cycles??'?'}`} />}
            {typeKey==='radio'  && <InfoRow label="Séances" value={`${t.seances_realisees}/${t.nombre_seances??'?'}`} />}
            {t.medecin && <InfoRow label="Médecin" value={t.medecin} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS PARTAGÉS — identiques à PatientDetailPage
// ═══════════════════════════════════════════════════════════════

function HeaderInfo({ label, sub, mono }) {
  return (
    <div>
      <div style={{ fontSize:12.5, color:'var(--text-primary)', fontFamily: mono?'var(--font-mono)':'inherit', fontWeight: mono?600:400 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function HeaderBtn({ children, accent }) {
  return (
    <button style={{ padding:'9px 18px', background:accent?'var(--accent)':'var(--bg-elevated)', border:accent?'none':'1px solid var(--border)', borderRadius:'var(--radius-md)', color:accent?'#fff':'var(--text-muted)', fontSize:13, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:accent?600:400 }}>
      {children}
    </button>
  );
}

function SectionLabel({ children, style: ext }) {
  return (
    <div style={{ fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:12, ...ext }}>
      {children}
    </div>
  );
}

function TwoColGrid({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px' }}>{children}</div>;
}

function InfoRow({ label, value, mono, full }) {
  return (
    <div style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', gridColumn:full?'1 / -1':'auto' }}>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3, letterSpacing:0.3, textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:13.5, color:'var(--text-primary)', fontFamily:mono?'var(--font-mono)':'inherit' }}>{value ?? '—'}</div>
    </div>
  );
}

function TNMBadge({ l, v, c }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'baseline', gap:2, background:`${c}12`, border:`1px solid ${c}30`, borderRadius:8, padding:'5px 12px' }}>
      <span style={{ fontSize:10, fontWeight:700, color:c, fontFamily:'var(--font-mono)' }}>{l}</span>
      <span style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{v.replace(/^[TNM]/,'')}</span>
    </div>
  );
}

function MolecRow({ gene, val, detail }) {
  const c = MOLEC_C[val] || '#6b7280';
  const label = val==='positif'?'✓ Muté / Positif':val==='negatif'?'✗ Non muté / Négatif':val==='amplifie'?'⬆ Amplifié':val==='surexprime'?'⬆ Sur-exprimé':val==='inconnu'?'Inconnu':val;
  return (
    <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:800, color:'var(--text-primary)', minWidth:54 }}>{gene}</span>
      <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600, background:`${c}15`, color:c, border:`1px solid ${c}30`, flexShrink:0 }}>{label}</span>
      {detail && <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{detail}</span>}
    </div>
  );
}

function ImgBadge({ children }) {
  return (
    <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:500, background:'rgba(0,168,255,0.1)', color:'#00a8ff', border:'1px solid rgba(0,168,255,0.2)' }}>
      ✓ {children}
    </span>
  );
}
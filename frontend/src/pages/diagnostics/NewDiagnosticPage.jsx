import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { diagnosticService } from '../../services/diagnosticService';
import { patientService } from '../../services/patientService';
import { AppLayout } from '../../components/layout/Sidebar';
import VoiceDictation from '../../components/voice/VoiceDictation';

// ─────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Type',       icon: '' },
  { label: 'Histologie', icon: '' },
  { label: 'Staging',    icon: '' },
  { label: 'Marqueurs',  icon: ''  },
  { label: 'Résultats',  icon: ''  },
  { label: 'Synthèse',   icon: ''  },
];

// ─────────────────────────────────────────────────────────────
// DONNÉES HÉMOPATHIES
// ─────────────────────────────────────────────────────────────
const CATEGORIES_HEMATO = [
  { key: 'lymphome', label: 'Lymphomes',                    color: '#9b8afb' },
  { key: 'myelome',  label: 'Myélomes',                     color: '#c084fc' },
  { key: 'lc',       label: 'Leucémies chroniques',         color: '#00a8ff' },
  { key: 'la',       label: 'Leucémies aiguës',             color: '#ff4d6a' },
  { key: 'smp',      label: 'Syndromes myéloprolifératifs', color: '#f5a623' },
  { key: 'smd',      label: 'Syndromes myélodysplasiques',  color: '#00e5a0' },
  { key: 'autres',   label: 'Autres',                       color: '#6b7280' },
];

const HEMOPATHIES = [
  { id:'lnh', label:'Lymphome non Hodgkinien', abrev:'LNH', cat:'lymphome', top:'C85.9', morph:'9591/3', examens:[{key:'siege_biopsie',label:'Biopsie du siège tumoral',requis:true,type:'anapath'},{key:'anatomopathologie',label:'Anatomopathologie',requis:true,type:'anapath'},{key:'immunohistochimie',label:'Immunohistochimie',requis:true,type:'moleculaire'}]},
  { id:'lh',  label:'Lymphome de Hodgkin',     abrev:'LH',  cat:'lymphome', top:'C81.9', morph:'9650/3', examens:[{key:'siege_biopsie',label:'Biopsie du siège tumoral',requis:true,type:'anapath'},{key:'anatomopathologie',label:'Anatomopathologie',requis:true,type:'anapath'},{key:'immunohistochimie',label:'Immunohistochimie',requis:true,type:'moleculaire'}]},
  { id:'myelome', label:'Myélome / Maladie de Kahler', abrev:'MM', cat:'myelome', top:'C90.0', morph:'9732/3', examens:[{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'myelogramme',label:'Myélogramme',requis:true,type:'cytologie'},{key:'caryotype_fish',label:'Caryotype / FISH médullaire',requis:true,type:'moleculaire'},{key:'electrophorese_proteines',label:'Électrophorèse des protéines',requis:true,type:'biochimie'},{key:'immunofixation_sanguine',label:'Immunofixation sanguine',requis:true,type:'biochimie'},{key:'free_light_chain',label:'Free Light Chain',requis:true,type:'biochimie'},{key:'calcemie',label:'Calcémie',requis:true,type:'biochimie'},{key:'hemoglobine',label:'Hémoglobine',requis:true,type:'nfs'},{key:'clairance_renale',label:'Clairance rénale',requis:true,type:'biochimie'},{key:'radiologie_standard',label:'Radiologie standard',requis:true,type:'imagerie'},{key:'irm',label:'IRM',requis:false,type:'imagerie'},{key:'tdm_low_dose',label:'TDM low dose',requis:false,type:'imagerie'}]},
  { id:'llc', label:'Leucémie Lymphoïde Chronique', abrev:'LLC', cat:'lc', top:'C91.1', morph:'9823/3', examens:[{key:'taux_lymphocytes',label:'Taux de lymphocytes',requis:true,type:'nfs'},{key:'frottis_sang',label:'Frottis sanguin',requis:true,type:'cytologie'},{key:'cytometrie_flux',label:'Cytométrie en flux',requis:true,type:'cytologie'}]},
  { id:'lmc', label:'Leucémie Myéloïde Chronique',  abrev:'LMC', cat:'lc', top:'C92.1', morph:'9875/3', examens:[{key:'taux_gb',label:'Taux de globules blancs',requis:true,type:'nfs'},{key:'frottis_sang',label:'Frottis sanguin',requis:true,type:'cytologie'},{key:'cytogenetique_medullaire',label:'Cytogénétique médullaire',requis:true,type:'moleculaire'},{key:'fish_medullaire',label:'FISH médullaire',requis:true,type:'moleculaire'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
  { id:'lam', label:'Leucémie Aiguë Myéloïde',       abrev:'LAM', cat:'la', top:'C92.0', morph:'9861/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'frottis_sang',label:'Frottis sanguin',requis:true,type:'cytologie'},{key:'myelogramme',label:'Myélogramme',requis:true,type:'cytologie'},{key:'cytochimie_medullaire',label:'Cytochimie médullaire',requis:true,type:'cytologie'},{key:'cytometrie_flux',label:'Cytométrie en flux',requis:true,type:'cytologie'},{key:'caryotype_medullaire',label:'Caryotype médullaire',requis:true,type:'moleculaire'},{key:'fish_medullaire',label:'FISH médullaire',requis:true,type:'moleculaire'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
  { id:'lal', label:'Leucémie Aiguë Lymphoïde',      abrev:'LAL', cat:'la', top:'C91.0', morph:'9835/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'frottis_sang',label:'Frottis sanguin',requis:true,type:'cytologie'},{key:'myelogramme',label:'Myélogramme',requis:true,type:'cytologie'},{key:'cytochimie_medullaire',label:'Cytochimie médullaire',requis:true,type:'cytologie'},{key:'cytometrie_flux',label:'Cytométrie en flux',requis:true,type:'cytologie'},{key:'caryotype_medullaire',label:'Caryotype médullaire',requis:true,type:'moleculaire'},{key:'fish_medullaire',label:'FISH médullaire',requis:true,type:'moleculaire'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
  { id:'vaquez', label:'Polyglobulie de Vaquez', abrev:'PV', cat:'smp', top:'C94.1', morph:'9950/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'},{key:'dosage_epo',label:"Dosage d'EPO",requis:true,type:'biochimie'}]},
  { id:'te',  label:'Thrombocytémie essentielle',  abrev:'TE', cat:'smp', top:'C94.1', morph:'9962/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
  { id:'mf',  label:'Myélofibrose primitive',      abrev:'MF', cat:'smp', top:'C94.1', morph:'9961/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
  { id:'smd', label:'Syndrome myélodysplasique',   abrev:'SMD', cat:'smd', top:'C94.1', morph:'9989/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'myelogramme',label:'Myélogramme',requis:true,type:'cytologie'},{key:'coloration_perls',label:'Coloration de Perls',requis:true,type:'cytologie'},{key:'caryotype_medullaire',label:'Caryotype médullaire',requis:true,type:'moleculaire'}]},
  { id:'waldenstrom', label:'Maladie de Waldenström', abrev:'MW', cat:'autres', top:'C88.0', morph:'9671/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'myelogramme',label:'Myélogramme',requis:true,type:'cytologie'},{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'electrophorese_proteines',label:'Électrophorèse des protéines',requis:true,type:'biochimie'},{key:'immunofixation_sanguine',label:'Immunofixation sanguine',requis:true,type:'biochimie'}]},
  { id:'hcl', label:'Leucémie à Tricholeucocytes',  abrev:'HCL', cat:'autres', top:'C91.4', morph:'9940/3', examens:[{key:'nfs',label:'NFS',requis:true,type:'nfs'},{key:'frottis_sang',label:'Frottis sanguin',requis:true,type:'cytologie'},{key:'cytometrie_flux',label:'Cytométrie en flux',requis:true,type:'cytologie'},{key:'biopsie_osteomedullaire',label:'Biopsie ostéomédullaire',requis:true,type:'anapath'},{key:'biologie_moleculaire',label:'Biologie moléculaire',requis:true,type:'moleculaire'}]},
];

const EXAMEN_TYPE_CFG = {
  nfs:         { label:'NFS / Hématologie',    color:'#00e5a0', bg:'rgba(0,229,160,0.07)',   border:'rgba(0,229,160,0.20)'   },
  cytologie:   { label:'Cytologie',            color:'#00a8ff', bg:'rgba(0,168,255,0.07)',   border:'rgba(0,168,255,0.20)'   },
  anapath:     { label:'Anatomopathologie',    color:'#f5a623', bg:'rgba(245,166,35,0.07)',  border:'rgba(245,166,35,0.20)'  },
  moleculaire: { label:'Biologie moléculaire', color:'#9b8afb', bg:'rgba(155,138,251,0.07)', border:'rgba(155,138,251,0.20)' },
  biochimie:   { label:'Biochimie',            color:'#c084fc', bg:'rgba(192,132,252,0.07)', border:'rgba(192,132,252,0.20)' },
  imagerie:    { label:'Imagerie',             color:'#ff7832', bg:'rgba(255,120,50,0.07)',  border:'rgba(255,120,50,0.20)'  },
};

const LATERALITE_OPTIONS    = [{v:'0',l:'Non applicable'},{v:'1',l:'Droite'},{v:'2',l:'Gauche'},{v:'3',l:'Unilatéral, NOS'},{v:'4',l:'Bilatéral'},{v:'5',l:'Ligne médiane'},{v:'9',l:'Non précisé'}];
const BASE_DIAG_OPTIONS     = [{v:'0',l:'Certificat de décès uniquement'},{v:'1',l:'Clinique seulement'},{v:'2',l:'Clinique + investigations'},{v:'4',l:'Biochimie / immunologie'},{v:'5',l:'Cytologie'},{v:'6',l:'Histologie — métastase'},{v:'7',l:'Histologie — tumeur primitive'},{v:'9',l:'Inconnu'}];
const TYPE_DIAG_OPTIONS     = [{v:'initial',l:'Initial'},{v:'recidive',l:'Récidive'},{v:'metastase',l:'Métastase'},{v:'second',l:'Second cancer primaire'}];
const STADE_OPTIONS         = ['0','I','IA','IB','II','IIA','IIB','IIC','III','IIIA','IIIB','IIIC','IV','U'];
const ETAT_OPTIONS          = [{v:'localise',l:'Localisé'},{v:'extension_regionale',l:'Extension régionale'},{v:'metastatique',l:'Métastatique'},{v:'non_determine',l:'Non déterminé'}];
const GRADE_OPTIONS         = [{v:'I',l:'Grade I — bien différencié'},{v:'II',l:'Grade II — modérément différencié'},{v:'III',l:'Grade III — peu différencié'},{v:'IV',l:'Grade IV — indifférencié'},{v:'U',l:'Grade inconnu'}];
const MARQUEUR_OPTIONS      = [{v:'positif',l:'+ Positif'},{v:'negatif',l:'– Négatif'},{v:'equivoque',l:'~ Équivoque'},{v:'inconnu',l:'Inconnu'}];
const MOLEC_OPTIONS         = [{v:'positif',l:'Muté / Positif'},{v:'negatif',l:'Non muté / Négatif'},{v:'amplifie',l:'Amplifié'},{v:'surexprime',l:'Sur-exprimé'},{v:'inconnu',l:'Inconnu'},{v:'non_fait',l:'Non fait'}];
const STATUT_DOSSIER_OPTIONS= [{v:'en_cours',l:'En cours'},{v:'valide',l:'Validé'},{v:'archive',l:'Archivé'}];

const RESULT_FILE_TYPES = [
  { key:'anatomopathologie', label:'Anatomopathologie',     icon:'', color:'#f5a623' },
  { key:'biologie',          label:'Biologie / Labo',       icon:'', color:'#00e5a0' },
  { key:'imagerie',          label:'Imagerie (CR/IRM/TDM)', icon:'', color:'#00a8ff' },
  { key:'moleculaire',       label:'Biologie moléculaire',  icon:'', color:'#9b8afb' },
  { key:'autre',             label:'Autre document',        icon:'', color:'#6b7280' },
];

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function NewDiagnosticPage() {
  const navigate         = useNavigate();
  const [searchParams]   = useSearchParams();
  const patientIdFromUrl = searchParams.get('patient') || '';

  const [step,            setStep]            = useState(0);
  const [saved,           setSaved]           = useState([{},{},{},{},{},{}]);
  const [cancerType,      setCancerType]      = useState('');
  const [hematoId,        setHematoId]        = useState('');
  const [catFilter,       setCatFilter]       = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [patients,        setPatients]        = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch,   setPatientSearch]   = useState('');
  const [showPatientDrop, setShowPatientDrop] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [uploadedFiles,   setUploadedFiles]   = useState([]);
  const [dragOver,        setDragOver]        = useState(false);
  const fileInputRef = useRef(null);

  const patientIdInt = selectedPatient
    ? selectedPatient.id
    : (patientIdFromUrl ? parseInt(patientIdFromUrl, 10) : null);

  const hemopathie = HEMOPATHIES.find(h => h.id === hematoId) || null;
  const cat        = hemopathie ? CATEGORIES_HEMATO.find(c => c.key === hemopathie.cat) : null;
  const accentColor = cancerType === 'hemato' ? (cat?.color || '#9b8afb') : '#00a8ff';

  useEffect(() => {
    if (patientIdFromUrl && !selectedPatient) {
      patientService.get(patientIdFromUrl).then(({ data }) => setSelectedPatient(data)).catch(() => {});
    }
  }, [patientIdFromUrl]);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return; }
    setPatientsLoading(true);
    const timer = setTimeout(() => {
      patientService.list({ search: patientSearch, page_size: 10 })
        .then(({ data }) => setPatients(data.results || data))
        .catch(() => setPatients([]))
        .finally(() => setPatientsLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm({ mode: 'onSubmit', defaultValues: { patient: patientIdInt, type_diagnostic: 'initial', statut_dossier: 'en_cours' } });

  useEffect(() => {
    if (cancerType === 'hemato') reset({ patient: patientIdInt, type_diagnostic: 'initial', statut_dossier: 'en_cours' });
  }, [hematoId]);

  const applyVoiceFields = (fields) => {
    Object.entries(fields).forEach(([k, v]) => setValue(k, v, { shouldValidate: true }));
  };

  // ── Fichiers ──────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };
  const addFiles = (files) => {
    const newFiles = files.map(f => ({
      id: Date.now() + Math.random(), file: f, name: f.name, size: f.size,
      fileType: 'autre', description: '',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));
  const updateFile = (id, key, value) => setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));

  // ── Navigation steps ──────────────────────────────────────
  const onStepSubmit = async (data) => {
    const updated = saved.map((s, i) => i === step ? data : s);
    setSaved(updated);

    if (step === 0 && !cancerType) { toast.error('Sélectionnez un type de cancer.'); return; }
    if (step === 0 && cancerType === 'hemato' && !hematoId) { toast.error('Sélectionnez une hémopathie.'); return; }

    if (step < STEPS.length - 1) { setStep(step + 1); reset(saved[step + 1]); return; }

    if (!patientIdInt) { toast.error('Patient non identifié.'); return; }
    setSubmitting(true);
    try {
      const allData = Object.assign({}, ...updated);
      const payload = cancerType === 'solide'
        ? buildPayloadSolide(allData, patientIdInt)
        : buildPayloadHemato(allData, patientIdInt, hemopathie);

      console.log('[NewDiagnostic] payload →', JSON.stringify(payload, null, 2));
      const { data: diag } = await diagnosticService.create(payload);

      if (uploadedFiles.length > 0) {
        for (const f of uploadedFiles) {
          try {
            const fd = new FormData();
            fd.append('fichier', f.file);
            fd.append('type_document', f.fileType);
            fd.append('description', f.description || f.name);
            fd.append('diagnostic', diag.id);
            await diagnosticService.uploadDocument(diag.id, fd);
          } catch (e) { console.warn('Upload échoué :', f.name, e); }
        }
      }

      toast.success('Diagnostic créé avec succès !');
      navigate(`/diagnostics/${diag.id}`);
    } catch (err) {
      const errs = err.response?.data;
      console.error('[NewDiagnostic] erreur →', errs);
      if (errs && typeof errs === 'object') {
        const msgs = Object.entries(errs).map(([k,v]) => `${k} : ${Array.isArray(v)?v.join(', '):v}`).join(' | ');
        toast.error(msgs || 'Erreur lors de la création.');
      } else toast.error('Erreur lors de la création du diagnostic.');
    } finally { setSubmitting(false); }
  };

  return (
    <AppLayout title="Nouveau Diagnostic">
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ maxWidth:780, margin:'0 auto' }}>

        {/* ── Stepper ── */}
        <div style={{ display:'flex', marginBottom:24, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          {STEPS.map((s, i) => (
            <div key={i} onClick={() => i < step && setStep(i)}
              style={{ flex:1, padding:'13px 8px', textAlign:'center', background: i===step?'var(--accent-dim)':i<step?'rgba(0,229,160,0.08)':'transparent', borderRight: i<STEPS.length-1?'1px solid var(--border)':'none', cursor:i<step?'pointer':'default', transition:'all .2s' }}>
              <div style={{ fontSize:15, marginBottom:2 }}>{i<step?'':s.icon}</div>
              <div style={{ fontSize:10, fontWeight:600, color:i===step?'var(--accent)':i<step?'var(--success)':'var(--text-muted)', letterSpacing:.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Sélection patient ── */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-lg)', padding:'18px 24px', marginBottom:14 }}>
          <SectionTitle accent="#6b7280">Patient</SectionTitle>
          <PatientPicker
            selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
            patientSearch={patientSearch} setPatientSearch={setPatientSearch}
            showPatientDrop={showPatientDrop} setShowPatientDrop={setShowPatientDrop}
            patients={patients} patientsLoading={patientsLoading}
            patientIdInt={patientIdInt} submitting={submitting}
          />
        </div>

        {/* ── Formulaire ── */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-lg)', padding:'28px 32px' }}>
          <form onSubmit={handleSubmit(onStepSubmit)}>

            {/* ══ STEP 0 — Type de cancer ══ */}
            {step === 0 && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#6b7280">Type de cancer</SectionTitle>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                  {[
                    { v:'solide', icon:'', label:'Tumeur solide',      desc:'Sein, poumon, côlon, prostate...', color:'#00a8ff' },
                    { v:'hemato', icon:'', label:'Hémopathie maligne', desc:'Lymphome, leucémie, myélome...',   color:'#9b8afb' },
                  ].map(opt => (
                    <button key={opt.v} type="button" onClick={() => { setCancerType(opt.v); setHematoId(''); }}
                      style={{ padding:'16px 18px', borderRadius:'var(--radius-md)', cursor:'pointer', textAlign:'left', transition:'all .15s', width:'100%', background:cancerType===opt.v?`${opt.color}12`:'var(--bg-elevated)', border:`2px solid ${cancerType===opt.v?opt.color:'var(--border)'}`, boxShadow:cancerType===opt.v?`0 0 0 3px ${opt.color}18`:'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:22 }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:700, color:cancerType===opt.v?opt.color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{opt.label}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{opt.desc}</div>
                        </div>
                        {cancerType===opt.v && (
                          <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:opt.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {cancerType === 'hemato' && (
                  <div style={{ animation:'fadeIn .2s ease' }}>
                    <SectionTitle accent="#9b8afb">Diagnostic hématologique</SectionTitle>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                      <CatBtn active={catFilter===''} color="#6b7280" onClick={()=>setCatFilter('')}>Toutes</CatBtn>
                      {CATEGORIES_HEMATO.map(c=>(
                        <CatBtn key={c.key} active={catFilter===c.key} color={c.color} onClick={()=>setCatFilter(c.key===catFilter?'':c.key)}>{c.label}</CatBtn>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {HEMOPATHIES.filter(h => !catFilter||h.cat===catFilter).map(h => {
                        const hcat = CATEGORIES_HEMATO.find(c=>c.key===h.cat);
                        const active = hematoId===h.id;
                        return (
                          <button key={h.id} type="button" onClick={()=>setHematoId(active?'':h.id)}
                            style={{ padding:'10px 12px', borderRadius:'var(--radius-md)', cursor:'pointer', textAlign:'left', transition:'all .12s', background:active?`${hcat.color}12`:'var(--bg-elevated)', border:`1px solid ${active?hcat.color+'45':'var(--border)'}`, display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:9.5, fontWeight:800, color:hcat.color, padding:'2px 6px', background:`${hcat.color}15`, border:`1px solid ${hcat.color}30`, borderRadius:4, flexShrink:0 }}>{h.abrev}</span>
                            <span style={{ fontSize:12, fontWeight:active?600:400, color:active?'var(--text-primary)':'var(--text-secondary)', lineHeight:1.3, flex:1 }}>{h.label}</span>
                            {active && <span style={{ color:hcat.color, fontSize:13, flexShrink:0 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    {hemopathie && cat && (
                      <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'10px 14px', background:`${cat.color}08`, border:`1px solid ${cat.color}25`, borderRadius:'var(--radius-md)', animation:'fadeIn .15s ease' }}>
                        <div>
                          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>Topographie ICD-O-3</div>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:cat.color, fontWeight:700 }}>{hemopathie.top}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>Morphologie ICD-O-3</div>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>{hemopathie.morph}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 1 — Histologie ══ */}
            {step === 1 && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#00a8ff">Histologie & Morphologie</SectionTitle>
                <VoiceDictation formType="diagnostic" onFieldsExtracted={applyVoiceFields} />
                <div style={{ margin:'12px 0', height:1, background:'var(--border)' }} />

                {cancerType === 'solide' ? (
                  <>
                    <Row>
                      <Field label="Code topographie (ICD-O-3) *" error={errors.topographie_code?.message}>
                        <input {...register('topographie_code',{required:'Code topographie requis'})} placeholder="Ex: C50.9" style={inputStyle(errors.topographie_code)} />
                      </Field>
                      <Field label="Libellé topographie">
                        <input {...register('topographie_libelle')} placeholder="Ex: Sein, sans précision" style={inputStyle()} />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Code morphologie (ICD-O-3)">
                        <input {...register('morphologie_code')} placeholder="Ex: 8500/3" style={inputStyle()} />
                      </Field>
                      <Field label="Libellé morphologie">
                        <input {...register('morphologie_libelle')} placeholder="Ex: Carcinome canalaire infiltrant" style={inputStyle()} />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Type de diagnostic">
                        <select {...register('type_diagnostic')} style={selectStyle()}>
                          {TYPE_DIAG_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </Field>
                      <Field label="Latéralité">
                        <select {...register('lateralite')} style={selectStyle()}>
                          <option style={{background:'white'}} value="">— Sélectionner —</option>
                          {LATERALITE_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Base du diagnostic">
                        <select {...register('base_diagnostic')} style={selectStyle()}>
                          <option style={{background:'white'}} value="">— Sélectionner —</option>
                          {BASE_DIAG_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </Field>
                      <Field label="Grade histologique">
                        <select {...register('grade_histologique')} style={selectStyle()}>
                          <option style={{background:'white'}} value="">— Sélectionner —</option>
                          {GRADE_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </Field>
                    </Row>
                    <Field label="Variante histologique">
                      <input {...register('variante_histologique')} placeholder="Ex: Lobulaire, Mucineux..." style={inputStyle()} />
                    </Field>
                    <Field label="Immunohistochimie (IHC)">
                      <textarea {...register('immunohistochimie')} rows={3} placeholder="Ex: RE+++ 90%, RP+ 40%, HER2 négatif, Ki67 15%..." style={{ ...inputStyle(), resize:'vertical', lineHeight:1.5 }} />
                    </Field>
                    <Field label="Rapport anatomopathologique">
                      <textarea {...register('rapport_complet')} rows={3} placeholder="Compte-rendu anatomopathologique..." style={{ ...inputStyle(), resize:'vertical', lineHeight:1.5 }} />
                    </Field>
                  </>
                ) : hemopathie && cat && (
                  <>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>Examens — {hemopathie.label}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{hemopathie.examens.filter(e=>e.requis).length} obligatoires · {hemopathie.examens.filter(e=>!e.requis).length} facultatifs</span>
                    </div>
                    {Object.entries(EXAMEN_TYPE_CFG).map(([typeKey, typeCfg]) => {
                      const examensType = hemopathie.examens.filter(e=>e.type===typeKey);
                      if (!examensType.length) return null;
                      return (
                        <div key={typeKey} style={{ marginBottom:16 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', background:typeCfg.color, flexShrink:0 }}/>
                            <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', color:typeCfg.color }}>{typeCfg.label}</span>
                            <div style={{ flex:1, height:1, background:`${typeCfg.color}20` }}/>
                          </div>
                          {examensType.map(examen => {
                            const errObj = errors?.examens?.[examen.key];
                            return (
                              <div key={examen.key} style={{ padding:'10px 12px', marginBottom:7, background:typeCfg.bg, border:`1px solid ${errObj?'#ff4d6a':typeCfg.border}`, borderRadius:'var(--radius-md)' }}>
                                <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>
                                  <span style={{ width:5, height:5, borderRadius:'50%', background:typeCfg.color, flexShrink:0 }}/>
                                  {examen.label}
                                  {examen.requis ? <span style={{ fontSize:10, color:'#ff4d6a', fontWeight:700 }}>*</span> : <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:400 }}>(facultatif)</span>}
                                </label>
                                <textarea
                                  {...register(`examens.${examen.key}`,examen.requis?{required:`${examen.label} : résultat requis`}:{})}
                                  rows={2} placeholder={`Résultat — ${examen.label}`}
                                  style={{ width:'100%', padding:'8px 10px', background:'var(--bg-card)', border:`1px solid ${errObj?'#ff4d6a':'var(--border)'}`, borderRadius:6, color:'var(--text-primary)', fontSize:12.5, outline:'none', fontFamily:'var(--font-body)', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' }}
                                />
                                {errObj && <p style={{ marginTop:3, fontSize:11, color:'#ff4d6a' }}>{errObj.message}</p>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ══ STEP 2 — Staging TNM ══ */}
            {step === 2 && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#00a8ff">Staging TNM & Classification</SectionTitle>
                <Row>
                  <Field label="Date du diagnostic *" error={errors.date_diagnostic?.message}>
                    <input type="date" {...register('date_diagnostic',{required:'Date requise'})} style={inputStyle(errors.date_diagnostic)} />
                  </Field>
                  <Field label="Stade AJCC">
                    <select {...register('stade_ajcc')} style={selectStyle()}>
                      <option style={{background:'white'}} value="">— Sélectionner —</option>
                      {STADE_OPTIONS.map(s=><option style={{background:'white'}} key={s} value={s}>Stade {s}</option>)}
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="État d'extension">
                    <select {...register('etat_cancer')} style={selectStyle()}>
                      <option style={{background:'white'}} value="">— Sélectionner —</option>
                      {ETAT_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Type TNM">
                    <select {...register('tnm_type')} style={selectStyle()}>
                      <option style={{background:'white'}} value="c">cTNM — Clinique</option>
                      <option style={{background:'white'}} value="p">pTNM — Pathologique</option>
                      <option style={{background:'white'}} value="y">yTNM — Post-thérapeutique</option>
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="T — Tumeur primitive"><input {...register('tnm_t')} placeholder="Ex: T2, Tis, T4b" style={inputStyle()} /></Field>
                  <Field label="N — Ganglions régionaux"><input {...register('tnm_n')} placeholder="Ex: N0, N1, N2a" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="M — Métastases à distance"><input {...register('tnm_m')} placeholder="Ex: M0, M1, M1a" style={inputStyle()} /></Field>
                  <Field label="Édition TNM"><input {...register('tnm_edition')} type="number" placeholder="Ex: 8" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="Taille tumeur (mm)"><input {...register('taille_tumeur')} type="number" placeholder="Ex: 25" style={inputStyle()} /></Field>
                  <Field label="Ganglions envahis / prélevés">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <input {...register('nombre_ganglions')} type="number" placeholder="Envahis" style={inputStyle()} />
                      <input {...register('nombre_ganglions_preleves')} type="number" placeholder="Prélevés" style={inputStyle()} />
                    </div>
                  </Field>
                </Row>
                <Field label="Sites métastasiques">
                  <input {...register('metastases_sites')} placeholder="Ex: Foie, poumons, os..." style={inputStyle()} />
                </Field>
                <Field label="Performance status (OMS 0–4)">
                  <select {...register('performance_status')} style={selectStyle()}>
                    <option style={{background:'white'}} value="">— Sélectionner —</option>
                    {[['0','0 — Activité normale'],['1','1 — Symptômes légers'],['2','2 — Alité < 50%'],['3','3 — Alité > 50%'],['4','4 — Complètement invalide'],['U','U — Inconnu']].map(([v,l])=><option style={{background:'white'}} key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* ══ STEP 3 — Marqueurs biologiques (solide) ══ */}
            {step === 3 && cancerType === 'solide' && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#9b8afb">Marqueurs biologiques & Récepteurs</SectionTitle>
                <Row>
                  <Field label="Récepteurs œstrogènes (RE)"><select {...register('recepteur_re')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MARQUEUR_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="% RE"><input {...register('recepteur_re_pourcentage')} type="number" min="0" max="100" placeholder="Ex: 90" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="Récepteurs progestérone (RP)"><select {...register('recepteur_rp')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MARQUEUR_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="% RP"><input {...register('recepteur_rp_pourcentage')} type="number" min="0" max="100" placeholder="Ex: 40" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="HER2 (IHC)">
                    <select {...register('her2')} style={selectStyle()}>
                      <option style={{background:'white'}} value="">—</option><option style={{background:'white'}} value="positif">✓ Positif (3+)</option>
                      <option style={{background:'white'}} value="equivoque">~ Équivoque (2+)</option><option style={{background:'white'}} value="negatif">✗ Négatif (0/1+)</option>
                      <option style={{background:'white'}} value="inconnu">Inconnu</option>
                    </select>
                  </Field>
                  <Field label="HER2 FISH">
                    <select {...register('her2_fish')} style={selectStyle()}>
                      <option style={{background:'white'}} value="non_fait">Non fait</option><option style={{background:'white'}} value="amplifie">Amplifié</option>
                      <option style={{background:'white'}} value="non_amplifie">Non amplifié</option>
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="Ki67 (%)"><input {...register('ki67')} placeholder="Ex: 15%" style={inputStyle()} /></Field>
                  <Field label="PSA (ng/mL)"><input {...register('psa')} placeholder="Ex: 4.2" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="PD-L1"><input {...register('pdl1')} placeholder="Ex: 50%" style={inputStyle()} /></Field>
                  <Field label="Statut MMR">
                    <select {...register('mmr_status')} style={selectStyle()}>
                      <option style={{background:'white'}} value="">—</option><option style={{background:'white'}} value="proficient">pMMR — Proficient</option>
                      <option style={{background:'white'}} value="deficient">dMMR — Déficient</option><option style={{background:'white'}} value="inconnu">Inconnu</option>
                    </select>
                  </Field>
                </Row>
                <Row>
                  <Field label="EGFR"><select {...register('egfr')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="KRAS"><select {...register('kras')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="BRAF"><select {...register('braf')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="ALK"><select {...register('alk')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="BRCA1"><select {...register('brca1')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                  <Field label="BRCA2"><select {...register('brca2')} style={selectStyle()}><option style={{background:'white'}} value="">—</option>{MOLEC_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}</select></Field>
                </Row>
                <Row>
                  <Field label="TMB (mut/Mb)"><input {...register('tmb')} type="number" placeholder="Ex: 12" style={inputStyle()} /></Field>
                  <Field label="Panel NGS"><input {...register('panel_ngs')} placeholder="Ex: Foundation One CDx" style={inputStyle()} /></Field>
                </Row>
                <Field label="Thérapie ciblée recommandée">
                  <input {...register('therapie_ciblee_recommandee')} placeholder="Ex: Trastuzumab + Pertuzumab" style={inputStyle()} />
                </Field>
                <Field label="Autres marqueurs / altérations">
                  <textarea {...register('autres_marqueurs')} rows={2} placeholder="Autres données biologiques..." style={{ ...inputStyle(), resize:'vertical', lineHeight:1.5 }} />
                </Field>
              </div>
            )}

            {/* ══ STEP 3 (hemato) / STEP 4 (solide) — Import fichiers ══ */}
            {step === 4 && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#f5a623">Fichiers de résultats</SectionTitle>
                <p style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:18, lineHeight:1.6 }}>
                  Importez les comptes-rendus, résultats de labo, imagerie ou tout document lié au diagnostic.
                  Les fichiers seront attachés au dossier après création.
                </p>

                {/* Drag & drop zone */}
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={()=>fileInputRef.current?.click()}
                  style={{ border:`2px dashed ${dragOver?'#f5a623':'var(--border)'}`, borderRadius:'var(--radius-lg)', padding:'36px 24px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(245,166,35,0.05)':'var(--bg-elevated)', transition:'all .2s', marginBottom:20 }}>
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx,.xlsx,.csv" onChange={e=>addFiles(Array.from(e.target.files))} style={{ display:'none' }} />
                  <div style={{ fontSize:40, marginBottom:10 }}>📂</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Glissez vos fichiers ici</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>ou cliquez pour sélectionner</div>
                  <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6 }}>
                    {['PDF','JPG','PNG','TIFF','DOC','XLSX'].map(ext=>(
                      <span key={ext} style={{ padding:'2px 8px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, fontSize:10, fontWeight:700, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{ext}</span>
                    ))}
                  </div>
                </div>

                

                {/* Liste fichiers */}
                {uploadedFiles.length > 0 ? (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:.6, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>
                      {uploadedFiles.length} fichier{uploadedFiles.length>1?'s':''} sélectionné{uploadedFiles.length>1?'s':''}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {uploadedFiles.map(f=>(
                        <FileCard key={f.id} f={f} onRemove={removeFile} onUpdate={updateFile}/>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'16px', textAlign:'center', background:'var(--bg-elevated)', border:'1px dashed var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-muted)', fontSize:12 }}>
                    Aucun fichier sélectionné — cette étape est facultative
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 5 — Synthèse & Prise en charge ══ */}
            {step === 5 && (
              <div style={{ animation:'fadeUp .3s ease' }}>
                <SectionTitle accent="#00e5a0">Prise en charge & Synthèse</SectionTitle>
                <Row>
                  <Field label="Médecin diagnostiqueur"><input {...register('medecin_diagnostiqueur')} placeholder="Dr Benali" style={inputStyle()} /></Field>
                  <Field label="Établissement"><input {...register('etablissement_diagnostic')} placeholder="CHU Oran" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="Date du 1er symptôme"><input type="date" {...register('date_premier_symptome')} style={inputStyle()} /></Field>
                  <Field label="N° de dossier local"><input {...register('numero_dossier')} placeholder="Ex: D-2024-0042" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="CIM-10 — Code"><input {...register('cim10_code')} placeholder="Ex: C50.9" style={inputStyle()} /></Field>
                  <Field label="CIM-10 — Libellé"><input {...register('cim10_libelle')} placeholder="Ex: Tumeur maligne du sein" style={inputStyle()} /></Field>
                </Row>
                <Row>
                  <Field label="Statut du dossier">
                    <select {...register('statut_dossier')} style={selectStyle()}>
                      {STATUT_DOSSIER_OPTIONS.map(o=><option style={{background:'white'}} key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </Field>
                  <Field label="Diagnostic principal">
                    <select {...register('est_principal')} style={selectStyle()}>
                      <option style={{background:'white'}} value="true">Oui</option><option style={{background:'white'}} value="false">Non</option>
                    </select>
                  </Field>
                </Row>
                <Field label="Observations cliniques">
                  <textarea {...register('observations')} rows={3} placeholder="Contexte clinique, symptômes..." style={{ ...inputStyle(), resize:'vertical', lineHeight:1.5 }} />
                </Field>

                <SectionTitle accent="#ff7832" style={{ marginTop:16 }}>Imagerie réalisée</SectionTitle>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 24px', background:'var(--bg-elevated)', padding:14, borderRadius:'var(--radius-md)', marginBottom:16 }}>
                  {[['img_scanner','Scanner'],['img_irm_cerebrale','IRM cérébrale'],['img_pet_scan','PET-Scan'],['img_echographie','Échographie'],['img_radiographie','Radiographie'],['img_scintigraphie','Scintigraphie']].map(([key,label])=>(
                    <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'5px 0' }}>
                      <input type="checkbox" {...register(key)} style={{ width:15, height:15, accentColor:'var(--accent)' }} />
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
                    </label>
                  ))}
                </div>

                
              </div>
            )}

            {/* Navigation */}
            <div style={{ display:'flex', gap:10, marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>
              {step > 0 && (
                <button type="button" onClick={()=>setStep(s=>s-1)}
                  style={{ flex:'0 0 110px', padding:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontSize:13.5, cursor:'pointer' }}>
                  Retour
                </button>
              )}
              <button type="submit" disabled={submitting}
                style={{ flex:1, padding:'12px', background:step===STEPS.length-1?`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`:'linear-gradient(135deg, #00a8ff, #0080cc)', border:'none', borderRadius:'var(--radius-md)', color:'#fff', fontSize:13.5, fontWeight:600, cursor:submitting?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:submitting?0.7:1 }}>
                {submitting
                  ? <><Spinner/> Enregistrement...</>
                  : step===STEPS.length-1
                    ? (cancerType==='hemato'?`Enregistrer — ${hemopathie?.abrev||'Hémato'}`:'Enregistrer le diagnostic')
                    : 'Continuer'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// FILE CARD
// ─────────────────────────────────────────────────────────────
function FileCard({ f, onRemove, onUpdate }) {
  const ext = f.name.split('.').pop().toUpperCase();
  const extColors = { PDF:'#ff4d6a', JPG:'#00a8ff', JPEG:'#00a8ff', PNG:'#00e5a0', TIFF:'#9b8afb', DOC:'#00a8ff', DOCX:'#00a8ff', XLSX:'#00e5a0' };
  const extColor = extColors[ext] || '#6b7280';
  const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} Ko` : `${(b/1024/1024).toFixed(1)} Mo`;

  return (
    <div style={{ display:'flex', gap:10, padding:'12px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', alignItems:'flex-start' }}>
      {f.preview ? (
        <img src={f.preview} alt={f.name} style={{ width:40, height:40, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid var(--border)' }} />
      ) : (
        <div style={{ width:40, height:40, borderRadius:6, background:`${extColor}15`, border:`1px solid ${extColor}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:800, color:extColor }}>{ext}</span>
        </div>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text-primary)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:5 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtSize(f.size)}</span>
          <select value={f.fileType} onChange={e=>onUpdate(f.id,'fileType',e.target.value)}
            style={{ padding:'2px 6px', fontSize:11, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-secondary)', cursor:'pointer' }}>
            {RESULT_FILE_TYPES.map(ft=><option key={ft.key} value={ft.key}>{ft.icon} {ft.label}</option>)}
          </select>
        </div>
        <input value={f.description} onChange={e=>onUpdate(f.id,'description',e.target.value)}
          placeholder="Description (facultatif)..."
          style={{ width:'100%', padding:'5px 8px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-primary)', fontSize:11.5, outline:'none', fontFamily:'var(--font-body)', boxSizing:'border-box' }}
        />
      </div>
      <button type="button" onClick={()=>onRemove(f.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16, padding:'0 2px', lineHeight:1, flexShrink:0 }}>✕</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PATIENT PICKER
// ─────────────────────────────────────────────────────────────
function PatientPicker({ selectedPatient, setSelectedPatient, patientSearch, setPatientSearch, showPatientDrop, setShowPatientDrop, patients, patientsLoading, patientIdInt, submitting }) {
  return (
    <div style={{ position:'relative' }}>
      <div onClick={()=>setShowPatientDrop(true)}
        style={{ width:'100%', padding:'10px 12px', background:'var(--bg-elevated)', border:`1px solid ${!patientIdInt&&submitting?'#ff4d6a':selectedPatient?'rgba(0,229,160,0.4)':'var(--border-light)'}`, borderRadius:'var(--radius-md)', cursor:'text', display:'flex', alignItems:'center', gap:8, boxSizing:'border-box' }}>
        {selectedPatient ? (
          <>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,229,160,0.15)', border:'1px solid rgba(0,229,160,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#00e5a0' }}>{(selectedPatient.prenom?.[0]||'')+(selectedPatient.nom?.[0]||'')}</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{selectedPatient.registration_number}{selectedPatient.date_naissance?` · ${new Date().getFullYear()-new Date(selectedPatient.date_naissance).getFullYear()} ans`:''}</div>
            </div>
            <button type="button" onClick={e=>{e.stopPropagation();setSelectedPatient(null);setPatientSearch('');}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16, padding:'0 2px', lineHeight:1 }}>✕</button>
          </>
        ) : (
          <input autoFocus={showPatientDrop} value={patientSearch}
            onChange={e=>{setPatientSearch(e.target.value);setShowPatientDrop(true);}}
            onFocus={()=>setShowPatientDrop(true)}
            placeholder="Rechercher par nom, prénom, n° dossier..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'var(--text-primary)', fontSize:13.5, fontFamily:'var(--font-body)' }}
          />
        )}
        {patientsLoading && <Spinner/>}
      </div>
      {showPatientDrop && !selectedPatient && patients.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', boxShadow:'0 8px 24px rgba(0,0,0,0.25)', overflow:'hidden', maxHeight:240, overflowY:'auto' }}
          onMouseDown={e=>e.preventDefault()}>
          {patients.map(p=>(
            <button key={p.id} type="button" onClick={()=>{setSelectedPatient(p);setShowPatientDrop(false);setPatientSearch('');}}
              style={{ width:'100%', padding:'10px 14px', background:'transparent', border:'none', borderBottom:'1px solid var(--border-light)', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg-elevated)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)' }}>{(p.prenom?.[0]||'')+(p.nom?.[0]||'')}</span>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{p.prenom} {p.nom}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.registration_number}{p.date_naissance?` · ${new Date().getFullYear()-new Date(p.date_naissance).getFullYear()} ans`:''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {showPatientDrop && !selectedPatient && patientSearch.length >= 2 && patients.length === 0 && !patientsLoading && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'12px 14px', color:'var(--text-muted)', fontSize:12.5 }}>
          Aucun patient trouvé pour « {patientSearch} »
        </div>
      )}
      {showPatientDrop && <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={()=>setShowPatientDrop(false)}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS PAYLOAD
// ─────────────────────────────────────────────────────────────
function buildPayloadSolide(data, patientIdInt) {
  const payload = { ...data, patient: patientIdInt, categorie_cancer: 'solide' };
  Object.keys(payload).forEach(k => { if (payload[k]===''||payload[k]===undefined) delete payload[k]; });
  if ('est_principal' in payload) payload.est_principal = payload.est_principal==='true'||payload.est_principal===true;
  ['img_scanner','img_irm_cerebrale','img_pet_scan','img_echographie','img_radiographie','img_scintigraphie'].forEach(k => { if (k in payload) payload[k] = Boolean(payload[k]); });
  return payload;
}
function buildPayloadHemato(data, patientIdInt, hemopathie) {
  const examens = {};
  if (data.examens && typeof data.examens === 'object') {
    Object.entries(data.examens).forEach(([k,v]) => { if (v && String(v).trim()!=='') examens[k]=String(v).trim(); });
  }
  const payload = {
    patient: patientIdInt, categorie_cancer: 'liquide',
    topographie_code: hemopathie.top, topographie_libelle: hemopathie.label,
    morphologie_code: hemopathie.morph, type_diagnostic: data.type_diagnostic||'initial',
    date_diagnostic: data.date_diagnostic||null,
    medecin_diagnostiqueur: data.medecin_diagnostiqueur||'',
    etablissement_diagnostic: data.etablissement_diagnostic||'',
    numero_dossier: data.numero_dossier||'', statut_dossier: data.statut_dossier||'en_cours',
    observations: data.observations||'', examens_hemato: examens,
  };
  if (!payload.date_diagnostic) delete payload.date_diagnostic;
  return payload;
}

// ─────────────────────────────────────────────────────────────
// MICRO-COMPOSANTS
// ─────────────────────────────────────────────────────────────
function SectionTitle({ children, accent, style: ext }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, ...ext }}>
      <div style={{ width:3, height:16, borderRadius:2, background:accent||'var(--accent)', flexShrink:0 }}/>
      <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{children}</span>
    </div>
  );
}
function CatBtn({ children, active, color, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ padding:'4px 11px', border:`1px solid ${active?color+'50':'var(--border)'}`, borderRadius:20, background:active?`${color}15`:'var(--bg-elevated)', color:active?color:'var(--text-muted)', fontSize:11, fontWeight:active?600:400, cursor:'pointer', transition:'all .12s', whiteSpace:'nowrap' }}>
      {children}
    </button>
  );
}
function Row({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>{children}</div>;
}
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:5, letterSpacing:.3 }}>{label}</label>
      {children}
      {error && <p style={{ marginTop:3, fontSize:11.5, color:'var(--danger)' }}>{error}</p>}
    </div>
  );
}
function Spinner() {
  return <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>;
}
const inputStyle  = (err) => ({ width:'100%', padding:'10px 12px', background:'var(--bg-elevated)', border:`1px solid ${err?'var(--danger)':'var(--border-light)'}`, borderRadius:'var(--radius-md)', color:'var(--text-primary)', fontSize:13.5, outline:'none', fontFamily:'var(--font-body)', boxSizing:'border-box' });
const selectStyle = (err) => ({ ...inputStyle(err), cursor:'pointer' });
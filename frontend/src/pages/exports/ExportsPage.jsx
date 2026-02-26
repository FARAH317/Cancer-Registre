import { useState, useEffect } from 'react';
import { exportsService } from '../../services/exportsService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

// ── Constantes ────────────────────────────────────────────────────
const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem',"M'Sila",'Mascara','Ouargla','Oran',
  'El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf',
  'Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla',
  'Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
  'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet',
  "El M'Ghair",'El Meniaa',
];

const currentYear = new Date().getFullYear();
const ANNEES = Array.from({ length: 10 }, (_, i) => currentYear - i);

// ── Composants ─────────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function ExportCard({ icon, title, description, format, color, onExport, loading, count, tags = [] }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color}20`,
      borderRadius: 'var(--radius-md)', padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}50`; e.currentTarget.style.boxShadow = `0 4px 20px ${color}12`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{title}</div>
            <div style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${color}10`, color, border: `1px solid ${color}20`, display: 'inline-block', marginTop: 2, fontWeight: 600 }}>
              {format}
            </div>
          </div>
        </div>
        {count !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{count.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>enregistrements</div>
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{description}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(t => (
            <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>✓ {t}</span>
          ))}
        </div>
      )}

      {/* Bouton */}
      <button onClick={onExport} disabled={loading} style={{
        padding: '10px 16px', background: loading ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        border: 'none', borderRadius: 'var(--radius-md)', color: loading ? 'var(--text-muted)' : '#fff',
        fontSize: 12.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-display)', transition: 'opacity 0.15s',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? (
          <>
            <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Génération en cours...
          </>
        ) : (
          <>⬇ Télécharger {format}</>
        )}
      </button>
    </div>
  );
}

function FilterPanel({ filters, onChange }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>🔍 Filtres appliqués à tous les exports</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div>
          <label style={labelSt}>Année</label>
          <select value={filters.annee} onChange={e => onChange({ ...filters, annee: e.target.value })} style={selSt}>
            <option value="">Toutes les années</option>
            {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Sexe</label>
          <select value={filters.sexe} onChange={e => onChange({ ...filters, sexe: e.target.value })} style={selSt}>
            <option value="">Tous</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
        <div>
          <label style={labelSt}>Wilaya</label>
          <select value={filters.wilaya} onChange={e => onChange({ ...filters, wilaya: e.target.value })} style={selSt}>
            <option value="">Toutes les wilayas</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Statut dossier</label>
          <select value={filters.statut} onChange={e => onChange({ ...filters, statut: e.target.value })} style={selSt}>
            <option value="">Tous les statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="traitement">En traitement</option>
            <option value="remission">En rémission</option>
            <option value="perdu">Perdu de vue</option>
            <option value="decede">Décédé</option>
          </select>
        </div>
      </div>
      {(filters.annee || filters.sexe || filters.wilaya || filters.statut) && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filtres actifs :</span>
          {filters.annee  && <Tag label={`Année : ${filters.annee}`}  onRemove={() => onChange({ ...filters, annee: '' })} />}
          {filters.sexe   && <Tag label={`Sexe : ${filters.sexe === 'M' ? 'Masculin' : 'Féminin'}`} onRemove={() => onChange({ ...filters, sexe: '' })} />}
          {filters.wilaya && <Tag label={`Wilaya : ${filters.wilaya}`} onRemove={() => onChange({ ...filters, wilaya: '' })} />}
          {filters.statut && <Tag label={`Statut : ${filters.statut}`} onRemove={() => onChange({ ...filters, statut: '' })} />}
          <button onClick={() => onChange({ annee: '', sexe: '', wilaya: '', statut: '' })}
            style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 20, color: '#ff4d6a', cursor: 'pointer', marginLeft: 'auto' }}>
            ✕ Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.2)', color: '#00a8ff', display: 'flex', alignItems: 'center', gap: 4 }}>
      {label}
      <span onClick={onRemove} style={{ cursor: 'pointer', color: '#ff4d6a', fontWeight: 700 }}>✕</span>
    </span>
  );
}

// ── Page principale ───────────────────────────────────────────────
export default function ExportsPage() {
  const [info, setInfo]       = useState(null);
  const [filters, setFilters] = useState({ annee: '', sexe: '', wilaya: '', statut: '' });
  const [loading, setLoading] = useState({});

  useEffect(() => {
    exportsService.info().then(({ data }) => setInfo(data)).catch(() => {});
  }, []);

  const run = async (key, fn) => {
    setLoading(p => ({ ...p, [key]: true }));
    try {
      await fn();
      toast.success('Export téléchargé !');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'export');
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  };

  const f = filters;

  return (
    <AppLayout title="Rapports & Exports">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,168,255,0.08), rgba(155,138,251,0.05))', border: '1px solid rgba(0,168,255,0.15)', borderRadius: 'var(--radius-lg)', padding: '18px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              📤 Centre d'export — RegistreCancer.dz
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Générez des rapports PDF, des fichiers Excel et des exports CanReg5 (IARC) depuis vos données.
            </p>
          </div>
          {info && (
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Patients',    value: info.patients,    color: '#00a8ff' },
                { label: 'Diagnostics', value: info.diagnostics, color: '#9b8afb' },
                { label: 'Traitements', value: info.traitements, color: '#00e5a0' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value?.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <FilterPanel filters={filters} onChange={setFilters} />

      {/* ── Section PDF ────────────────────────────────────────── */}
      <SectionTitle icon="📄" title="Rapports PDF" subtitle="Documents formatés, prêts à imprimer ou partager" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <ExportCard
          icon="📊" title="Rapport épidémiologique" format="PDF"
          color="#ff4d6a"
          description="Rapport complet avec KPIs, répartition par sexe, top cancers, incidence par wilaya et distribution par stade AJCC. Mise en page professionnelle avec header et footer."
          tags={['KPIs', 'Top cancers', 'Wilayas', 'Stades AJCC', 'Répartition H/F']}
          loading={loading.rapportPdf}
          onExport={() => run('rapportPdf', () => exportsService.rapportPdf({ annee: f.annee }))}
        />
        <ExportCard
          icon="👤" title="Fiche patient individuelle" format="PDF"
          color="#9b8afb"
          description="Fiche complète d'un patient avec identité, statuts cliniques, liste des diagnostics et historique des traitements. Entrez l'ID du patient ci-dessous."
          tags={['Identité', 'Diagnostics', 'Traitements', 'Statut vital']}
          loading={loading.fichePdf}
          onExport={() => {/* handled by modal below */}}
          count={undefined}
        />
      </div>

      {/* Fiche patient - input ID */}
      <PatientPdfExport loading={loading.fichePdf} onExport={(pid) => run('fichePdf', () => exportsService.fichePatientPdf(pid))} />

      {/* ── Section Excel ────────────────────────────────────────── */}
      <SectionTitle icon="📊" title="Exports Excel (XLSX)" subtitle="Fichiers tabulés avec mise en forme, filtres automatiques et graphiques" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <ExportCard
          icon="👥" title="Liste des patients" format="XLSX"
          color="#00a8ff"
          description="Tous les champs patients : identité, wilaya, statut dossier, statut vital, médecin référent. Filtres automatiques Excel activés."
          tags={['Identité complète', 'Wilaya', 'Statuts', 'Filtres auto']}
          count={info?.patients}
          loading={loading.patientsXlsx}
          onExport={() => run('patientsXlsx', () => exportsService.patientsXlsx({ annee: f.annee, sexe: f.sexe, wilaya: f.wilaya, statut: f.statut }))}
        />
        <ExportCard
          icon="🔬" title="Diagnostics" format="XLSX"
          color="#9b8afb"
          description="Liste des diagnostics avec topographie ICD-O-3, morphologie, stade AJCC, TNM et base diagnostique."
          tags={['ICD-O-3', 'TNM', 'Stade AJCC', 'Morphologie']}
          count={info?.diagnostics}
          loading={loading.diagXlsx}
          onExport={() => run('diagXlsx', () => exportsService.diagnosticsXlsx({ annee: f.annee, wilaya: f.wilaya }))}
        />
        <ExportCard
          icon="📈" title="Rapport épidémiologique" format="XLSX"
          color="#00e5a0"
          description="Classeur multi-feuilles : couverture KPIs, incidence par wilaya avec graphique, top cancers, distribution par stade avec camembert."
          tags={['Multi-feuilles', 'Graphiques', 'Wilayas', 'Stades']}
          loading={loading.rapportXlsx}
          onExport={() => run('rapportXlsx', () => exportsService.rapportXlsx({ annee: f.annee }))}
        />
      </div>

      {/* ── Section CanReg5 ──────────────────────────────────────── */}
      <SectionTitle icon="🌍" title="Export CanReg5 (IARC)" subtitle="Format standardisé pour les registres du cancer — compatible avec le logiciel CanReg5 de l'IARC" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        <ExportCard
          icon="🌍" title="Export CanReg5" format="TXT/CSV"
          color="#f5a623"
          description="Export au format CanReg5 (IARC) — fichier texte tabulé avec colonnes standardisées : numéro registre, sexe, date naissance, topographie ICD-O, morphologie, comportement, base diagnostique et statut vital."
          tags={['Format IARC', 'ICD-O-3', 'Compatible CanReg5', 'UTF-8']}
          count={info ? info.patients + info.diagnostics : undefined}
          loading={loading.canreg5}
          onExport={() => run('canreg5', () => exportsService.canreg5({ annee: f.annee, wilaya: f.wilaya }))}
        />
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f5a623', marginBottom: 10 }}>ℹ Format CanReg5 — Colonnes exportées</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {[
              'REGISTRATIONNUMBER', 'TUMOURREGISTRATIONNUMBER',
              'SEX', 'BIRTHDATE', 'INCIDENCEDATE',
              'TOPOGRAPHY', 'MORPHOLOGY', 'BEHAVIOUR',
              'GRADE', 'BASIS', 'LATERALITY',
              'TNMT / TNMN / TNMM', 'STAGEVITAL', 'SOURCE',
            ].map(col => (
              <div key={col} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
                {col}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Le fichier peut être importé directement dans <strong style={{ color: '#f5a623' }}>CanReg5</strong> (logiciel IARC) ou dans tout système de registre compatible.
          </div>
        </div>
      </div>

      {/* ── Historique fictif ─────────────────────────────────────── */}
      <ExportHistory />
    </AppLayout>
  );
}

// ── Sous-composant : export fiche patient avec sélection ID ───────
function PatientPdfExport({ loading, onExport }) {
  const [patientId, setPatientId] = useState('');
  const [search, setSearch]       = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const { default: api } = await import('../../services/api');
      const { data } = await api.get('/patients/', { params: { search, page_size: 8 } });
      setResults(data.results || data);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  return (
    <div style={{ background: 'rgba(155,138,251,0.05)', border: '1px solid rgba(155,138,251,0.15)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#9b8afb', marginBottom: 12 }}>👤 Sélectionner un patient pour la fiche PDF</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (!e.target.value) setResults([]); }}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Rechercher par nom ou N° registre (ex: P-2024-0001)..."
          style={{ flex: 1, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', fontFamily: 'var(--font-body)' }}
        />
        <button onClick={doSearch} disabled={searching}
          style={{ padding: '9px 16px', background: 'rgba(155,138,251,0.15)', border: '1px solid rgba(155,138,251,0.3)', borderRadius: 'var(--radius-md)', color: '#9b8afb', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {searching ? '...' : '🔍 Chercher'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {results.map(p => (
            <div key={p.id}
              onClick={() => { setPatientId(String(p.id)); setResults([]); setSearch(`${p.registration_number} — ${p.full_name}`); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: patientId === String(p.id) ? 'rgba(155,138,251,0.1)' : 'var(--bg-elevated)', border: `1px solid ${patientId === String(p.id) ? 'rgba(155,138,251,0.3)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(155,138,251,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = patientId === String(p.id) ? 'rgba(155,138,251,0.1)' : 'var(--bg-elevated)'}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9b8afb' }}>{p.registration_number}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{p.full_name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.wilaya}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          placeholder="ID patient (ex: 42)"
          style={{ width: 120, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 12.5, outline: 'none', fontFamily: 'var(--font-mono)' }}
        />
        <button
          onClick={() => { if (patientId) onExport(patientId); else toast.error('Sélectionnez un patient d\'abord'); }}
          disabled={loading || !patientId}
          style={{ padding: '9px 18px', background: loading || !patientId ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#9b8afb,#7c6fcd)', border: 'none', borderRadius: 'var(--radius-md)', color: loading || !patientId ? 'var(--text-muted)' : '#fff', fontSize: 12.5, fontWeight: 600, cursor: loading || !patientId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <>
            <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#9b8afb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Génération...
          </> : '⬇ Télécharger la fiche PDF'}
        </button>
        {patientId && <span style={{ fontSize: 11, color: '#00e5a0' }}>✓ Patient #{patientId} sélectionné</span>}
      </div>
    </div>
  );
}

// ── Historique des exports (session) ─────────────────────────────
function ExportHistory() {
  const [history] = useState(() => {
    // Session history stored in memory
    return [];
  });

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
        📋 Formats supportés
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { fmt: 'PDF',      icon: '📄', color: '#ff4d6a', desc: 'ReportLab — mise en page professionnelle, header/footer' },
          { fmt: 'XLSX',     icon: '📊', color: '#00a8ff', desc: 'openpyxl — multi-feuilles, graphiques, filtres auto' },
          { fmt: 'CSV/TXT',  icon: '🌍', color: '#f5a623', desc: 'CanReg5 IARC — format tabulé standard international' },
          { fmt: 'JSON/API', icon: '🔌', color: '#9b8afb', desc: 'Endpoints REST disponibles pour intégration tierce' },
        ].map(f => (
          <div key={f.fmt} style={{ padding: '12px', background: 'var(--bg-elevated)', border: `1px solid ${f.color}15`, borderRadius: 8 }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: f.color, marginBottom: 4 }}>{f.fmt}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const labelSt = { display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 };
const selSt   = { width: '100%', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12, outline: 'none', cursor: 'pointer' };

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { traitementService } from '../../services/traitementService';
import { AppLayout } from '../../components/layout/Sidebar';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  chimio:    { label: 'Chimiothérapie',  color: '#00a8ff', statsKey: 'chimiotherapies'  },
  radio:     { label: 'Radiothérapie',   color: '#f5a623', statsKey: 'radiotherapies'   },
  chirurgie: { label: 'Chirurgie',       color: '#ff4d6a', statsKey: 'chirurgies'       },
  hormono:   { label: 'Hormonothérapie', color: '#00e5a0', statsKey: 'hormonotherapies' },
  immuno:    { label: 'Immunothérapie',  color: '#c084fc', statsKey: 'immunotherapies'  },
};

const STATUT_COLORS = {
  planifie:  { bg: 'rgba(155,138,251,0.12)', color: '#9b8afb', border: 'rgba(155,138,251,0.3)' },
  en_cours:  { bg: 'rgba(0,168,255,0.12)',   color: '#00a8ff', border: 'rgba(0,168,255,0.3)'   },
  termine:   { bg: 'rgba(0,229,160,0.12)',   color: '#00e5a0', border: 'rgba(0,229,160,0.3)'   },
  suspendu:  { bg: 'rgba(245,166,35,0.12)',  color: '#f5a623', border: 'rgba(245,166,35,0.3)'  },
  abandonne: { bg: 'rgba(255,77,106,0.12)',  color: '#ff4d6a', border: 'rgba(255,77,106,0.3)'  },
};

const STATUT_LABELS = {
  planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé',
  suspendu: 'Suspendu', abandonne: 'Abandonné',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—';

// ── Page ──────────────────────────────────────────────────────────
export default function TraitementsPage() {
  const navigate = useNavigate();

  const [traitements, setTraitements] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [typeFilter,  setTypeFilter]  = useState('');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [hasNext,     setHasNext]     = useState(false);
  const [hasPrev,     setHasPrev]     = useState(false);
  const [total,       setTotal]       = useState(0);

  // ── Stats ─────────────────────────────────────────────────────
  useEffect(() => {
    traitementService.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  // ── Liste ─────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      if (typeFilter) {
        const params = { page };
        if (search) params.search = search;
        const { data } = await traitementService[typeFilter].list(params);
        const items = (data.results ?? data).map(t => ({ ...t, _type: typeFilter }));
        setTraitements(items);
        setTotal(data.count ?? items.length);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
      } else {
        const types  = Object.keys(TYPE_CONFIG);
        const params = search ? { search } : {};
        const results = await Promise.allSettled(
          types.map(t => traitementService[t].list(params))
        );
        const all = [];
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const items = r.value.data.results ?? r.value.data;
            items.forEach(t => all.push({ ...t, _type: types[i] }));
          }
        });
        all.sort((a, b) => new Date(b.date_debut || 0) - new Date(a.date_debut || 0));
        setTraitements(all);
        setTotal(all.length);
        setHasNext(false);
        setHasPrev(false);
      }
    } catch {
      toast.error('Erreur lors du chargement des traitements');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search, page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const applyType   = (t) => { setTypeFilter(t); setPage(1); };
  const applySearch = (v) => { setSearch(v);      setPage(1); };

  // ── Données stats cards ────────────────────────────────────────
  const statsRows  = stats ? Object.entries(TYPE_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label, color: cfg.color, value: stats[cfg.statsKey] ?? 0 })) : null;
  const totalAll   = statsRows ? statsRows.reduce((s, r) => s + r.value, 0) : null;

  return (
    <AppLayout title="Traitements">
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:.3; } }
      `}</style>

      {/* ── Stats ── */}
      {statsRows && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total traitements"  value={totalAll}                                            color="#00a8ff" />
          <StatCard label="Chimiothérapies"    value={stats[TYPE_CONFIG.chimio.statsKey]    ?? 0}          color="#00a8ff" />
          <StatCard label="Radiothérapies"     value={stats[TYPE_CONFIG.radio.statsKey]     ?? 0}          color="#f5a623" />
          <StatCard label="Chirurgies"         value={stats[TYPE_CONFIG.chirurgie.statsKey] ?? 0}          color="#ff4d6a" />
        </div>
      )}

      {/* ── Charts ── */}
      {statsRows && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <ChartCard
            title="Répartition par type de traitement"
            data={statsRows}
            labelKey="label"
            valueKey="value"
            color="#00a8ff"
          />
          {stats?.par_statut_chimio?.length > 0 && (
            <ChartCard
              title="Statuts — Chimiothérapie"
              data={stats.par_statut_chimio.map(s => ({ label: STATUT_LABELS[s.statut] || s.statut, value: s.n }))}
              labelKey="label"
              valueKey="value"
              color="#9b8afb"
            />
          )}
        </div>
      )}

      {/* ── Barre filtres ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBox
          value={search}
          onChange={applySearch}
          placeholder="Rechercher par patient, protocole, molécule..."
        />
        <select value={typeFilter} onChange={e => applyType(e.target.value)} style={selectStyle}>
          <option value="">Type : Tous</option>
          {Object.entries(TYPE_CONFIG).map(([k, c]) => (
            <option key={k} value={k}>{c.label}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/traitements/nouveau" style={{ textDecoration: 'none' }}>
            <button style={addBtnStyle}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau traitement
            </button>
          </Link>
        </div>
      </div>

      {/* ── Légende statuts ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, paddingLeft: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cliquer sur le nom du patient pour ouvrir la fiche traitement</span>
        {Object.entries(STATUT_COLORS).map(([k, v]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: v.color }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.color, display: 'inline-block',
              animation: k === 'en_cours' ? 'pulse-dot 1.4s ease-in-out infinite' : 'none' }} />
            {STATUT_LABELS[k]}
          </span>
        ))}
      </div>

      {/* ── Tableau ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loading ? <Loader /> : traitements.length === 0 ? <Empty /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Patient', 'Type', 'Détail', 'Ligne / Dose', 'Date début', 'Date fin', 'Statut', 'Intention', ''].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {traitements.map((t, i) => {
                const cfg   = TYPE_CONFIG[t._type] || TYPE_CONFIG.chimio;
                const sc    = STATUT_COLORS[t.statut] || STATUT_COLORS.planifie;
                const rowBg = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
                const det   = getDetail(t);

                return (
                  <tr
                    key={`${t._type}-${t.id}`}
                    style={{ borderBottom: '1px solid var(--border)', background: rowBg, transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {/* Patient */}
                    <td style={tdStyle}>
                      <div
                        onClick={() => navigate(`/traitements/${t._type}/${t.id}`)}
                        style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', gap: 1 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color, flexShrink: 0, display: 'inline-block',
                            animation: t.statut === 'en_cours' ? 'pulse-dot 1.4s ease-in-out infinite' : 'none' }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                            {t.patient_nom || `Patient #${t.patient}`}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', paddingLeft: 13 }}>
                          {t.patient_numero}
                        </span>
                      </div>
                    </td>

                    {/* Type badge */}
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Détail principal (protocole / site / acte / molécule) */}
                    <td style={tdStyle}>
                      <div style={{ fontFamily: det.mono ? 'var(--font-mono)' : 'inherit', fontSize: 11, color: det.mono ? cfg.color : 'var(--text-secondary)', fontWeight: det.mono ? 700 : 400 }}>
                        {det.primary || '—'}
                      </div>
                      {det.sub && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{det.sub}</div>
                      )}
                    </td>

                    {/* Ligne / Dose / Séances */}
                    <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {det.extra || '—'}
                    </td>

                    {/* Dates */}
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {fmtDate(t.date_debut)}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                      {fmtDate(t.date_fin)}
                    </td>

                    {/* Statut */}
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: 'nowrap' }}>
                        {t.statut_label || STATUT_LABELS[t.statut] || t.statut}
                      </span>
                    </td>

                    {/* Intention */}
                    <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)' }}>
                      {t.intention_label || '—'}
                    </td>

                    {/* Voir */}
                    <td style={tdStyle}>
                      <Link to={`/traitements/${t._type}/${t.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{ padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 11.5, cursor: 'pointer' }}>
                          Voir
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {(hasNext || hasPrev) && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} traitement(s)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <PageBtn disabled={!hasPrev} onClick={() => setPage(p => p - 1)}>← Précédent</PageBtn>
              <PageBtn disabled={!hasNext} onClick={() => setPage(p => p + 1)}>Suivant →</PageBtn>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── getDetail ─────────────────────────────────────────────────────
function getDetail(t) {
  switch (t._type) {
    case 'chimio':
      return {
        primary: t.protocole || null,
        sub:     null,
        extra:   t.ligne != null ? `L${t.ligne} · ${t.cycles_realises ?? 0}/${t.nombre_cycles ?? '?'} cycles` : null,
        mono:    true,
      };
    case 'radio':
      return {
        primary: t.site_irradie || null,
        sub:     t.technique_label || null,
        extra:   t.dose_totale_gy ? `${t.dose_totale_gy} Gy` : null,
        mono:    false,
      };
    case 'chirurgie':
      return {
        primary: t.intitule_acte || null,
        sub:     t.type_label || null,
        extra:   t.marges_label || null,
        mono:    false,
      };
    case 'hormono':
      return {
        primary: t.molecule || null,
        sub:     t.type_label || null,
        extra:   t.dose_mg_jour ? `${t.dose_mg_jour} mg/j` : null,
        mono:    true,
      };
    case 'immuno':
      return {
        primary: t.molecule || null,
        sub:     t.biomarqueur_cible || null,
        extra:   t.nombre_cycles ? `${t.nombre_cycles} cycles` : null,
        mono:    true,
      };
    default:
      return { primary: null, sub: null, extra: null, mono: false };
  }
}

// ── Sub-components ────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'var(--font-display)', marginBottom: 2 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, data = [], labelKey, valueKey, color }) {
  const max = Math.max(...(data || []).map(d => d[valueKey]), 1);
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: .5 }}>
        {title}
      </div>
      {(data || []).slice(0, 6).map((item, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item[labelKey] || '—'}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color }}>{item[valueKey]}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(item[valueKey] / max) * 100}%`, background: color, borderRadius: 2, transition: 'width .5s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
      )}
    </div>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

function Loader() {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      Chargement...
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 64, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aucun traitement trouvé</div>
    </div>
  );
}

// ── Styles communs ────────────────────────────────────────────────
const thStyle = {
  padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
  letterSpacing: .5, color: 'var(--text-muted)', textTransform: 'uppercase',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
};
const tdStyle = { padding: '11px 12px', verticalAlign: 'middle' };
const selectStyle = {
  padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12.5,
  cursor: 'pointer', outline: 'none',
};
const addBtnStyle = {
  padding: '9px 18px', background: 'linear-gradient(135deg,#9b8afb,#7c6fcd)', border: 'none',
  borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  fontFamily: 'var(--font-display)',
};
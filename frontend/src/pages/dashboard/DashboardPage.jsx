import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { AppLayout } from '../../components/layout/Sidebar';

// ── Couleurs ──────────────────────────────────────────────────────
const STADE_COLORS = {
  '0':'#00e5a0','I':'#4ade80','IA':'#86efac','IB':'#bbf7d0',
  'II':'#f5a623','IIA':'#fbbf24','IIB':'#fcd34d','IIC':'#fde68a',
  'III':'#ff7832','IIIA':'#fb923c','IIIB':'#fdba74','IIIC':'#fed7aa',
  'IV':'#ff4d6a','U':'#6b7280',
};
const STATUT_COLORS = {
  nouveau:'#9b8afb', traitement:'#00a8ff', remission:'#00e5a0',
  perdu:'#f5a623',   decede:'#ff4d6a',     archive:'#6b7280',
};
const REPONSE_COLORS = {
  RC:'#00e5a0', RP:'#00a8ff', SD:'#f5a623', PD:'#ff4d6a', NE:'#9ca3af',
};
const CHART_COLORS = ['#00a8ff','#9b8afb','#00e5a0','#f5a623','#ff4d6a','#c084fc','#38bdf8','#34d399','#fb923c'];

// ── Tooltip custom ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0f1420', border:'1px solid #1e2a3a', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      {label && <div style={{ color:'#9ca3af', marginBottom:6, fontWeight:600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e2e8f0', marginBottom:2 }}>
          {p.name} : <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon, trend, link }) {
  const content = (
    <div style={{
      background:'var(--bg-card)', border:`1px solid ${color}20`,
      borderRadius:'var(--radius-md)', padding:'16px 18px',
      position:'relative', overflow:'hidden',
      transition:'transform 0.15s, box-shadow 0.15s',
      cursor: link ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if(link){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${color}20`; }}}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Glow accent */}
      <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle, ${color}15 0%, transparent 70%)`, borderRadius:'0 var(--radius-md) 0 0' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:22, lineHeight:1 }}>{icon}</div>
        {trend !== undefined && (
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background: trend >= 0 ? 'rgba(0,229,160,0.12)' : 'rgba(255,77,106,0.12)', color: trend >= 0 ? '#00e5a0' : '#ff4d6a', fontWeight:600 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color, lineHeight:1, marginBottom:4 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom: sub ? 2 : 0 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration:'none' }}>{content}</Link> : content;
}

// ── Section Title ─────────────────────────────────────────────────
function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────
function ChartCard({ title, sub, children, span = 1 }) {
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border-light)',
      borderRadius:'var(--radius-md)', padding:'18px 20px',
      gridColumn: span === 2 ? '1 / -1' : 'auto',
    }}>
      <SectionTitle title={title} sub={sub} />
      {children}
    </div>
  );
}

// ── Bar horizontal simple ─────────────────────────────────────────
function HBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color, fontWeight:600 }}>{value}</span>
      </div>
      <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${color}cc, ${color})`, borderRadius:3, transition:'width 0.6s ease' }} />
      </div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── Alerte Card ───────────────────────────────────────────────────
function AlerteCard({ icon, label, value, color, link }) {
  return (
    <Link to={link || '#'} style={{ textDecoration:'none' }}>
      <div style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:'var(--radius-md)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background=`${color}15`}
        onMouseLeave={e => e.currentTarget.style.background=`${color}08`}
      >
        <span style={{ fontSize:20 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{label}</div>
        </div>
        <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', color }}>{value}</div>
      </div>
    </Link>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [alertes, setAlertes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: d }, { data: a }] = await Promise.all([
        dashboardService.global(),
        dashboardService.alertes(),
      ]);
      setData(d);
      setAlertes(a);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <AppLayout title="Dashboard">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:48, height:48, border:'3px solid var(--border)', borderTopColor:'#00a8ff', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
          <div style={{ color:'var(--text-muted)', fontSize:14 }}>Chargement des statistiques...</div>
        </div>
      </div>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout title="Dashboard">
      <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>
        <div style={{ fontSize:40, marginBottom:12 }}></div>
        <div>Impossible de charger les données. Vérifiez que le serveur Django est démarré.</div>
        <button onClick={fetchData} style={{ marginTop:16, padding:'8px 20px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', cursor:'pointer' }}>Réessayer</button>
      </div>
    </AppLayout>
  );

  const { kpis, par_sexe, par_statut, top_cancers, par_stade, evolution_mensuelle,
          top_wilayas, tranches_age, traitements_types, reponses_chimio, activite_recente } = data;

  // Préparer données pour graphiques
  const statutData = par_statut.map(s => ({
    name: { nouveau:'Nouveau', traitement:'Traitement', remission:'Rémission',
            perdu:'Perdu de vue', decede:'Décédé', archive:'Archivé' }[s.statut_dossier] || s.statut_dossier,
    value: s.count,
    color: STATUT_COLORS[s.statut_dossier] || '#9ca3af',
  }));

  const stadeData = par_stade
    .filter(s => s.count > 0)
    .map(s => ({
      name: s.stade_ajcc === 'U' ? 'Inconnu' : `Stade ${s.stade_ajcc}`,
      value: s.count,
      color: STADE_COLORS[s.stade_ajcc] || '#9ca3af',
    }));

  const sexeData = [
    { name: 'Femme', value: par_sexe.F || 0, color: '#ff80ab' },
    { name: 'Homme', value: par_sexe.M || 0, color: '#00a8ff' },
  ];

  const maxCancer  = Math.max(...(top_cancers || []).map(c => c.count), 1);
  const maxWilaya  = Math.max(...(top_wilayas || []).map(w => w.count), 1);

  return (
    <AppLayout title="Dashboard">

      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:2 }}>
            Tableau de bord — RegistreCancer.dz
          </h1>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
            Année {kpis.annee_courante} · {lastUpdate && `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-DZ')}`}
          </div>
        </div>
        <button onClick={fetchData} style={{ padding:'8px 16px', background:'var(--bg-elevated)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          ↻ Actualiser
        </button>
      </div>

      

      {/* ── KPIs Row 1 : Patients ────────────────────────────────── */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Patients</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
          <KPICard  label="Total patients" value={kpis.total_patients} color="#00a8ff" trend={kpis.nouveaux_ce_mois} sub={`+${kpis.nouveaux_annee} en ${kpis.annee_courante}`} link="/patients" />
          <KPICard  label="En traitement"  value={kpis.en_traitement}  color="#9b8afb" link="/patients" />
          <KPICard  label="En rémission"   value={kpis.en_remission}   color="#00e5a0" link="/patients" />
          <KPICard  label="Perdus de vue"  value={kpis.perdus_vue}     color="#f5a623" link="/patients" />
          <KPICard  label="Décédés"        value={kpis.decedes}        color="#ff4d6a" link="/patients" />
        </div>
      </div>

      {/* ── KPIs Row 2 : Clinique ────────────────────────────────── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Activité clinique</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <KPICard  label="Total diagnostics"   value={kpis.total_diagnostics} color="#c084fc" sub={`+${kpis.diagnostics_annee} en ${kpis.annee_courante}`} link="/diagnostics" />
          <KPICard  label="Total traitements"   value={kpis.total_traitements}  color="#38bdf8" link="/traitements" />
          <KPICard  label="Nouveaux ce mois"    value={kpis.nouveaux_ce_mois}   color="#fb923c" link="/patients" />
          <KPICard  label={`Nouveaux en ${kpis.annee_courante}`} value={kpis.nouveaux_annee} color="#4ade80" link="/patients" />
        </div>
      </div>

      {/* ── Graphiques Ligne 1 ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Évolution mensuelle */}
        <ChartCard title="Évolution mensuelle" sub="Patients & diagnostics sur 12 mois" span={2}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolution_mensuelle} margin={{ top:5, right:10, bottom:0, left:-20 }}>
              <defs>
                <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00a8ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00a8ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradDiag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9b8afb" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#9b8afb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="mois_court" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, paddingTop:8 }} />
              <Area type="monotone" dataKey="patients"    name="Patients"    stroke="#00a8ff" fill="url(#gradPatients)" strokeWidth={2} dot={false} activeDot={{ r:4 }} />
              <Area type="monotone" dataKey="diagnostics" name="Diagnostics" stroke="#9b8afb" fill="url(#gradDiag)"     strokeWidth={2} dot={false} activeDot={{ r:4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Graphiques Ligne 2 ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Répartition par sexe — Donut */}
        <ChartCard title="Répartition par sexe">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sexeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}
              >
                {sexeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:4 }}>
            {sexeData.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:s.color }} />
                <span style={{ color:'var(--text-secondary)' }}>{s.name} : <strong style={{ color:s.color }}>{s.value}</strong></span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Statuts dossiers — Donut */}
        <ChartCard title="Statuts dossiers">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                dataKey="value" paddingAngle={3}
              >
                {statutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} formatter={(val, name, props) => [val, props.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', justifyContent:'center', marginTop:4 }}>
            {statutData.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                <span style={{ color:'var(--text-muted)' }}>{s.name} <strong style={{ color:s.color }}>{s.value}</strong></span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Stades AJCC — Donut */}
        <ChartCard title="Stades AJCC / UICC">
          {stadeData.length === 0 ? (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:12 }}>
              Aucun diagnostic enregistré
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stadeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" paddingAngle={3}
                  >
                    {stadeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} formatter={(val, name, props) => [val, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px', justifyContent:'center', marginTop:4 }}>
                {stadeData.map(s => (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:s.color }} />
                    <span style={{ color:'var(--text-muted)' }}>{s.name} <strong style={{ color:s.color }}>{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Graphiques Ligne 3 ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Top cancers */}
        <ChartCard title="Top 10 localisations tumorales" sub="Topographie ICD-O-3 la plus fréquente">
          {top_cancers.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>Aucun diagnostic enregistré</div>
          ) : (
            <div style={{ marginTop:4 }}>
              {top_cancers.map((c, i) => (
                <HBar key={c.topographie_code}
                  label={`${c.topographie_code} – ${c.topographie_libelle}`}
                  value={c.count} max={maxCancer}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </div>
          )}
        </ChartCard>

        {/* Tranches d'âge — Bar chart */}
        <ChartCard title="Distribution par âge" sub="Âge au diagnostic">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={tranches_age} margin={{ top:5, right:10, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
              <XAxis dataKey="tranche" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Patients" radius={[4,4,0,0]}>
                {tranches_age.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Graphiques Ligne 4 ───────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Types de traitement — Bar horizontal */}
        <ChartCard title="Répartition des traitements" sub="Par type de traitement administré">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={traitements_types} layout="vertical" margin={{ top:0, right:20, bottom:0, left:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" tick={{ fill:'#9ca3af', fontSize:11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Total" radius={[0,4,4,0]}>
                {traitements_types.map((t, i) => (
                  <Cell key={i} fill={t.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top wilayas */}
        <ChartCard title="Top wilayas" sub="Patients par wilaya de résidence">
          {top_wilayas.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>Aucune wilaya renseignée</div>
          ) : (
            <div style={{ marginTop:4, maxHeight:220, overflowY:'auto' }}>
              {top_wilayas.map((w, i) => (
                <HBar key={w.wilaya}
                  label={w.wilaya}
                  value={w.count} max={maxWilaya}
                  color={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Activité récente + Réponses chimio ───────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>

        {/* Activité 30 derniers jours */}
        <ChartCard title="Activité — 30 derniers jours">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4 }}>
            {[
              {  label:'Nouveaux patients',    val:activite_recente.nouveaux_patients,    color:'#00a8ff' },
              {  label:'Nouveaux diagnostics', val:activite_recente.nouveaux_diagnostics, color:'#9b8afb' },
              {  label:'Nouvelles chimios',    val:activite_recente.nouveaux_chimio,      color:'#f5a623' },
              {  label:'Nouvelles chirurgies', val:activite_recente.nouvelles_chirurgies, color:'#ff4d6a' },
            ].map(item => (
              <div key={item.label} style={{ background:'var(--bg-elevated)', border:`1px solid ${item.color}18`, borderRadius:'var(--radius-md)', padding:'14px 16px' }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:'var(--font-display)', color:item.color, marginBottom:2 }}>{item.val}</div>
                <div style={{ fontSize:10.5, color:'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Réponses chimio */}
        <ChartCard title="Réponses aux chimiothérapies" sub="Évaluation tumorale">
          {reponses_chimio.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>
              Aucune évaluation enregistrée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reponses_chimio} margin={{ top:5, right:10, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                <XAxis dataKey="reponse_tumorale" tick={{ fill:'#6b7280', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Patients" radius={[4,4,0,0]}>
                  {reponses_chimio.map((r, i) => (
                    <Cell key={i} fill={REPONSE_COLORS[r.reponse_tumorale] || '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Liens rapides ─────────────────────────────────────────── */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'16px 20px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>Accès rapides</div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {[
            { to:'/patients/nouveau',       label:'Nouveau patient',    color:'#00a8ff' },
            { to:'/diagnostics/nouveau',    label:'Nouveau diagnostic', color:'#9b8afb' },
            { to:'/traitements/nouveau?type=chimio',  label:'Nouvelle chimio', color:'#f5a623' },
            { to:'/traitements/nouveau?type=chirurgie',  label:'Nouvelle chirurgie', color:'#ff4d6a' },
            { to:'/patients',               label:'Liste patients',     color:'#00e5a0' },
            { to:'/traitements',            label:'Traitements',        color:'#c084fc' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration:'none' }}>
              <div style={{ padding:'8px 16px', background:`${item.color}10`, border:`1px solid ${item.color}25`, borderRadius:'var(--radius-md)', color:item.color, fontSize:12.5, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background=`${item.color}20`}
                onMouseLeave={e => e.currentTarget.style.background=`${item.color}10`}
              >
                {item.icon} {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

    </AppLayout>
  );
}

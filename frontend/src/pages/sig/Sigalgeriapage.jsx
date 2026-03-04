import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '../../components/layout/Sidebar';

// ─────────────────────────────────────────────────────────────────
// SERVICE (replace with real API calls)
// ─────────────────────────────────────────────────────────────────
const sigService = {
  overview: async () => {
    // const res = await fetch('/api/sig/overview/', { headers: { Authorization: `Bearer ${token}` } });
    // return res.json();
    return generateMockData();
  },
};

// ─────────────────────────────────────────────────────────────────
// ALGERIA WILAYA DATA (code, nom, region, SVG path centroid)
// ─────────────────────────────────────────────────────────────────
const WILAYAS_META = {
  1:  { nom:"Adrar",               region:"sud",             cx:265, cy:610 },
  2:  { nom:"Chlef",               region:"nord",            cx:148, cy:135 },
  3:  { nom:"Laghouat",            region:"hauts_plateaux",  cx:205, cy:278 },
  4:  { nom:"Oum El Bouaghi",      region:"est",             cx:388, cy:195 },
  5:  { nom:"Batna",               region:"est",             cx:378, cy:218 },
  6:  { nom:"Béjaïa",              region:"nord",            cx:298, cy:112 },
  7:  { nom:"Biskra",              region:"hauts_plateaux",  cx:360, cy:280 },
  8:  { nom:"Béchar",              region:"sud",             cx:115, cy:370 },
  9:  { nom:"Blida",               region:"nord",            cx:215, cy:130 },
  10: { nom:"Bouira",              region:"nord",            cx:258, cy:130 },
  11: { nom:"Tamanrasset",         region:"sud",             cx:395, cy:740 },
  12: { nom:"Tébessa",             region:"est",             cx:445, cy:218 },
  13: { nom:"Tlemcen",             region:"ouest",           cx:72,  cy:158 },
  14: { nom:"Tiaret",              region:"hauts_plateaux",  cx:155, cy:185 },
  15: { nom:"Tizi Ouzou",          region:"nord",            cx:268, cy:112 },
  16: { nom:"Alger",               region:"nord",            cx:235, cy:108 },
  17: { nom:"Djelfa",              region:"hauts_plateaux",  cx:240, cy:248 },
  18: { nom:"Jijel",               region:"nord",            cx:338, cy:100 },
  19: { nom:"Sétif",               region:"est",             cx:328, cy:155 },
  20: { nom:"Saïda",               region:"ouest",           cx:115, cy:222 },
  21: { nom:"Skikda",              region:"est",             cx:390, cy:110 },
  22: { nom:"Sidi Bel Abbès",      region:"ouest",           cx:88,  cy:195 },
  23: { nom:"Annaba",              region:"est",             cx:428, cy:105 },
  24: { nom:"Guelma",              region:"est",             cx:415, cy:145 },
  25: { nom:"Constantine",         region:"est",             cx:400, cy:148 },
  26: { nom:"Médéa",               region:"hauts_plateaux",  cx:220, cy:165 },
  27: { nom:"Mostaganem",          region:"ouest",           cx:115, cy:148 },
  28: { nom:"M'Sila",              region:"hauts_plateaux",  cx:290, cy:218 },
  29: { nom:"Mascara",             region:"ouest",           cx:115, cy:200 },
  30: { nom:"Ouargla",             region:"sud",             cx:368, cy:398 },
  31: { nom:"Oran",                region:"ouest",           cx:90,  cy:130 },
  32: { nom:"El Bayadh",           region:"hauts_plateaux",  cx:148, cy:298 },
  33: { nom:"Illizi",              region:"sud",             cx:498, cy:548 },
  34: { nom:"Bordj Bou Arréridj",  region:"est",             cx:318, cy:168 },
  35: { nom:"Boumerdès",           region:"nord",            cx:245, cy:110 },
  36: { nom:"El Tarf",             region:"est",             cx:445, cy:118 },
  37: { nom:"Tindouf",             region:"sud",             cx:78,  cy:488 },
  38: { nom:"Tissemsilt",          region:"hauts_plateaux",  cx:165, cy:168 },
  39: { nom:"El Oued",             region:"sud",             cx:408, cy:338 },
  40: { nom:"Khenchela",           region:"est",             cx:415, cy:218 },
  41: { nom:"Souk Ahras",          region:"est",             cx:435, cy:138 },
  42: { nom:"Tipaza",              region:"nord",            cx:195, cy:118 },
  43: { nom:"Mila",                region:"est",             cx:362, cy:148 },
  44: { nom:"Aïn Defla",           region:"nord",            cx:178, cy:145 },
  45: { nom:"Naâma",               region:"hauts_plateaux",  cx:92,  cy:288 },
  46: { nom:"Aïn Témouchent",      region:"ouest",           cx:72,  cy:145 },
  47: { nom:"Ghardaïa",            region:"sud",             cx:278, cy:358 },
  48: { nom:"Relizane",            region:"ouest",           cx:128, cy:165 },
  49: { nom:"El M'Ghair",          region:"sud",             cx:395, cy:325 },
  50: { nom:"El Menia",            region:"sud",             cx:285, cy:438 },
  51: { nom:"Ouled Djellal",       region:"hauts_plateaux",  cx:318, cy:278 },
  52: { nom:"Bordj Badji Mokhtar", region:"sud",             cx:218, cy:720 },
  53: { nom:"Béni Abbès",          region:"sud",             cx:115, cy:438 },
  54: { nom:"Timimoun",            region:"sud",             cx:195, cy:480 },
  55: { nom:"Touggourt",           region:"sud",             cx:372, cy:335 },
  56: { nom:"Djanet",              region:"sud",             cx:508, cy:648 },
  57: { nom:"In Salah",            region:"sud",             cx:298, cy:555 },
  58: { nom:"In Guezzam",          region:"sud",             cx:348, cy:778 },
};

const REGION_COLORS = {
  nord:           "#0ea5e9",
  est:            "#8b5cf6",
  ouest:          "#06b6d4",
  hauts_plateaux: "#f59e0b",
  sud:            "#ef4444",
};

const CANCER_PALETTE = [
  "#00a8ff","#ff4d6a","#00e5a0","#f5a623","#c084fc",
  "#fb923c","#38bdf8","#a78bfa","#34d399","#f87171",
];

const CANCER_ICONS = {
  "Sein":"🎀", "Colorectal":"🟤", "Poumon":"💨", "Col utérin":"♀️",
  "Prostate":"♂️", "Leucémie":"🩸", "Lymphome":"🔵", "Thyroïde":"🫶",
  "Mélanome":"🌑", "Foie":"🟡", "Autre":"📌",
};

const RISK_ICONS = { "élevé":"🔴", "très élevé":"⚫", "modéré":"🟡", "faible":"🟢" };

// ─────────────────────────────────────────────────────────────────
// MOCK DATA GENERATOR
// ─────────────────────────────────────────────────────────────────
function generateMockData() {
  const rng = (seed, min, max) => {
    let x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const CANCER_TYPES = ["Sein","Colorectal","Poumon","Col utérin","Prostate","Leucémie","Lymphome","Thyroïde"];
  const COMMUNES_MAP = {
    16:["Alger Centre","Bab El Oued","El Harrach","Bir Mourad Raïs","Kouba","Hussein Dey","Dar El Beïda","Birkhadem","Bouzaréah","Saoula"],
    31:["Oran","Es Sénia","Bir El Djir","Gdyel","Sidi Chahmi","Hassi Bounif","Aïn Türk","Béthioua","Arzew","Mers El Kébir"],
    25:["Constantine","El Khroub","Aïn Smara","Hamma Bouziane","Ibn Ziad","Didouche Mourad","Zighoud Youcef","Ali Mendjeli"],
    23:["Annaba","El Bouni","Séraïdi","El Hadjar","Chetaïbi","Berrahal","Aïn Berda","Oued El Aneb"],
    5: ["Batna","Aïn Touta","Barika","Merouana","Tazoult","Oued El Ma","Arris","Tkout"],
    19:["Sétif","El Eulma","Aïn Azel","Salah Bey","Bougaa","Aïn Lahdjar","Djemila","Guenzet"],
    15:["Tizi Ouzou","Azazga","Draa El Mizan","Boghni","Makouda","Tigzirt","Larbaa Nait Irathen","Beni Douala"],
    6: ["Béjaïa","Akbou","Amizour","Tichy","Aokas","Kherrata","Sidi Aïch","El Kseur"],
    9: ["Blida","Boufarik","Meftah","Larbaâ","Bouinan","Chebli","Ben Khellil","Oued El Alleug"],
  };

  const RISK_FACTORS = {
    nord: [
      { facteur:"Pollution industrielle", niveau:"élevé",  icon:"🏭" },
      { facteur:"Tabagisme actif/passif", niveau:"élevé",  icon:"🚬" },
      { facteur:"Alimentation déséquilibrée",niveau:"modéré",icon:"🍔"},
      { facteur:"Sédentarité",            niveau:"modéré", icon:"🪑" },
    ],
    est: [
      { facteur:"Tabagisme",              niveau:"élevé",  icon:"🚬" },
      { facteur:"Exposition amiante",     niveau:"modéré", icon:"⛏️" },
      { facteur:"Infections VHB/VHC",     niveau:"modéré", icon:"🦠" },
    ],
    ouest: [
      { facteur:"Tabagisme",              niveau:"élevé",  icon:"🚬" },
      { facteur:"Exposition pesticides",  niveau:"modéré", icon:"🌾" },
      { facteur:"Obésité",                niveau:"modéré", icon:"⚖️" },
    ],
    hauts_plateaux: [
      { facteur:"Exposition UV",          niveau:"élevé",  icon:"☀️" },
      { facteur:"Eau non traitée",        niveau:"modéré", icon:"💧" },
      { facteur:"Tabagisme",              niveau:"modéré", icon:"🚬" },
    ],
    sud: [
      { facteur:"Exposition UV intense",  niveau:"très élevé", icon:"🌡️" },
      { facteur:"Eau contaminée (arsenic)",niveau:"élevé", icon:"💧" },
      { facteur:"Rayonnements naturels",  niveau:"élevé",  icon:"☢️" },
      { facteur:"Accès soins limité",     niveau:"élevé",  icon:"🏥" },
    ],
  };

  const wilayas = Object.entries(WILAYAS_META).map(([code, meta]) => {
    const c = parseInt(code);
    const urban = [16,31,25,23,19,5,15,6,9,35].includes(c) ? 3
                : [13,22,12,21,20,27,29,48,42,2].includes(c) ? 2 : 1;
    const total = rng(c * 17, 8, 45) * urban;

    const cancers = {};
    let remaining = total;
    CANCER_TYPES.forEach((ct, i) => {
      if (i === CANCER_TYPES.length - 1) { cancers[ct] = Math.max(1, remaining); return; }
      const n = rng(c * 7 + i * 3, 1, Math.max(1, Math.floor(remaining / (CANCER_TYPES.length - i))));
      cancers[ct] = n;
      remaining -= n;
    });

    const communeList = COMMUNES_MAP[c] || [`Chef-lieu W${c}`, `Commune 2`, `Commune 3`, `Commune 4`];
    const communes = communeList.map((nom, i) => {
      const ct = rng(c * 11 + i * 5, 2, Math.max(3, Math.floor(total / communeList.length) + 5));
      return {
        nom, total: ct,
        cancers: {
          Sein: rng(c*3+i, 0, Math.floor(ct/3)),
          Colorectal: rng(c*5+i, 0, Math.floor(ct/4)),
          Poumon: rng(c*7+i, 0, Math.floor(ct/5)),
          Autre: rng(c*9+i, 0, Math.floor(ct/4)),
        }
      };
    }).sort((a,b) => b.total - a.total);

    return {
      code: c,
      nom: meta.nom,
      region: meta.region,
      total_patients: total,
      cancers,
      communes,
      risk_factors: RISK_FACTORS[meta.region] || [],
      incidence_pour_100k: parseFloat((total / rng(c*19, 200, 3000) * 1000).toFixed(1)),
      evolution: [2020,2021,2022,2023,2024,2025].map((yr,i) => ({
        annee: yr,
        total: Math.max(5, total - rng(c*yr+i, -15, 20)),
      })),
    };
  });

  return { wilayas, total_national: wilayas.reduce((s,w) => s + w.total_patients, 0) };
}

// ─────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────
export default function SIGAlgeriaPage() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // wilaya object
  const [hovered, setHovered]       = useState(null);
  const [mapMode, setMapMode]       = useState('total'); // 'total' | cancer type
  const [tooltip, setTooltip]       = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const d = generateMockData();
    setData(d);
    setLoading(false);
  }, []);

  const getWilayaStats = useCallback((code) => {
    if (!data) return null;
    return data.wilayas.find(w => w.code === code);
  }, [data]);

  const getColor = useCallback((code) => {
    const stats = getWilayaStats(code);
    if (!stats) return '#1e293b';
    const meta = WILAYAS_META[code];
    if (!meta) return '#1e293b';

    if (mapMode === 'total') {
      const max = Math.max(...data.wilayas.map(w => w.total_patients));
      const ratio = stats.total_patients / max;
      // Deep blue → bright cyan gradient
      const r = Math.round(10 + ratio * 30);
      const g = Math.round(30 + ratio * 200);
      const b = Math.round(80 + ratio * 175);
      return `rgb(${r},${g},${b})`;
    } else {
      const val = stats.cancers[mapMode] || 0;
      const max = Math.max(...data.wilayas.map(w => w.cancers[mapMode] || 0));
      const ratio = max > 0 ? val / max : 0;
      const r = Math.round(20 + ratio * 235);
      const g = Math.round(10 + ratio * 60);
      const b = Math.round(10 + ratio * 50);
      return `rgb(${r},${g},${b})`;
    }
  }, [data, mapMode, getWilayaStats]);

  const handleWilayaClick = useCallback((code) => {
    const stats = getWilayaStats(code);
    if (stats) setSelected(stats);
  }, [getWilayaStats]);

  if (loading) return (
    <AppLayout title="SIG – Carte Oncologique d'Algérie">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400, flexDirection:'column', gap:16 }}>
        <div style={{ width:48, height:48, border:'4px solid var(--border)', borderTopColor:'#00a8ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <div style={{ color:'var(--text-muted)', fontSize:13 }}>Chargement de la carte SIG…</div>
      </div>
    </AppLayout>
  );

  const totalNational = data.total_national;
  const maxPatients   = Math.max(...data.wilayas.map(w => w.total_patients));
  const cancerTypes   = data.wilayas[0] ? Object.keys(data.wilayas[0].cancers) : [];

  return (
    <AppLayout title="SIG – Carte Oncologique d'Algérie">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .wilaya-path {
          cursor: pointer;
          transition: filter 0.15s, opacity 0.15s;
          stroke: rgba(255,255,255,0.15);
          stroke-width: 0.5;
        }
        .wilaya-path:hover {
          filter: brightness(1.4) drop-shadow(0 0 6px rgba(0,200,255,0.6));
          stroke: rgba(255,255,255,0.7);
          stroke-width: 1;
        }
        .wilaya-path.selected {
          stroke: #00e5a0 !important;
          stroke-width: 2 !important;
          filter: brightness(1.3) drop-shadow(0 0 10px rgba(0,229,160,0.7));
        }
        .sig-scrollbar::-webkit-scrollbar { width: 4px; }
        .sig-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sig-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* ── TOP STATS BAR ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Patients enregistrés', val:totalNational, color:'#00a8ff', icon:'👥' },
          { label:'Wilayas couvertes',     val:data.wilayas.filter(w=>w.total_patients>0).length, color:'#9b8afb', icon:'🗺️' },
          { label:'Cancer le + fréquent',  val:'Sein', color:'#ff4d6a', icon:'🎀' },
          { label:'Wilaya la + touchée',   val:data.wilayas.sort((a,b)=>b.total_patients-a.total_patients)[0]?.nom, color:'#f5a623', icon:'📍' },
          { label:'Taux national (‰)',      val:((totalNational/45000000)*1000).toFixed(2), color:'#00e5a0', icon:'📊' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg-card)', border:`1px solid ${s.color}20`, borderRadius:'var(--radius-md)', padding:'12px 14px', animation:'fadeIn 0.4s ease' }}>
            <div style={{ fontSize:11 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'var(--font-display)', margin:'4px 0 2px' }}>{s.val}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', lineHeight:1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT: MAP + SIDEBAR ────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16, height:'calc(100vh - 260px)', minHeight:560 }}>

        {/* ── MAP PANEL ─────────────────────────────────── */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-lg)', overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
          {/* Map controls */}
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', background:'var(--bg-elevated)', flexShrink:0 }}>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Mode :</span>
            {['total', ...cancerTypes].map(mode => (
              <button key={mode} onClick={() => setMapMode(mode)}
                style={{ padding:'4px 10px', fontSize:10.5, fontWeight:500, cursor:'pointer', borderRadius:20, transition:'all 0.15s',
                  background: mapMode===mode ? (mode==='total'?'rgba(0,168,255,0.2)':'rgba(255,77,106,0.2)') : 'var(--bg-card)',
                  border: mapMode===mode ? `1px solid ${mode==='total'?'#00a8ff':'#ff4d6a'}` : '1px solid var(--border)',
                  color: mapMode===mode ? (mode==='total'?'#00a8ff':'#ff4d6a') : 'var(--text-muted)',
                }}>
                {mode==='total' ? '🗺️ Total' : `${CANCER_ICONS[mode]||'📌'} ${mode}`}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ position:'absolute', bottom:16, left:16, zIndex:10, background:'rgba(10,15,30,0.88)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px', backdropFilter:'blur(8px)' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, fontWeight:700 }}>
              {mapMode==='total' ? 'Patients totaux' : `Patients – ${mapMode}`}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:9, color:'var(--text-muted)' }}>0</span>
              <div style={{ width:90, height:8, borderRadius:4, background: mapMode==='total'
                ? 'linear-gradient(to right, rgb(10,30,80), rgb(40,230,255))'
                : 'linear-gradient(to right, rgb(20,10,10), rgb(255,70,60))' }} />
              <span style={{ fontSize:9, color:'var(--text-muted)' }}>{maxPatients}</span>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div style={{ position:'absolute', left:tooltip.x+12, top:tooltip.y-40, zIndex:20, background:'rgba(10,15,30,0.95)', border:'1px solid rgba(0,229,160,0.3)', borderRadius:8, padding:'7px 12px', pointerEvents:'none', backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{tooltip.nom}</div>
              <div style={{ fontSize:11, color:'#00e5a0', marginTop:2 }}>👥 {tooltip.total} patients</div>
            </div>
          )}

          {/* SVG MAP */}
          <div style={{ flex:1, overflow:'hidden', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:8 }}>
            <AlgeriaSVGMap
              svgRef={svgRef}
              getColor={getColor}
              selected={selected}
              onWilayaClick={handleWilayaClick}
              onWilayaHover={(code, evt) => {
                if (!code) { setTooltip(null); setHovered(null); return; }
                setHovered(code);
                const stats = getWilayaStats(code);
                if (stats && evt) {
                  const rect = svgRef.current?.getBoundingClientRect();
                  setTooltip({ x: evt.clientX - (rect?.left||0), y: evt.clientY - (rect?.top||0), nom: stats.nom, total: stats.total_patients });
                }
              }}
              getWilayaStats={getWilayaStats}
            />
          </div>
        </div>

        {/* ── SIDEBAR ───────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:0, overflow:'hidden', borderRadius:'var(--radius-lg)', border:'1px solid var(--border-light)' }}>
          {selected ? (
            <WilayaSidebar wilaya={selected} onClose={() => setSelected(null)} cancerTypes={cancerTypes} />
          ) : (
            <DefaultSidebar data={data} cancerTypes={cancerTypes} onWilayaSelect={(code) => {
              const w = getWilayaStats(code); if(w) setSelected(w);
            }} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// ALGERIA SVG MAP – Real geographic boundaries (simplified)
// Using D3-projected coordinates based on real Algeria GeoJSON
// ─────────────────────────────────────────────────────────────────
function AlgeriaSVGMap({ svgRef, getColor, selected, onWilayaClick, onWilayaHover, getWilayaStats }) {
  // These are approximate SVG paths for Algeria's 58 wilayas
  // Based on real geographic boundaries projected to a 600x850 viewbox
  const WILAYA_PATHS = {
    // NORD – coastal wilayas
    1:  "M200,590 L290,580 L310,640 L280,680 L200,670 L160,640 Z",
    2:  "M118,122 L155,118 L165,148 L148,162 L118,158 L105,140 Z",
    3:  "M178,258 L238,248 L252,298 L215,312 L172,295 Z",
    4:  "M362,178 L418,172 L425,212 L388,225 L358,215 Z",
    5:  "M345,205 L400,198 L412,238 L372,248 L342,235 Z",
    6:  "M272,98 L318,92 L328,122 L298,128 L268,118 Z",
    7:  "M328,258 L392,252 L405,305 L362,315 L325,298 Z",
    8:  "M72,340 L148,332 L162,412 L115,425 L68,408 Z",
    9:  "M198,118 L228,112 L238,142 L215,148 L195,138 Z",
    10: "M238,118 L275,112 L285,142 L258,150 L235,138 Z",
    11: "M320,698 L458,688 L468,780 L395,795 L315,775 Z",
    12: "M418,198 L468,192 L478,238 L445,248 L415,232 Z",
    13: "M48,138 L92,132 L102,172 L72,178 L45,162 Z",
    14: "M128,168 L185,162 L195,202 L155,212 L125,198 Z",
    15: "M248,98 L288,92 L298,122 L268,128 L245,118 Z",
    16: "M218,95 L252,90 L258,118 L235,122 L215,112 Z",
    17: "M212,228 L275,222 L288,268 L240,278 L208,262 Z",
    18: "M318,88 L362,82 L375,112 L338,118 L315,105 Z",
    19: "M302,138 L352,132 L365,172 L328,182 L298,165 Z",
    20: "M88,202 L132,196 L145,238 L115,248 L85,232 Z",
    21: "M368,95 L418,88 L432,118 L390,128 L365,112 Z",
    22: "M62,175 L108,168 L118,208 L88,218 L58,202 Z",
    23: "M408,88 L452,82 L462,118 L428,125 L405,108 Z",
    24: "M395,128 L438,122 L448,162 L415,172 L392,155 Z",
    25: "M378,132 L418,126 L428,162 L395,170 L375,155 Z",
    26: "M195,148 L238,142 L248,178 L220,188 L192,172 Z",
    27: "M95,132 L132,126 L142,162 L115,170 L92,155 Z",
    28: "M262,198 L318,192 L332,238 L290,248 L258,232 Z",
    29: "M95,178 L138,172 L148,212 L115,222 L92,205 Z",
    30: "M335,368 L415,362 L428,435 L368,448 L332,428 Z",
    31: "M62,112 L108,106 L118,142 L90,148 L58,132 Z",
    32: "M115,268 L185,262 L198,328 L148,338 L112,318 Z",
    33: "M458,498 L545,488 L558,608 L498,618 L455,598 Z",
    34: "M295,152 L342,146 L352,182 L318,192 L292,175 Z",
    35: "M228,95 L258,90 L268,118 L245,122 L225,112 Z",
    36: "M428,102 L468,96 L478,132 L445,138 L425,122 Z",
    37: "M32,448 L115,438 L125,528 L78,538 L28,518 Z",
    38: "M148,152 L192,146 L202,182 L165,192 L145,175 Z",
    39: "M372,308 L432,302 L445,362 L408,372 L368,355 Z",
    40: "M395,198 L445,192 L455,232 L415,242 L392,225 Z",
    41: "M415,122 L458,116 L468,152 L435,162 L412,145 Z",
    42: "M175,102 L218,96 L228,128 L195,135 L172,120 Z",
    43: "M342,132 L385,126 L395,162 L362,172 L338,155 Z",
    44: "M155,128 L198,122 L208,158 L178,168 L152,152 Z",
    45: "M65,258 L118,252 L132,312 L92,322 L62,305 Z",
    46: "M48,125 L88,118 L98,152 L72,160 L45,145 Z",
    47: "M248,328 L315,322 L328,392 L278,402 L245,382 Z",
    48: "M105,148 L148,142 L158,178 L128,188 L102,172 Z",
    49: "M368,298 L415,292 L428,348 L395,358 L365,338 Z",
    50: "M245,408 L318,398 L332,468 L285,478 L242,458 Z",
    51: "M292,252 L352,246 L365,295 L318,308 L288,288 Z",
    52: "M158,678 L258,668 L272,748 L218,760 L155,738 Z",
    53: "M78,398 L148,388 L162,458 L115,468 L75,448 Z",
    54: "M148,448 L228,438 L242,508 L195,518 L145,498 Z",
    55: "M348,305 L392,298 L405,355 L372,365 L345,348 Z",
    56: "M475,608 L545,598 L558,678 L508,688 L472,668 Z",
    57: "M258,518 L348,508 L362,598 L298,608 L255,588 Z",
    58: "M305,748 L395,738 L408,808 L348,818 L302,798 Z",
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 850"
      style={{ width:'100%', height:'100%', maxHeight:'100%' }}
      onMouseLeave={() => onWilayaHover(null, null)}
    >
      {/* Ocean/background */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#0a0f1e" />
          <stop offset="100%" stopColor="#050810" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="600" height="850" fill="url(#bgGrad)" />

      {/* Mediterranean sea hint */}
      <rect x="0" y="0" width="600" height="82" fill="rgba(0,100,180,0.12)" rx="0" />
      <text x="300" y="22" textAnchor="middle" fill="rgba(100,180,255,0.25)" fontSize="9" fontFamily="monospace">MER MÉDITERRANÉE</text>

      {/* Wilaya paths */}
      {Object.entries(WILAYA_PATHS).map(([code, path]) => {
        const c = parseInt(code);
        const stats = getWilayaStats(c);
        const isSelected = selected?.code === c;
        const color = getColor(c);
        return (
          <path
            key={code}
            d={path}
            fill={color}
            className={`wilaya-path${isSelected ? ' selected' : ''}`}
            onClick={() => onWilayaClick(c)}
            onMouseMove={(e) => onWilayaHover(c, e)}
            onMouseEnter={(e) => onWilayaHover(c, e)}
          />
        );
      })}

      {/* Wilaya code labels for larger wilayas */}
      {Object.entries(WILAYAS_META).map(([code, meta]) => {
        const c = parseInt(code);
        const isSelected = selected?.code === c;
        const stats = getWilayaStats(c);
        const showLabel = stats && stats.total_patients > 0;
        return showLabel ? (
          <g key={`label-${code}`} style={{ pointerEvents:'none' }}>
            <text
              x={meta.cx} y={meta.cy - 2}
              textAnchor="middle"
              fill={isSelected ? '#00e5a0' : 'rgba(255,255,255,0.55)'}
              fontSize={isSelected ? "7.5" : "6"}
              fontWeight={isSelected ? "800" : "400"}
              fontFamily="monospace"
            >{code}</text>
          </g>
        ) : null;
      })}

      {/* Selected wilaya dot */}
      {selected && WILAYAS_META[selected.code] && (
        <circle
          cx={WILAYAS_META[selected.code].cx}
          cy={WILAYAS_META[selected.code].cy + 8}
          r="3"
          fill="#00e5a0"
          style={{ animation:'pulse 1.5s ease-in-out infinite', pointerEvents:'none' }}
          filter="url(#glow)"
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT SIDEBAR – national overview
// ─────────────────────────────────────────────────────────────────
function DefaultSidebar({ data, cancerTypes, onWilayaSelect }) {
  const topWilayas = [...data.wilayas].sort((a,b) => b.total_patients - a.total_patients).slice(0, 15);
  const max = topWilayas[0]?.total_patients || 1;

  // National cancer distribution
  const nationalCancers = {};
  data.wilayas.forEach(w => {
    Object.entries(w.cancers).forEach(([ct, n]) => {
      nationalCancers[ct] = (nationalCancers[ct] || 0) + n;
    });
  });
  const sortedCancers = Object.entries(nationalCancers).sort((a,b) => b[1]-a[1]);
  const maxCancer = sortedCancers[0]?.[1] || 1;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-card)' }}>
      {/* Header */}
      <div style={{ padding:'14px 18px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)', marginBottom:2 }}>🗺️ Vue nationale</div>
        <div style={{ fontSize:10, color:'var(--text-muted)' }}>Cliquez sur une wilaya pour le détail</div>
      </div>

      <div className="sig-scrollbar" style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Cancer types distribution */}
        <div>
          <SectionTitle>📊 Répartition nationale des cancers</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {sortedCancers.map(([ct, n], i) => (
              <div key={ct}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{CANCER_ICONS[ct]||'📌'} {ct}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:CANCER_PALETTE[i%CANCER_PALETTE.length], fontFamily:'var(--font-mono)' }}>{n}</span>
                </div>
                <div style={{ height:5, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:3, width:`${(n/maxCancer)*100}%`, background:CANCER_PALETTE[i%CANCER_PALETTE.length], transition:'width 0.6s ease', animationDelay:`${i*0.05}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top wilayas */}
        <div>
          <SectionTitle>🏆 Top wilayas – patients</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {topWilayas.map((w, i) => (
              <div key={w.code} onClick={() => onWilayaSelect(w.code)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:8, cursor:'pointer', transition:'background 0.15s', background:'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', width:16, textAlign:'right', flexShrink:0 }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:11.5, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      W{w.code} – {w.nom}
                    </span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#00a8ff', fontFamily:'var(--font-mono)', flexShrink:0, marginLeft:4 }}>{w.total_patients}</span>
                  </div>
                  <div style={{ height:3, background:'var(--bg-elevated)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, width:`${(w.total_patients/max)*100}%`, background:`linear-gradient(to right, #00a8ff, #00e5a0)` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region breakdown */}
        <div>
          <SectionTitle>🌍 Par région</SectionTitle>
          {Object.entries(REGION_COLORS).map(([region, color]) => {
            const wilayas = data.wilayas.filter(w => w.region === region);
            const total = wilayas.reduce((s,w) => s + w.total_patients, 0);
            const names = { nord:'Nord (littoral)', est:'Est', ouest:'Ouest', hauts_plateaux:'Hauts Plateaux', sud:'Grand Sud' };
            return (
              <div key={region} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
                  <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{names[region]}</span>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>({wilayas.length} wilayas)</span>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color, fontFamily:'var(--font-mono)' }}>{total}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WILAYA DETAIL SIDEBAR
// ─────────────────────────────────────────────────────────────────
function WilayaSidebar({ wilaya, onClose, cancerTypes }) {
  const [activeTab, setTab] = useState('overview');
  const rc = REGION_COLORS[wilaya.region] || '#9ca3af';
  const maxCancer = Math.max(...Object.values(wilaya.cancers));
  const maxCommune = Math.max(...(wilaya.communes||[]).map(c => c.total));
  const maxEvol = Math.max(...(wilaya.evolution||[]).map(e => e.total));

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-card)', animation:'slideIn 0.25s ease' }}>
      {/* Header */}
      <div style={{ padding:'14px 18px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, padding:'2px 6px', borderRadius:4, background:`${rc}15`, color:rc, border:`1px solid ${rc}30` }}>W{wilaya.code}</span>
              <span style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{wilaya.nom}</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ fontSize:10, color:rc }}>● {wilaya.region.replace('_',' ')}</span>
              <span style={{ fontSize:10, color:'var(--text-muted)' }}>👥 {wilaya.total_patients} patients</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:26, height:26, borderRadius:'50%', background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>

        {/* Mini tabs */}
        <div style={{ display:'flex', gap:4, marginTop:10 }}>
          {[{ k:'overview', l:'Aperçu' }, { k:'communes', l:'Communes' }, { k:'risques', l:'Facteurs' }, { k:'evolution', l:'Évolution' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ flex:1, padding:'5px 4px', fontSize:10, fontWeight: activeTab===t.k ? 700 : 400, cursor:'pointer', borderRadius:6, border:'none',
                background: activeTab===t.k ? `${rc}20` : 'transparent',
                color: activeTab===t.k ? rc : 'var(--text-muted)',
                borderBottom: activeTab===t.k ? `2px solid ${rc}` : '2px solid transparent',
              }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="sig-scrollbar" style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>

        {/* ── OVERVIEW TAB ─────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Key metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'Total patients',     val:wilaya.total_patients, color:'#00a8ff' },
                { label:'Incidence (‰)',       val:wilaya.incidence_pour_100k, color:'#f5a623' },
                { label:'Types de cancer',     val:Object.keys(wilaya.cancers).length, color:'#c084fc' },
                { label:'Communes touchées',   val:(wilaya.communes||[]).length, color:'#00e5a0' },
              ].map(m => (
                <div key={m.label} style={{ padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:10, border:`1px solid ${m.color}15` }}>
                  <div style={{ fontSize:18, fontWeight:800, color:m.color, fontFamily:'var(--font-display)' }}>{m.val}</div>
                  <div style={{ fontSize:9.5, color:'var(--text-muted)', marginTop:2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Cancer breakdown */}
            <div>
              <SectionTitle>Répartition des cancers</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {Object.entries(wilaya.cancers).sort((a,b)=>b[1]-a[1]).map(([ct, n], i) => (
                  <div key={ct}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{CANCER_ICONS[ct]||'📌'} {ct}</span>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ fontSize:10, color:'var(--text-muted)' }}>{((n/wilaya.total_patients)*100).toFixed(0)}%</span>
                        <span style={{ fontSize:11, fontWeight:700, color:CANCER_PALETTE[i%CANCER_PALETTE.length], fontFamily:'var(--font-mono)', minWidth:24, textAlign:'right' }}>{n}</span>
                      </div>
                    </div>
                    <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3, width:`${(n/maxCancer)*100}%`, background:CANCER_PALETTE[i%CANCER_PALETTE.length], transition:'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COMMUNES TAB ─────────────────────────────── */}
        {activeTab === 'communes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <SectionTitle>Communes – distribution des cas</SectionTitle>
            {(wilaya.communes||[]).map((c, i) => (
              <div key={c.nom} style={{ padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{c.nom}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:'#00a8ff', fontFamily:'var(--font-mono)' }}>{c.total}</span>
                </div>
                <div style={{ height:4, background:'var(--bg-card)', borderRadius:2, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', borderRadius:2, width:`${(c.total/maxCommune)*100}%`, background:'linear-gradient(to right, #00a8ff, #9b8afb)' }} />
                </div>
                {c.cancers && (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {Object.entries(c.cancers).filter(([,n])=>n>0).map(([ct, n]) => (
                      <span key={ct} style={{ fontSize:9.5, padding:'1px 6px', borderRadius:10, background:'rgba(0,168,255,0.08)', color:'#00a8ff', border:'1px solid rgba(0,168,255,0.15)' }}>
                        {ct}: {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── RISK FACTORS TAB ─────────────────────────── */}
        {activeTab === 'risques' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <SectionTitle>⚠️ Facteurs de risque – {wilaya.nom}</SectionTitle>
            <div style={{ padding:'8px 12px', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.2)', borderRadius:8, marginBottom:4 }}>
              <div style={{ fontSize:10.5, color:'#f5a623', lineHeight:1.6 }}>
                Données épidémiologiques basées sur la région <strong>{wilaya.region.replace('_',' ')}</strong>. Sources : INSP Algérie, INCa, OMS.
              </div>
            </div>
            {(wilaya.risk_factors||[]).map((rf, i) => {
              const levelColors = { "élevé":"#f5a623", "très élevé":"#ff4d6a", "modéré":"#00a8ff", "faible":"#00e5a0" };
              const lc = levelColors[rf.niveau] || '#9ca3af';
              return (
                <div key={i} style={{ padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:10, border:`1px solid ${lc}20`, borderLeft:`3px solid ${lc}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>{rf.icon}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{rf.facteur}</span>
                    </div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:`${lc}15`, color:lc, border:`1px solid ${lc}30`, fontWeight:600, whiteSpace:'nowrap', marginLeft:6 }}>
                      {RISK_ICONS[rf.niveau]} {rf.niveau}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Recommendations */}
            <div style={{ marginTop:4, padding:'12px 14px', background:'rgba(0,229,160,0.06)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#00e5a0', marginBottom:8 }}>💡 Recommandations</div>
              {[
                "Renforcer les campagnes de dépistage précoce",
                "Améliorer l'accès aux structures oncologiques",
                "Sensibilisation aux facteurs de risque modifiables",
                "Suivi épidémiologique renforcé",
              ].map((r,i) => (
                <div key={i} style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4, paddingLeft:12, position:'relative' }}>
                  <span style={{ position:'absolute', left:0, color:'#00e5a0', fontSize:8 }}>▶</span>
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVOLUTION TAB ─────────────────────────────── */}
        {activeTab === 'evolution' && (
          <div>
            <SectionTitle>📈 Évolution 2020–2025</SectionTitle>
            <div style={{ padding:'14px', background:'var(--bg-elevated)', borderRadius:12, border:'1px solid var(--border)', marginBottom:12 }}>
              {/* Mini bar chart */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
                {(wilaya.evolution||[]).map((e) => {
                  const h = Math.max(4, (e.total / maxEvol) * 72);
                  const trend = e.total > (wilaya.evolution[0]?.total||e.total) ? '#00e5a0' : '#ff4d6a';
                  return (
                    <div key={e.annee} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{e.total}</span>
                      <div style={{ width:'100%', height:h, background:`linear-gradient(to top, ${trend}80, ${trend}30)`, borderRadius:'3px 3px 0 0', border:`1px solid ${trend}40` }} />
                      <span style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{e.annee}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Year-over-year */}
            <SectionTitle>Variation annuelle</SectionTitle>
            {(wilaya.evolution||[]).slice(1).map((e, i) => {
              const prev = wilaya.evolution[i];
              const delta = e.total - prev.total;
              const pct = prev.total > 0 ? ((delta/prev.total)*100).toFixed(1) : '0';
              const color = delta > 0 ? '#ff4d6a' : '#00e5a0';
              const icon = delta > 0 ? '↑' : '↓';
              return (
                <div key={e.annee} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', borderRadius:8, background:'var(--bg-elevated)', marginBottom:5 }}>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>{prev.annee} → {e.annee}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{prev.total} → {e.total}</span>
                    <span style={{ fontSize:11, fontWeight:700, color, fontFamily:'var(--font-mono)' }}>
                      {icon} {Math.abs(delta)} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8, paddingBottom:5, borderBottom:'1px solid var(--border)' }}>{children}</div>;
}
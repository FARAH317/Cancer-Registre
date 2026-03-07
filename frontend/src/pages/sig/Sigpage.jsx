import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

/* ─── CSS intégré ─────────────────────────────────────────────────────────── */
const CSS = `
  .sig-wrap{display:flex;flex-direction:column;height:calc(100vh - 60px);background:#0a0f1a;color:#dce8f5;font-family:'DM Sans',system-ui,sans-serif}
  .sig-bc{display:flex;align-items:center;gap:8px;padding:8px 22px;border-bottom:1px solid #1e2d45;background:#111827;font-size:.72rem;color:#4e6a8a;flex-shrink:0}
  .sig-bc .sep{color:#1e2d45} .sig-bc .cur{color:#5da8ff;font-weight:600}
  .sig-bc .back{background:none;border:none;color:#4e6a8a;cursor:pointer;font-size:.72rem;margin-left:auto;transition:color .15s}
  .sig-bc .back:hover{color:#5da8ff}
  .sig-main{display:grid;grid-template-columns:1fr 380px;flex:1;overflow:hidden}
  .sig-map-col{display:flex;flex-direction:column;border-right:1px solid #1e2d45;position:relative}
  .sig-toolbar{display:flex;align-items:center;justify-content:space-between;padding:8px 15px;border-bottom:1px solid #1e2d45;background:#111827;flex-shrink:0;gap:10px}
  .sig-toolbar .tt{font-size:.82rem;font-weight:600;color:#dce8f5} .sig-toolbar .ts{font-size:.68rem;color:#4e6a8a;margin-left:7px}
  #sig-map{flex:1;min-height:0}
  .sig-loader{position:absolute;inset:0;background:rgba(10,15,26,.88);display:flex;align-items:center;justify-content:center;gap:7px;font-size:.78rem;color:#6b87a8;z-index:800;transition:opacity .3s}
  .sig-loader.off{opacity:0;pointer-events:none}
  .ld{width:6px;height:6px;border-radius:50%;background:#3b8ef3;animation:ldp 1.2s infinite}
  .ld:nth-child(2){animation-delay:.2s}.ld:nth-child(3){animation-delay:.4s}
  @keyframes ldp{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
  .sig-sb{display:flex;flex-direction:column;background:#111827;overflow:hidden}
  .sb-head{padding:14px 15px 11px;border-bottom:1px solid #1e2d45;flex-shrink:0}
  .sb-lbl{font-size:.62rem;font-weight:700;color:#4e6a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
  .sb-name{font-size:1.15rem;font-weight:700;color:#dce8f5;margin-bottom:8px}
  .sb-nums{display:flex;gap:18px}
  .sb-n{font-size:1.05rem;font-weight:700;color:#5da8ff} .sb-l{font-size:.62rem;color:#4e6a8a;text-transform:uppercase}
  .sb-tabs{display:flex;border-bottom:1px solid #1e2d45;flex-shrink:0}
  .sb-tab{flex:1;padding:8px;background:none;border:none;color:#4e6a8a;font-size:.72rem;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s}
  .sb-tab.on{color:#5da8ff;border-bottom-color:#3b8ef3}
  .sb-body{flex:1;overflow-y:auto;padding:11px 13px}
  .sb-body::-webkit-scrollbar{width:3px}.sb-body::-webkit-scrollbar-thumb{background:#2a3f5f;border-radius:2px}
  .tp{display:none}.tp.on{display:block}
  .w-row,.c-row{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:6px;cursor:pointer;transition:all .15s;margin-bottom:4px;border:1px solid transparent}
  .w-row:hover,.c-row:hover{background:#1a2436;border-color:#2a3f5f}
  .w-row.sel,.c-row.sel{background:rgba(59,142,243,.12);border-color:rgba(59,142,243,.35)}
  .rn{font-size:.82rem;font-weight:600;color:#dce8f5}.rc{font-size:.62rem;color:#4e6a8a;margin-left:6px}
  .rv{font-size:.85rem;font-weight:700;color:#5da8ff}
  .rcases{font-size:.65rem;color:#6b87a8;margin-top:2px}
  /* Causes section */
  .causes-section{padding:15px;border-top:1px solid #1e2d45;background:#0a0f1a;max-height:200px;overflow-y:auto}
  .causes-title{font-size:.72rem;font-weight:700;color:#5da8ff;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
  .causes-list{display:flex;flex-direction:column;gap:8px}
  .cause-item{background:#111827;border:1px solid #1e2d45;border-radius:6px;padding:8px 10px}
  .cause-name{font-size:.75rem;font-weight:600;color:#dce8f5;margin-bottom:4px}
  .cause-items{font-size:.68rem;color:#6b87a8;padding-left:12px}
  .cause-items li{margin-bottom:2px}
  .leaflet-popup-content-wrapper{background:#0e1829!important;color:#dce8f5!important;border:1px solid #2a3f5f!important;border-radius:8px!important;box-shadow:0 8px 28px rgba(0,0,0,.7)!important;padding:0!important}
  .leaflet-popup-content{margin:0!important}
  .leaflet-popup-tip{background:#0e1829!important}
  .lp{padding:14px 16px;min-width:240px}
  .lp-wilaya{font-size:.65rem;color:#4e6a8a;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
  .lp-name{font-size:1.1rem;font-weight:700;color:#dce8f5;margin-bottom:8px}
  .lp-cases{display:flex;gap:12px;margin-bottom:10px}
  .lp-case{background:#1a2436;border:1px solid #1e2d45;border-radius:6px;padding:8px 12px;text-align:center;flex:1}
  .lp-case-n{font-size:1.1rem;font-weight:700;color:#5da8ff;display:block}
  .lp-case-l{font-size:.58rem;color:#4e6a8a;text-transform:uppercase}
  .lp-cancer{font-size:.75rem;color:#6b87a8;margin-bottom:6px}
  .lp-cancer span{color:#5da8ff;font-weight:600}
  .lp-communes{font-size:.7rem;color:#6b87a8;margin-top:8px;padding-top:8px;border-top:1px solid #1e2d45}
  .lp-communes span{color:#5da8ff;font-weight:600}
  .lp-legend{font-size:.62rem;color:#4e6a8a;padding-top:8px;border-top:1px solid #1e2d45}
  @media(max-width:1100px){.sig-main{grid-template-columns:1fr}.sig-sb{max-height:350px;border-top:1px solid #1e2d45}}
`;

/* ─── Labels cancers ─────────────────────────────────────────────────────── */
const CANCER_LABELS = {
  sein: "Cancer du Sein",
  colon: "Cancer Colorectal",
  poumon: "Cancer du Poumon",
  prostate: "Cancer de la Prostate",
  peau: "Cancer de la Peau",
  col_uterus: "Cancer du Col Uterin",
  uterus: "Cancer de l'Uterus",
  thyroide: "Cancer de la Thyroide",
  ovaire: "Cancer de l'Ovaire",
  estomac: "Cancer de l'Estomac",
  foie: "Cancer du Foie",
  pancreas: "Cancer du Pancreas",
  uro: "Cancers Urologiques",
  lymphome: "Lymphome",
  hemato: "Hemopathies",
  autre: "Autre",
};

/* ─── Causes des cancers (donnees statiques) ─────────────────────────────── */
const CANCER_CAUSES = {
  sein: {
    label: "Cancer du Sein",
    code_icd: "ICD-10 C50",
    categories: [
      { titre: "Facteurs genetiques", items: ["Mutations BRCA1/BRCA2", "Antedents familiaux", "Syndromes heritaires"] },
      { titre: "Facteurs hormonaux", items: ["Menarche precoce", "Menopause tardive", "THS prolonge"] },
      { titre: "Mode de vie", items: ["Obesite", "Consommation d'alcool", "Sedentarite"] }
    ]
  },
  poumon: {
    label: "Cancer du Poumon",
    code_icd: "ICD-10 C34",
    categories: [
      { titre: "Tabagisme", items: ["Tabagisme actif (85%)", "Tabagisme passif", "Narghile"] },
      { titre: "Expositions professionnelles", items: ["Amiante", "Radon", "Arsenic, chrome"] },
      { titre: "Pollution", items: ["PM2.5", "Zones industrielles"] }
    ]
  },
  colon: {
    label: "Cancer Colorectal",
    code_icd: "ICD-10 C18-C20",
    categories: [
      { titre: "Alimentation", items: ["Viandes rouges", "Charcuteries", "Pauvre en fibres"] },
      { titre: "Mode de vie", items: ["Obesite", "Sedentarite", "Alcool et tabac"] },
      { titre: "Genetique", items: ["PAF", "Syndrome de Lynch", "Antedents familiaux"] }
    ]
  },
  prostate: {
    label: "Cancer de la Prostate",
    code_icd: "ICD-10 C61",
    categories: [
      { titre: "Risque principal", items: ["Age > 65 ans", "Origine africaine", "Antedents familiaux"] },
      { titre: "Mode de vie", items: ["Alimentation riche en graisses", "Obesite"] }
    ]
  },
  peau: {
    label: "Cancer de la Peau",
    code_icd: "ICD-10 C43-C44",
    categories: [
      { titre: "UV", items: ["Exposition solaire intense", "Coups de soleil", "Cabines UV"] },
      { titre: "Facteurs individuels", items: ["Phototype clair", "Immunodepression"] }
    ]
  },
  col_uterus: {
    label: "Cancer du Col Uterin",
    code_icd: "ICD-10 C53",
    categories: [
      { titre: "HPV", items: ["HPV 16 et 18", "Relations non protegees", "Absence de vaccination"] },
      { titre: "Cofacteurs", items: ["Tabac", "Immunodepression"] }
    ]
  },
  thyroide: {
    label: "Cancer de la Thyroide",
    code_icd: "ICD-10 C73",
    categories: [
      { titre: "Facteurs de risque", items: ["Radiations ionisantes", "Carence en iode", "Antedents familiaux"] }
    ]
  },
  estomac: {
    label: "Cancer de l'Estomac",
    code_icd: "ICD-10 C16",
    categories: [
      { titre: "Infection bacterienne", items: ["Helicobacter pylori", "Gastrite chronique"] },
      { titre: "Alimentation", items: ["Alimentation salee/fumee", "Charcuteries"] }
    ]
  },
  ovaire: {
    label: "Cancer de l'Ovaire",
    code_icd: "ICD-10 C56",
    categories: [
      { titre: "Facteurs de risque", items: ["Mutations BRCA1/2", "Nulliparite", "Endometriose"] }
    ]
  },
  lymphome: {
    label: "Lymphome",
    code_icd: "ICD-10 C81-C85",
    categories: [
      { titre: "Facteurs de risque", items: ["Infections virales (EBV, VIH)", "Immunodepression", "Pesticides"] }
    ]
  },
};

/* ─── Coordonnees wilayas (48 wilayas) ─────────────────────────────────── */
const WILAYAS_COORDS = {
  "Adrar": { code: "01", lat: 27.87, lng: -0.28 },
  "Chlef": { code: "02", lat: 36.17, lng: 1.33 },
  "Laghouat": { code: "03", lat: 33.80, lng: 2.86 },
  "Oum El Bouaghi": { code: "04", lat: 35.88, lng: 7.11 },
  "Batna": { code: "05", lat: 35.56, lng: 6.17 },
  "Bejaia": { code: "06", lat: 36.75, lng: 5.08 },
  "Biskra": { code: "07", lat: 34.85, lng: 5.73 },
  "Bechar": { code: "08", lat: 31.62, lng: -2.22 },
  "Blida": { code: "09", lat: 36.47, lng: 2.83 },
  "Bouira": { code: "10", lat: 36.37, lng: 3.90 },
  "Tamanrasset": { code: "11", lat: 22.78, lng: 5.52 },
  "Tebessa": { code: "12", lat: 35.40, lng: 8.12 },
  "Tlemcen": { code: "13", lat: 34.88, lng: -1.32 },
  "Tiaret": { code: "14", lat: 35.37, lng: 1.32 },
  "Tizi Ouzou": { code: "15", lat: 36.71, lng: 4.05 },
  "Alger": { code: "16", lat: 36.74, lng: 3.06 },
  "Djelfa": { code: "17", lat: 34.67, lng: 3.26 },
  "Jijel": { code: "18", lat: 36.82, lng: 5.77 },
  "Setif": { code: "19", lat: 36.19, lng: 5.41 },
  "Saida": { code: "20", lat: 34.83, lng: 0.15 },
  "Skikda": { code: "21", lat: 36.88, lng: 6.91 },
  "Sidi Bel Abbes": { code: "22", lat: 35.19, lng: -0.63 },
  "Annaba": { code: "23", lat: 36.90, lng: 7.77 },
  "Guelma": { code: "24", lat: 36.46, lng: 7.43 },
  "Constantine": { code: "25", lat: 36.37, lng: 6.61 },
  "Medea": { code: "26", lat: 36.27, lng: 2.75 },
  "Mostaganem": { code: "27", lat: 35.93, lng: 0.09 },
  "M'Sila": { code: "28", lat: 35.70, lng: 4.54 },
  "Mascara": { code: "29", lat: 35.40, lng: 0.14 },
  "Ouargla": { code: "30", lat: 31.95, lng: 5.33 },
  "Oran": { code: "31", lat: 35.70, lng: -0.63 },
  "El Bayadh": { code: "32", lat: 33.68, lng: 1.02 },
  "Illizi": { code: "33", lat: 26.48, lng: 8.48 },
  "Bordj Bou Arreridj": { code: "34", lat: 36.07, lng: 4.76 },
  "Boumerdes": { code: "35", lat: 36.76, lng: 3.48 },
  "El Tarf": { code: "36", lat: 36.77, lng: 8.31 },
  "Tindouf": { code: "37", lat: 27.67, lng: -8.14 },
  "Tissemsilt": { code: "38", lat: 35.60, lng: 1.81 },
  "El Oued": { code: "39", lat: 33.36, lng: 6.86 },
  "Khenchela": { code: "40", lat: 35.43, lng: 7.14 },
  "Souk Ahras": { code: "41", lat: 36.28, lng: 7.95 },
  "Tipaza": { code: "42", lat: 36.59, lng: 2.45 },
  "Mila": { code: "43", lat: 36.45, lng: 6.26 },
  "Ain Defla": { code: "44", lat: 36.26, lng: 1.97 },
  "Naama": { code: "45", lat: 33.27, lng: -0.31 },
  "Ain Temouchent": { code: "46", lat: 35.30, lng: -1.14 },
  "Ghardaia": { code: "47", lat: 32.49, lng: 3.67 },
  "Relizane": { code: "48", lat: 35.74, lng: 0.56 },
};

export default function SIGPage() {
  const mapRef = useRef(null);
  const leafRef = useRef(null);
  const mksRef = useRef([]);

  const [leafletOk, setLeafletOk] = useState(false);
  const [view, setView] = useState("national"); // "national" ou "wilaya"
  const [wilayasData, setWilayasData] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaDetail, setWilayaDetail] = useState(null);
  const [tab, setTab] = useState("list");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /* ── CSS injection ─────────────────────────────────────────── */
  useEffect(() => {
    if (!document.getElementById("sig-css")) {
      const s = document.createElement("style");
      s.id = "sig-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    return () => document.getElementById("sig-css")?.remove();
  }, []);

  /* ── Leaflet ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!document.getElementById("leaf-css")) {
      const l = document.createElement("link");
      l.id = "leaf-css";
      l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (window.L) { setLeafletOk(true); return; }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => setLeafletOk(true);
    document.head.appendChild(s);
  }, []);

  /* ── Donnees wilayas ─────────────────────────────────────── */
  useEffect(() => { fetchWilayas(); }, []);

  const fetchWilayas = async () => {
    try {
      const r = await api.get("/sig/wilayas/");
      const data = r.data;
      
      const allWilayas = [];
      const wilayasFromAPI = data.wilayas || [];
      const apiWilayaMap = {};
      wilayasFromAPI.forEach(w => {
        apiWilayaMap[w.name.toLowerCase()] = w;
      });

      Object.keys(WILAYAS_COORDS).forEach(name => {
        const coords = WILAYAS_COORDS[name];
        const apiData = apiWilayaMap[name.toLowerCase()];
        
        allWilayas.push({
          name: name,
          code: coords.code,
          lat: coords.lat,
          lng: coords.lng,
          cases: apiData?.cases || 0,
          patients: apiData?.patients || 0,
          dominant_cancer: apiData?.dominant_cancer || null,
          dominant_label: apiData?.dominant_label || 'Aucune donnee',
        });
      });

      allWilayas.sort((a, b) => b.cases - a.cases);
      setWilayasData(allWilayas);
      setLoading(false);
    } catch (e) {
      console.error("Erreur chargement:", e);
      const allWilayas = Object.keys(WILAYAS_COORDS).map(name => ({
        name: name,
        code: WILAYAS_COORDS[name].code,
        lat: WILAYAS_COORDS[name].lat,
        lng: WILAYAS_COORDS[name].lng,
        cases: 0,
        patients: 0,
        dominant_cancer: null,
        dominant_label: 'Aucune donnee',
      }));
      setWilayasData(allWilayas);
      setLoading(false);
    }
  };

  /* ── Detail wilaya (communes) ─────────────────────────────── */
  const fetchWilayaDetail = async (wilayaName) => {
    setLoadingDetail(true);
    try {
      const r = await api.get(`/sig/wilaya/${encodeURIComponent(wilayaName)}/`);
      setWilayaDetail(r.data);
    } catch (e) {
      console.error("Erreur detail:", e);
      setWilayaDetail(null);
    }
    setLoadingDetail(false);
  };

  /* ── Init carte ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!leafletOk || !mapRef.current || leafRef.current) return;
    const L = window.L;
    leafRef.current = L.map(mapRef.current, { center: [28, 3], zoom: 5, zoomControl: false });
    L.control.zoom({ position: "bottomright" }).addTo(leafRef.current);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "OpenStreetMap CartoDB",
      maxZoom: 19,
    }).addTo(leafRef.current);
  }, [leafletOk]);

  /* ── Rendu carte ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!leafRef.current || !leafletOk || wilayasData.length === 0) return;
    renderMap();
  }, [leafRef.current, leafletOk, wilayasData, view, wilayaDetail]);

  const clearMarkers = () => {
    mksRef.current.forEach(m => { try { m.remove(); } catch {} });
    mksRef.current = [];
  };

  const renderMap = () => {
    clearMarkers();
    if (!leafRef.current) return;
    const L = window.L;

    if (view === "national") {
      // Vue nationale - markers des wilayas
      const maxCases = Math.max(...wilayasData.map(w => w.cases || 0), 1);

      wilayasData.forEach(wilaya => {
        const hasCases = wilaya.cases > 0;
        const ratio = hasCases ? (wilaya.cases / maxCases) : 0;
        const radius = Math.max(10, Math.min(30, ratio * 25 + 8));
        const fillOpacity = hasCases ? 0.4 + ratio * 0.5 : 0.2;
        
        const color = hasCases ? '#3b8ef3' : '#2a3f5f';
        const borderColor = hasCases ? '#5da8ff' : '#3b5070';

        const marker = L.circleMarker([wilaya.lat, wilaya.lng], {
          radius: radius,
          fillColor: color,
          color: borderColor,
          weight: 2,
          opacity: 0.9,
          fillOpacity: fillOpacity,
        }).addTo(leafRef.current);

        const popupContent = `
          <div class="lp">
            <div class="lp-wilaya">Wilaya ${wilaya.code}</div>
            <div class="lp-name">${wilaya.name}</div>
            <div class="lp-cases">
              <div class="lp-case">
                <span class="lp-case-n">${wilaya.cases}</span>
                <span class="lp-case-l">Cas</span>
              </div>
              <div class="lp-case">
                <span class="lp-case-n">${wilaya.patients}</span>
                <span class="lp-case-l">Patients</span>
              </div>
            </div>
            <div class="lp-cancer">
              Cancer dominant: <span>${wilaya.dominant_label || 'N/A'}</span>
            </div>
            <div class="lp-legend">Cliquez pour voir les communes</div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
        
        marker.on("click", () => {
          setSelectedWilaya(wilaya);
          setView("wilaya");
          fetchWilayaDetail(wilaya.name);
          leafRef.current.flyTo([wilaya.lat, wilaya.lng], 8, { duration: 1 });
        });

        mksRef.current.push(marker);
      });
    } else if (view === "wilaya" && wilayaDetail) {
      // Vue wilaya - markers des communes
      const communes = wilayaDetail.communes || [];
      const maxCases = Math.max(...communes.map(c => c.total_cases || 0), 1);

      // Centrer sur la wilaya
      const center = wilayaDetail.wilaya?.center || [28, 3];

      communes.forEach(com => {
        if (!com.lat || !com.lng) return;
        
        const hasCases = com.total_cases > 0;
        const ratio = hasCases ? (com.total_cases / maxCases) : 0;
        const radius = Math.max(8, Math.min(25, ratio * 20 + 6));
        const fillOpacity = hasCases ? 0.4 + ratio * 0.5 : 0.2;
        
        const color = hasCases ? '#3b8ef3' : '#2a3f5f';
        const borderColor = hasCases ? '#5da8ff' : '#3b5070';

        const marker = L.circleMarker([com.lat, com.lng], {
          radius: radius,
          fillColor: color,
          color: borderColor,
          weight: 2,
          opacity: 0.9,
          fillOpacity: fillOpacity,
        }).addTo(leafRef.current);

        const popupContent = `
          <div class="lp">
            <div class="lp-wilaya">${wilayaDetail.wilaya?.name}</div>
            <div class="lp-name">${com.name}</div>
            <div class="lp-cases">
              <div class="lp-case">
                <span class="lp-case-n">${com.total_cases}</span>
                <span class="lp-case-l">Cas</span>
              </div>
              <div class="lp-case">
                <span class="lp-case-n">${com.nb_patients || 0}</span>
                <span class="lp-case-l">Patients</span>
              </div>
            </div>
            <div class="lp-cancer">
              Cancer dominant: <span>${com.dominant_label || 'N/A'}</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
        mksRef.current.push(marker);
      });
    }
  };

  /* ── Retour vue nationale ───────────────────────────────────── */
  const goBackToNational = () => {
    setView("national");
    setSelectedWilaya(null);
    setWilayaDetail(null);
    if (leafRef.current) {
      leafRef.current.flyTo([28, 3], 5, { duration: 1 });
    }
  };

  /* ── Calculs ───────────────────────────────────────────────── */
  const isNational = view === "national";
  const totalCas = wilayasData.reduce((sum, w) => sum + (w.cases || 0), 0);
  const totalPatients = wilayasData.reduce((sum, w) => sum + (w.patients || 0), 0);
  const wilayasAvecDonnees = wilayasData.filter(w => w.cases > 0).length;
  
  // Pour vue wilaya
  const wilayaStats = wilayaDetail?.stats || {};
  const wilayaCommunes = wilayaDetail?.communes || [];
  const cancerCauses = wilayaDetail?.cancer_causes || {};

  // Obtenir les causes pour un type de cancer
  const getCausesForCancer = (cancerType) => {
    if (cancerCauses[cancerType]) {
      return cancerCauses[cancerType];
    }
    return CANCER_CAUSES[cancerType] || null;
  };

  return (
    <div className="sig-wrap">

      {/* Breadcrumb */}
      <div className="sig-bc">
        <span>Algerie</span>
        <span className="sep">/</span>
        <span className="cur">{isNational ? "Vue nationale" : (selectedWilaya?.name || "...")}</span>
        {!isNational && (
          <button className="back" onClick={goBackToNational}>
            Retour a la vue nationale
          </button>
        )}
      </div>

      {/* Carte + Sidebar */}
      <div className="sig-main">

        {/* Carte */}
        <div className="sig-map-col">
          <div className="sig-toolbar">
            <div>
              <span className="tt">
                {isNational 
                  ? "Carte des cancers par wilaya" 
                  : `Communes de ${selectedWilaya?.name}`
                }
              </span>
              <span className="ts">
                {isNational
                  ? `${wilayasAvecDonnees} wilayas avec donnees - ${totalCas.toLocaleString()} cas`
                  : `${wilayaCommunes.length} communes - ${wilayaStats.total_cas || 0} cas`
                }
              </span>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button 
                className="btn-sm primary"
                onClick={() => {
                  const tlemcen = wilayasData.find(w => w.name === 'Tlemcen');
                  if (tlemcen) {
                    setSelectedWilaya(tlemcen);
                    setView("wilaya");
                    fetchWilayaDetail(tlemcen.name);
                    if (leafRef.current) {
                      leafRef.current.flyTo([tlemcen.lat, tlemcen.lng], 8, { duration: 1 });
                    }
                  }
                }}
                style={{background:'#1a5fc9',border:'1px solid #3b8ef3',color:'white',padding:'6px 12px',borderRadius:'6px',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}
              >
                Tlemcen
              </button>
            </div>
          </div>
          <div id="sig-map" ref={mapRef}></div>
          <div className={`sig-loader${loading || loadingDetail ? "" : " off"}`}>
            <div className="ld"/><div className="ld"/><div className="ld"/>
            <span>Chargement...</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sig-sb">
          <div className="sb-head">
            <div className="sb-lbl">{isNational ? "Registre National du Cancer" : "Wilaya"}</div>
            <div className="sb-name">{isNational ? "Algerie" : selectedWilaya?.name}</div>
            <div className="sb-nums">
              {isNational ? (
                <>
                  <div>
                    <div className="sb-n">{wilayasData.length}</div>
                    <div className="sb-l">Wilayas</div>
                  </div>
                  <div>
                    <div className="sb-n">{totalCas.toLocaleString()}</div>
                    <div className="sb-l">Cas Total</div>
                  </div>
                  <div>
                    <div className="sb-n">{totalPatients.toLocaleString()}</div>
                    <div className="sb-l">Patients</div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="sb-n">{wilayaCommunes.length}</div>
                    <div className="sb-l">Communes</div>
                  </div>
                  <div>
                    <div className="sb-n">{wilayaStats.total_cas || 0}</div>
                    <div className="sb-l">Cas</div>
                  </div>
                  <div>
                    <div className="sb-n">{wilayaStats.total_patients || 0}</div>
                    <div className="sb-l">Patients</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="sb-tabs">
            <button className={`sb-tab${tab === "list" ? " on" : ""}`} onClick={() => setTab("list")}>
              {isNational ? "Wilayas" : "Communes"}
            </button>
            {isNational && (
              <button className={`sb-tab${tab === "causes" ? " on" : ""}`} onClick={() => setTab("causes")}>
                Causes
              </button>
            )}
          </div>

          <div className="sb-body">
            {/* Liste wilayas ou communes */}
            <div className={`tp${tab === "list" ? " on" : ""}`}>
              {isNational ? (
                wilayasData
                  .filter(w => w.cases > 0)
                  .map(wilaya => (
                    <div 
                      key={wilaya.name} 
                      className={`w-row${selectedWilaya?.name === wilaya.name ? " sel" : ""}`}
                      onClick={() => {
                        setSelectedWilaya(wilaya);
                        setView("wilaya");
                        fetchWilayaDetail(wilaya.name);
                        if (leafRef.current) {
                          leafRef.current.flyTo([wilaya.lat, wilaya.lng], 8, { duration: 1 });
                        }
                      }}
                    >
                      <div>
                        <span className="rn">{wilaya.name}</span>
                        <span className="rc">{wilaya.code}</span>
                        <div className="rcases">{wilaya.dominant_label}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="rv">{wilaya.cases}</span>
                        <div style={{ fontSize: '.6rem', color: '#4e6a8a', marginTop: 2 }}>
                          {wilaya.patients} patients
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                wilayaCommunes.map((commune, idx) => (
                  <div 
                    key={idx} 
                    className="c-row"
                  >
                    <div>
                      <span className="rn">{commune.name}</span>
                      <div className="rcases">{commune.dominant_label || 'Aucune donnee'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="rv">{commune.total_cases}</span>
                      <div style={{ fontSize: '.6rem', color: '#4e6a8a', marginTop: 2 }}>
                        {commune.nb_patients || 0} patients
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Causes des cancers */}
            {isNational && tab === "causes" && (
              <div className="tp on">
                <div className="causes-section">
                  <div className="causes-title">Facteurs de risque par type de cancer</div>
                  <div className="causes-list">
                    {Object.entries(CANCER_CAUSES).map(([type, data]) => (
                      <div key={type} className="cause-item">
                        <div className="cause-name">{data.label}</div>
                        {data.categories.map((cat, ci) => (
                          <div key={ci} style={{ marginTop: '6px' }}>
                            <div style={{ fontSize: '.65rem', color: '#5da8ff', fontWeight: 600 }}>{cat.titre}</div>
                            <ul className="cause-items">
                              {cat.items.map((item, ii) => (
                                <li key={ii}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
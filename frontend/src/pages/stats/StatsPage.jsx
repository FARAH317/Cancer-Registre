import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AppLayout } from '../../components/layout/Sidebar';
import { statsApi } from '../../services/statsApi';

// ═══════════════════════════════════════════════════════════════════════════════
// PALETTES
// ═══════════════════════════════════════════════════════════════════════════════
const PALETTES = {
  ocean:  ['#00a8ff','#9b8afb','#00e5c0','#f5a623','#ff4d6a'],
  ember:  ['#ff4d6a','#f97316','#f5a623','#84cc16','#06b6d4'],
  forest: ['#00e5a0','#00a8ff','#06b6d4','#9b8afb','#f5a623'],
  aurora: ['#9b8afb','#00a8ff','#06b6d4','#00e5a0','#ff4d6a'],
  solar:  ['#f5a623','#ff4d6a','#9b8afb','#00a8ff','#00e5a0'],
};

const CHART_COLORS = ['#00a8ff','#9b8afb','#00e5a0','#f5a623','#ff4d6a','#c084fc','#38bdf8','#34d399','#fb923c'];

const CHART_TYPES = [
  { id:'bar',         label:'Barres',    icon:'▐▌' },
  { id:'bar_grouped', label:'Groupées',  icon:'▐▐' },
  { id:'bar_stacked', label:'Empilées',  icon:'▬▬' },
  { id:'line',        label:'Courbe',    icon:'∿'  },
  { id:'area',        label:'Aire',      icon:'◿'  },
  { id:'pie',         label:'Camembert', icon:'◕'  },
  { id:'donut',       label:'Anneau',    icon:'◎'  },
  { id:'radar',       label:'Radar',     icon:'⬡'  },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

// ─── SOURCE CATALOG ───────────────────────────────────────────────────────────
const SOURCE_CATALOG = [
  { id:'cancer_count',          label:'Cancer - Cas par type',              endpoint:'cancer_count',          cat:'Cancer',    cols:['type','annee','count','taux'],                                                xKey:'type',      yKeys:['count'],                                       chart:'bar'         },
  { id:'cancer_sexe',           label:'Cancer - Hommes vs Femmes',          endpoint:'cancer_sexe',           cat:'Cancer',    cols:['cancer','annee','Hommes','Femmes','total'],                                   xKey:'cancer',    yKeys:['Hommes','Femmes'],                             chart:'bar_grouped' },
  { id:'cancer_stade',          label:'Cancer x Stade',                     endpoint:'cancer_stade',          cat:'Cancer',    cols:['cancer','annee','Stade I','Stade II','Stade III','Stade IV'],                 xKey:'cancer',    yKeys:['Stade I','Stade II','Stade III','Stade IV'],    chart:'bar_stacked' },
  { id:'cancer_incidence',      label:"Cancer - Taux d'incidence",          endpoint:'cancer_incidence',      cat:'Cancer',    cols:['type','annee','taux_brut','taux_std','population'],                          xKey:'type',      yKeys:['taux_brut','taux_std'],                        chart:'bar_grouped' },
  { id:'cancer_mortalite',      label:'Cancer - Mortalité par type',        endpoint:'cancer_mortalite',      cat:'Cancer',    cols:['type','annee','deces','taux_mortalite'],                                      xKey:'type',      yKeys:['deces'],                                       chart:'bar'         },
  { id:'cancer_top10',          label:'Cancer - Top 10 fréquents',          endpoint:'cancer_top10',          cat:'Cancer',    cols:['type','annee','count','rang'],                                                xKey:'type',      yKeys:['count'],                                       chart:'donut'       },
  { id:'cancer_sein_detail',    label:'Cancer du sein - Sous-types',        endpoint:'cancer_sein_detail',    cat:'Cancer',    cols:['soustype','annee','count','age_median'],                                      xKey:'soustype',  yKeys:['count'],                                       chart:'pie'         },
  { id:'cancer_poumon_detail',  label:'Cancer du poumon - Histologie',      endpoint:'cancer_poumon_detail',  cat:'Cancer',    cols:['histo','annee','count','fumeurs_pct'],                                        xKey:'histo',     yKeys:['count'],                                       chart:'pie'         },
  { id:'cancer_colon_detail',   label:'Cancer colorectal - Localisation',   endpoint:'cancer_colon_detail',   cat:'Cancer',    cols:['segment','annee','count','taux'],                                             xKey:'segment',   yKeys:['count'],                                       chart:'bar'         },
  { id:'cancer_double',         label:'Cancer - Double localisation',       endpoint:'cancer_double',         cat:'Cancer',    cols:['type','annee','primitif','metastase','total'],                                xKey:'type',      yKeys:['primitif','metastase'],                        chart:'bar_grouped' },
  { id:'age_count',             label:'Age - Distribution des cas',         endpoint:'age_count',             cat:'Age',       cols:['groupe','age_min','age_max','annee','count','taux'],                          xKey:'groupe',    yKeys:['count'],                                       chart:'bar'         },
  { id:'age_stade',             label:'Age x Stade',                        endpoint:'age_stade',             cat:'Age',       cols:['groupe','annee','Stade I','Stade II','Stade III','Stade IV'],                 xKey:'groupe',    yKeys:['Stade I','Stade II','Stade III','Stade IV'],    chart:'bar_stacked' },
  { id:'age_sexe',              label:'Age x Sexe (pyramide)',              endpoint:'age_sexe',              cat:'Age',       cols:['groupe','annee','Hommes','Femmes'],                                           xKey:'groupe',    yKeys:['Hommes','Femmes'],                             chart:'bar_grouped' },
  { id:'age_cancer_type',       label:'Age x Type de cancer',               endpoint:'age_cancer_type',       cat:'Age',       cols:['groupe','annee','Sein','Poumon','Colon','Prostate','Autres'],                 xKey:'groupe',    yKeys:['Sein','Poumon','Colon','Prostate'],             chart:'bar_stacked' },
  { id:'age_incidence',         label:"Age - Taux d'incidence par tranche", endpoint:'age_incidence',         cat:'Age',       cols:['groupe','annee','taux','population'],                                         xKey:'groupe',    yKeys:['taux'],                                        chart:'line'        },
  { id:'age_median_cancer',     label:'Age médian par type de cancer',      endpoint:'age_median_cancer',     cat:'Age',       cols:['type','annee','age_median','age_min','age_max'],                              xKey:'type',      yKeys:['age_median'],                                  chart:'bar'         },
  { id:'age_pediatrique',       label:'Age - Cancers pédiatriques (<18)',   endpoint:'age_pediatrique',       cat:'Age',       cols:['type','annee','count','age_median'],                                          xKey:'type',      yKeys:['count'],                                       chart:'donut'       },
  { id:'stade_count',           label:'Stade - Répartition globale',        endpoint:'stade_count',           cat:'Stade',     cols:['stade','annee','count','pct'],                                                xKey:'stade',     yKeys:['count'],                                       chart:'pie'         },
  { id:'stade_sexe',            label:'Stade x Sexe',                       endpoint:'stade_sexe',            cat:'Stade',     cols:['stade','annee','Hommes','Femmes','total'],                                    xKey:'stade',     yKeys:['Hommes','Femmes'],                             chart:'bar_grouped' },
  { id:'stade_age',             label:"Stade x Groupe d'âge",               endpoint:'stade_age',             cat:'Stade',     cols:['stade','annee','<40','40-59','60-74','75+'],                                  xKey:'stade',     yKeys:['<40','40-59','60-74','75+'],                    chart:'bar_stacked' },
  { id:'stade_wilaya',          label:'Stade x Wilaya (top 10)',            endpoint:'stade_wilaya',          cat:'Stade',     cols:['wilaya','annee','Stade I','Stade II','Stade III','Stade IV'],                 xKey:'wilaya',    yKeys:['Stade I','Stade II','Stade III','Stade IV'],    chart:'bar_stacked' },
  { id:'stade_evolution',       label:'Stade - Évolution annuelle',         endpoint:'stade_evolution',       cat:'Stade',     cols:['annee','Stade I','Stade II','Stade III','Stade IV'],                          xKey:'annee',     yKeys:['Stade I','Stade II','Stade III','Stade IV'],    chart:'area'        },
  { id:'stade_delai',           label:'Stade - Délai diagnostic (mois)',    endpoint:'stade_delai',           cat:'Stade',     cols:['stade','annee','delai_moyen','delai_min','delai_max'],                        xKey:'stade',     yKeys:['delai_moyen'],                                 chart:'bar'         },
  { id:'monthly_cas',           label:'Mensuel - Nouveaux cas',             endpoint:'monthly_cas',           cat:'Temporel',  cols:['mois','annee','count','cumul'],                                               xKey:'mois',      yKeys:['count'],                                       chart:'area'        },
  { id:'monthly_deces',         label:'Mensuel - Décès',                    endpoint:'monthly_deces',         cat:'Temporel',  cols:['mois','annee','deces','cumul'],                                               xKey:'mois',      yKeys:['deces'],                                       chart:'area'        },
  { id:'monthly_cas_deces',     label:'Mensuel - Cas vs Décès',             endpoint:'monthly_cas_deces',     cat:'Temporel',  cols:['mois','annee','nouveaux_cas','deces'],                                        xKey:'mois',      yKeys:['nouveaux_cas','deces'],                        chart:'line'        },
  { id:'annuel_tendance',       label:'Annuel - Tendance sur 10 ans',       endpoint:'annuel_tendance',       cat:'Temporel',  cols:['annee','count','variation_pct'],                                              xKey:'annee',     yKeys:['count'],                                       chart:'line'        },
  { id:'annuel_incidence_std',  label:'Annuel - Incidence standardisée',    endpoint:'annuel_incidence_std',  cat:'Temporel',  cols:['annee','taux_std','taux_brut','population'],                                  xKey:'annee',     yKeys:['taux_std'],                                    chart:'line'        },
  { id:'saisonnier',            label:'Saisonnier - Diagnostic/trimestre',  endpoint:'saisonnier',            cat:'Temporel',  cols:['trimestre','annee','count'],                                                  xKey:'trimestre', yKeys:['count'],                                       chart:'bar'         },
  { id:'delai_diagnostic',      label:'Délai - Symptôme → Diagnostic',      endpoint:'delai_diagnostic',      cat:'Temporel',  cols:['delai','annee','count','delai_moyen'],                                        xKey:'delai',     yKeys:['count'],                                       chart:'bar'         },
  { id:'delai_traitement',      label:'Délai - Diagnostic → Traitement',    endpoint:'delai_traitement',      cat:'Temporel',  cols:['delai','annee','count','delai_moyen'],                                        xKey:'delai',     yKeys:['count'],                                       chart:'bar'         },
  { id:'wilaya_cas',            label:'Wilaya - Cas par région',            endpoint:'wilaya_cas',            cat:'Wilaya',    cols:['wilaya','annee','count','taux','population'],                                  xKey:'wilaya',    yKeys:['count'],                                       chart:'bar'         },
  { id:'wilaya_cancer',         label:'Wilaya x Type de cancer',            endpoint:'wilaya_cancer',         cat:'Wilaya',    cols:['wilaya','annee','Sein','Poumon','Colon','Prostate','Autres'],                  xKey:'wilaya',    yKeys:['Sein','Poumon','Colon','Prostate','Autres'],    chart:'bar_stacked' },
  { id:'wilaya_incidence',      label:"Wilaya - Taux d'incidence",          endpoint:'wilaya_incidence',      cat:'Wilaya',    cols:['wilaya','annee','taux','population'],                                          xKey:'wilaya',    yKeys:['taux'],                                        chart:'bar'         },
  { id:'wilaya_mortalite',      label:'Wilaya - Mortalité',                 endpoint:'wilaya_mortalite',      cat:'Wilaya',    cols:['wilaya','annee','deces','taux_mortalite'],                                     xKey:'wilaya',    yKeys:['deces'],                                       chart:'bar'         },
  { id:'wilaya_stade',          label:'Wilaya x Stade avancé (III+IV)',     endpoint:'wilaya_stade',          cat:'Wilaya',    cols:['wilaya','annee','Stade III','Stade IV'],                                       xKey:'wilaya',    yKeys:['Stade III','Stade IV'],                        chart:'bar_grouped' },
  { id:'region_nord_sud',       label:'Région - Nord vs Sud',               endpoint:'region_nord_sud',       cat:'Wilaya',    cols:['region','annee','count','taux','population'],                                  xKey:'region',    yKeys:['count','taux'],                                chart:'bar_grouped' },
  { id:'wilaya_evolution',      label:'Wilaya - Top 5 évolution annuelle',  endpoint:'wilaya_evolution',      cat:'Wilaya',    cols:['annee','Alger','Oran','Constantine','Setif','Annaba'],                         xKey:'annee',     yKeys:['Alger','Oran','Constantine','Setif','Annaba'],  chart:'line'        },
  { id:'survival',              label:'Survie - Taux à 5 ans par type',     endpoint:'survival',              cat:'Survie',    cols:['type','annee','survie_5ans','survie_3ans','survie_1an'],                       xKey:'type',      yKeys:['survie_5ans'],                                 chart:'bar'         },
  { id:'survival_1_3_5',        label:'Survie - 1 an, 3 ans, 5 ans',       endpoint:'survival_1_3_5',        cat:'Survie',    cols:['type','annee','survie_1an','survie_3ans','survie_5ans'],                       xKey:'type',      yKeys:['survie_1an','survie_3ans','survie_5ans'],       chart:'bar_grouped' },
  { id:'survival_stade',        label:'Survie x Stade',                     endpoint:'survival_stade',        cat:'Survie',    cols:['stade','annee','survie_5ans','survie_3ans'],                                   xKey:'stade',     yKeys:['survie_5ans'],                                 chart:'bar'         },
  { id:'survival_age',          label:"Survie x Groupe d'âge",              endpoint:'survival_age',          cat:'Survie',    cols:['groupe','annee','survie_5ans'],                                                xKey:'groupe',    yKeys:['survie_5ans'],                                 chart:'line'        },
  { id:'survival_sexe',         label:'Survie - Hommes vs Femmes',          endpoint:'survival_sexe',         cat:'Survie',    cols:['type','annee','Hommes','Femmes'],                                              xKey:'type',      yKeys:['Hommes','Femmes'],                             chart:'bar_grouped' },
  { id:'kaplan_meier',          label:'Survie - Courbe Kaplan-Meier',       endpoint:'kaplan_meier',          cat:'Survie',    cols:['mois','annee','survie','IC_inf','IC_sup'],                                     xKey:'mois',      yKeys:['survie'],                                      chart:'line'        },
  { id:'traitement_type',       label:'Traitement - Types administrés',     endpoint:'traitement_type',       cat:'Traitement',cols:['type','annee','count','pct'],                                                  xKey:'type',      yKeys:['count'],                                       chart:'donut'       },
  { id:'traitement_combo',      label:'Traitement - Combinaisons',          endpoint:'traitement_combo',      cat:'Traitement',cols:['combo','annee','count'],                                                       xKey:'combo',     yKeys:['count'],                                       chart:'bar'         },
  { id:'traitement_cancer',     label:'Traitement x Type de cancer',        endpoint:'traitement_cancer',     cat:'Traitement',cols:['cancer','annee','Chirurgie','Chimio','Radio','Hormo','Immuno'],                xKey:'cancer',    yKeys:['Chirurgie','Chimio','Radio','Hormo','Immuno'],  chart:'bar_stacked' },
  { id:'traitement_delai',      label:'Traitement - Délai par wilaya',      endpoint:'traitement_delai',      cat:'Traitement',cols:['wilaya','annee','delai_moyen'],                                                xKey:'wilaya',    yKeys:['delai_moyen'],                                 chart:'bar'         },
  { id:'traitement_reponse',    label:'Traitement - Taux de réponse',       endpoint:'traitement_reponse',    cat:'Traitement',cols:['type','annee','reponse_complete','reponse_partielle','echec'],                 xKey:'type',      yKeys:['reponse_complete','reponse_partielle'],         chart:'bar_grouped' },
  { id:'facteurs_risque',       label:'Épidémio - Facteurs de risque',      endpoint:'facteurs_risque',       cat:'Epidemio',  cols:['facteur','annee','count','OR'],                                                xKey:'facteur',   yKeys:['count'],                                       chart:'bar'         },
  { id:'comorbidites',          label:'Épidémio - Comorbidités',            endpoint:'comorbidites',          cat:'Epidemio',  cols:['comorbid','annee','count','pct'],                                              xKey:'comorbid',  yKeys:['count'],                                       chart:'bar'         },
  { id:'antecedents_familiaux', label:'Épidémio - Antécédents familiaux',   endpoint:'antecedents_familiaux', cat:'Epidemio',  cols:['type','annee','avec_atcd','sans_atcd','total'],                                xKey:'type',      yKeys:['avec_atcd','sans_atcd'],                       chart:'bar_grouped' },
  { id:'tabac_cancer',          label:'Épidémio - Tabagisme x Cancer',      endpoint:'tabac_cancer',          cat:'Epidemio',  cols:['cancer','annee','fumeurs','non_fumeurs','pct_fumeurs'],                        xKey:'cancer',    yKeys:['fumeurs','non_fumeurs'],                        chart:'bar_grouped' },
  { id:'imc_cancer',            label:'Épidémio - IMC x Type de cancer',    endpoint:'imc_cancer',            cat:'Epidemio',  cols:['imc','annee','count','type_cancer'],                                           xKey:'imc',       yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_cancer',            label:'Cancer - dimension',                 endpoint:'dim_cancer',            cat:'Dimension', cols:['cancer','annee','count','deces','taux','taux_std'],                            xKey:'cancer',    yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_age',               label:'Age - dimension',                    endpoint:'dim_age',               cat:'Dimension', cols:['groupe','age_min','age_max','annee','count','taux'],                           xKey:'groupe',    yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_annee',             label:'Année - dimension',                  endpoint:'dim_annee',             cat:'Dimension', cols:['annee','count','deces','taux','taux_std','variation_pct'],                     xKey:'annee',     yKeys:['count'],                                       chart:'line'        },
  { id:'dim_mois',              label:'Mois - dimension',                   endpoint:'dim_mois',              cat:'Dimension', cols:['mois','annee','count','deces','cumul'],                                        xKey:'mois',      yKeys:['count'],                                       chart:'area'        },
  { id:'dim_wilaya',            label:'Wilaya - dimension',                 endpoint:'dim_wilaya',            cat:'Dimension', cols:['wilaya','annee','count','taux','deces','population'],                          xKey:'wilaya',    yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_sexe',              label:'Sexe - dimension',                   endpoint:'dim_sexe',              cat:'Dimension', cols:['sexe','annee','count','taux','deces'],                                         xKey:'sexe',      yKeys:['count'],                                       chart:'pie'         },
  { id:'dim_stade',             label:'Stade - dimension',                  endpoint:'dim_stade',             cat:'Dimension', cols:['stade','annee','count','pct','deces','survie_5ans'],                           xKey:'stade',     yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_traitement',        label:'Traitement - dimension',             endpoint:'dim_traitement',        cat:'Dimension', cols:['traitement','annee','count','pct','reponse_complete','delai_moyen'],            xKey:'traitement',yKeys:['count'],                                       chart:'donut'       },
  { id:'dim_region',            label:'Région - dimension',                 endpoint:'dim_region',            cat:'Dimension', cols:['region','annee','count','taux','population'],                                  xKey:'region',    yKeys:['count'],                                       chart:'bar'         },
  { id:'dim_trimestre',         label:'Trimestre - dimension',              endpoint:'dim_trimestre',         cat:'Dimension', cols:['trimestre','annee','count','variation_pct'],                                   xKey:'trimestre', yKeys:['count'],                                       chart:'bar'         },
];

const CATS = ['Tous','Cancer','Age','Stade','Temporel','Wilaya','Survie','Traitement','Epidemio','Dimension'];

const INDIVIDUAL_SOURCES = [
  { id:'ind_cancer',     label:'Cancer',              type:'dimension', key:'cancer'       },
  { id:'ind_age',        label:'Age',                 type:'dimension', key:'groupe'       },
  { id:'ind_annee',      label:'Année',               type:'dimension', key:'annee'        },
  { id:'ind_mois',       label:'Mois',                type:'dimension', key:'mois'         },
  { id:'ind_wilaya',     label:'Wilaya',              type:'dimension', key:'wilaya'       },
  { id:'ind_sexe',       label:'Sexe',                type:'dimension', key:'sexe'         },
  { id:'ind_stade',      label:'Stade',               type:'dimension', key:'stade'        },
  { id:'ind_traitement', label:'Traitement',          type:'dimension', key:'traitement'   },
  { id:'ind_region',     label:'Région',              type:'dimension', key:'region'       },
  { id:'ind_trimestre',  label:'Trimestre',           type:'dimension', key:'trimestre'    },
  { id:'ind_facteur',    label:'Facteur de risque',   type:'dimension', key:'facteur'      },
  { id:'ind_comorbid',   label:'Comorbidité',         type:'dimension', key:'comorbid'     },
  { id:'ind_count',      label:'Nombre de cas',       type:'metric',    key:'count'        },
  { id:'ind_deces',      label:'Décès',               type:'metric',    key:'deces'        },
  { id:'ind_taux',       label:'Taux brut',           type:'metric',    key:'taux'         },
  { id:'ind_taux_std',   label:'Taux standardisé',    type:'metric',    key:'taux_std'     },
  { id:'ind_survie5',    label:'Survie 5 ans (%)',    type:'metric',    key:'survie_5ans'  },
  { id:'ind_survie3',    label:'Survie 3 ans (%)',    type:'metric',    key:'survie_3ans'  },
  { id:'ind_age_med',    label:'Âge médian',          type:'metric',    key:'age_median'   },
  { id:'ind_delai',      label:'Délai moyen (mois)',  type:'metric',    key:'delai_moyen'  },
  { id:'ind_pct',        label:'Pourcentage (%)',     type:'metric',    key:'pct'          },
  { id:'ind_variation',  label:'Variation (%)',       type:'metric',    key:'variation_pct'},
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

async function captureElement(el) {
  if (!el) return null;
  try {
    if (typeof window.html2canvas !== 'undefined') {
      const canvas = await window.html2canvas(el, { backgroundColor: '#0d1117', scale: 2 });
      return canvas.toDataURL('image/png');
    }
    const svg = el.querySelector('svg');
    if (svg) {
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    }
    return null;
  } catch { return null; }
}

function exportToPDF(report, chartLabel, chartImgUrl, chartData) {
  const date = new Date().toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' });
  const PRIO_COLOR = { haute:'#f43f5e', moyenne:'#f59e0b', basse:'#10b981' };
  const PRIO_LABEL = { haute:'Priorité haute', moyenne:'Priorité moyenne', basse:'Priorité basse' };

  const recoHtml = (report.recommandations || []).map(rec => `
    <div style="border-left:3px solid ${PRIO_COLOR[rec.priorite]||'#3b82f6'};padding:8px 12px;margin:8px 0;background:#f8faff;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <strong style="color:#1e293b;">${rec.titre||''}</strong>
        <span style="font-size:11px;color:${PRIO_COLOR[rec.priorite]};font-weight:700;">${PRIO_LABEL[rec.priorite]||''}</span>
      </div>
      <p style="margin:0 0 4px;color:#475569;font-size:13px;line-height:1.6;">${rec.detail||''}</p>
      <div style="font-size:12px;color:${PRIO_COLOR[rec.priorite]};font-weight:600;">Cible: ${rec.kpi_cible||''}</div>
    </div>
  `).join('');

  const tableHtml = chartData?.length ? (() => {
    const keys = Object.keys(chartData[0]);
    return `<table>
      <thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead>
      <tbody>${chartData.slice(0,30).map(row=>`<tr>${keys.map(k=>`<td>${row[k]??'—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  })() : '';

  const mdLines = (report.contenu_md||'')
    .replace(/^# (.+)/gm,'<h2>$1</h2>')
    .replace(/^## (.+)/gm,'<h3>$1</h3>')
    .replace(/^### (.+)/gm,'<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^> (.+)/gm,'<blockquote>$1</blockquote>')
    .replace(/^---$/gm,'<hr>')
    .replace(/\n/g,'<br>');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Rapport — ${chartLabel}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;}
  .cover{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:48px;min-height:200px;}
  .cover h1{font-size:28px;font-weight:800;margin-bottom:8px;}
  .cover .sub{font-size:14px;opacity:.7;margin-bottom:4px;}
  .cover .badge{display:inline-block;background:rgba(59,130,246,.3);border:1px solid rgba(59,130,246,.5);color:#93c5fd;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-top:12px;}
  .body{padding:36px 48px;}
  h2{font-size:18px;color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin:28px 0 14px;}
  h3{font-size:15px;color:#1e40af;margin:20px 0 8px;}
  h4{font-size:13px;color:#475569;margin:12px 0 6px;}
  p,pre{font-size:13px;line-height:1.7;color:#334155;margin-bottom:10px;}
  blockquote{border-left:3px solid #f59e0b;padding:8px 14px;background:#fffbeb;color:#92400e;margin:10px 0;font-size:13px;}
  hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0;}
  .chart-img{width:100%;max-height:300px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;background:#f8faff;padding:12px;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin:16px 0;}
  th{background:#1e3a5f;color:#fff;padding:8px 10px;text-align:left;font-weight:600;}
  td{padding:6px 10px;border-bottom:1px solid #e2e8f0;color:#334155;}
  tr:nth-child(even) td{background:#f8faff;}
  .footer{background:#f1f5f9;border-top:1px solid #e2e8f0;padding:16px 48px;font-size:11px;color:#94a3b8;text-align:center;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
  <div class="cover">
    <div class="sub">Registre National du Cancer — CIRC-OMS</div>
    <h1>${report.titre||'Rapport épidémiologique'}</h1>
    <div class="sub">Graphique : ${chartLabel}</div>
    <div class="sub">Généré le ${date}</div>
    <div class="badge">Rapport IA Automatique</div>
  </div>
  <div class="body">
    ${chartImgUrl?`<h2>Visualisation des données</h2><img src="${chartImgUrl}" alt="Graphique" class="chart-img">`:''}
    ${tableHtml?`<h2>Données brutes (${Math.min(chartData.length,30)} entrées)</h2>${tableHtml}`:''}
    <h2>Analyse épidémiologique</h2>
    <div>${mdLines}</div>
    ${recoHtml?`<h2>Recommandations prioritaires</h2>${recoHtml}`:''}
  </div>
  <div class="footer">RegistreCancer.dz — Rapport généré automatiquement par l'IA — ${date} — Pour usage médical uniquement après validation épidémiologique</div>
  <script>window.onload=()=>window.print();<\/script>
</body></html>`;

  const blob = new Blob([html],{type:'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url,'_blank');
  if (!win) { const a=document.createElement('a');a.href=url;a.download=`rapport_${chartLabel.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.html`;a.click(); }
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

function exportToWord(report, chartLabel, chartData) {
  const date = new Date().toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'});
  const PRIO_COLOR = { haute:'DC143C', moyenne:'FF8C00', basse:'228B22' };

  const recoXml = (report.recommandations||[]).map(rec=>`
    <w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>${rec.titre||''}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:color w:val="${PRIO_COLOR[rec.priorite]||'333333'}"/><w:b/></w:rPr>
      <w:t>Priorité: ${rec.priorite||''} | Cible: ${rec.kpi_cible||''}</w:t>
    </w:r></w:p>
    <w:p><w:r><w:t>${rec.detail||''}</w:t></w:r></w:p>
    <w:p><w:r><w:t> </w:t></w:r></w:p>
  `).join('');

  const tableXml = chartData?.length ? (() => {
    const keys = Object.keys(chartData[0]);
    const hdr  = `<w:tr>${keys.map(k=>`<w:tc><w:tcPr><w:shd w:fill="1E3A5F"/></w:tcPr><w:p><w:r><w:rPr><w:color w:val="FFFFFF"/><w:b/></w:rPr><w:t>${k}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
    const rows = chartData.slice(0,25).map((row,ri)=>`<w:tr>${keys.map(k=>`<w:tc><w:tcPr>${ri%2===0?'<w:shd w:fill="F8FAFF"/>':''}</w:tcPr><w:p><w:r><w:t>${row[k]??'—'}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('');
    return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9360" w:type="dxa"/></w:tblPr>${hdr}${rows}</w:tbl>`;
  })() : '';

  const mdToWord = (md='') => md
    .replace(/^# (.+)/gm,'</w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>$1</w:t>')
    .replace(/^## (.+)/gm,'</w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>$1</w:t>')
    .replace(/\*\*(.+?)\*\*/g,'</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>$1</w:t></w:r><w:r><w:t>')
    .replace(/\n/g,'</w:t></w:r></w:p><w:p><w:r><w:t>');

  const docxml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
  <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${report.titre||'Rapport épidémiologique'}</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr><w:r><w:t>Graphique : ${chartLabel} — Généré le ${date}</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Données du graphique</w:t></w:r></w:p>
  ${tableXml}
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Analyse épidémiologique</w:t></w:r></w:p>
  <w:p><w:r><w:t>${mdToWord(report.contenu_md||'Aucun contenu.')}</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Recommandations prioritaires</w:t></w:r></w:p>
  ${recoXml}
  <w:p><w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr>
    <w:t>RegistreCancer.dz — Rapport généré automatiquement par l'IA — ${date}</w:t>
  </w:r></w:p>
  <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body></w:document>`;

  const blob = new Blob([docxml],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rapport_${chartLabel.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.docx`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
}

function exportToCSV(chartLabel, chartData) {
  if (!chartData?.length) return;
  const keys = Object.keys(chartData[0]);
  const csv  = [keys.join(';'), ...chartData.map(row=>keys.map(k=>`"${row[k]??''}"`).join(';'))].join('\n');
  const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `donnees_${chartLabel.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.csv`;
  a.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD MENU  (dropdown attaché au rapport IA, + barre autonome sur le chart)
// ═══════════════════════════════════════════════════════════════════════════════
function DownloadMenu({ report, chartLabel, chartData, chartRef }) {
  const [open,      setOpen]      = useState(false);
  const [exporting, setExporting] = useState(null);
  const wrapRef = useRef(null);

  // ferme si clic en dehors
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const doExport = async (format) => {
    setExporting(format); setOpen(false);
    try {
      const imgUrl = format === 'pdf' ? await captureElement(chartRef?.current) : null;
      if (format === 'pdf')  exportToPDF(report, chartLabel, imgUrl, chartData);
      if (format === 'word') exportToWord(report, chartLabel, chartData);
      if (format === 'csv')  exportToCSV(chartLabel, chartData);
    } finally { setTimeout(()=>setExporting(null), 1500); }
  };

  if (!report) return null;

  const OPTS = [
    { id:'pdf',  icon:'', label:'PDF / Impression',  sub:'Rapport complet avec graphique' },
    { id:'word', icon:'', label:'Word (.docx)',       sub:'Rapport éditable Microsoft Word' },
    { id:'csv',  icon:'',  label:'CSV (données)',      sub:'Données brutes du graphique'    },
  ];

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} disabled={!!exporting} style={{
        display:'flex', alignItems:'center', gap:5, padding:'4px 12px',
        borderRadius:20, border:'1px solid var(--success)',
        background: open ? 'rgba(0,229,160,.12)' : 'transparent',
        color:'var(--success)', fontSize:10, fontWeight:700,
        cursor: exporting ? 'wait' : 'pointer', transition:'all .15s',
      }}
      onMouseEnter={e=>{ if (!exporting) e.currentTarget.style.background='rgba(0,229,160,.12)'; }}
      onMouseLeave={e=>{ if (!open) e.currentTarget.style.background='transparent'; }}
      >
        {exporting ? <Spinner size={10} color="var(--success)" /> : null}
        {exporting ? 'Export...' : 'Télécharger'}
        <span style={{ fontSize:8, opacity:.7 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', right:0, bottom:'110%', zIndex:100,
          background:'var(--bg-elevated)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-md)', padding:6, minWidth:230,
          boxShadow:'0 8px 32px rgba(0,0,0,.35)', animation:'fadeUp .15s ease',
        }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:'var(--text-muted)',
            textTransform:'uppercase', padding:'4px 8px 8px' }}>Format d'export</div>
          {OPTS.map(opt=>(
            <button key={opt.id} onClick={()=>doExport(opt.id)} style={{
              display:'flex', alignItems:'flex-start', gap:10, width:'100%',
              padding:'8px 10px', borderRadius:'var(--radius-sm)', border:'none',
              background:'transparent', cursor:'pointer', textAlign:'left', transition:'background .12s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{ fontSize:16, lineHeight:1, marginTop:1 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)' }}>{opt.label}</div>
                <div style={{ fontSize:9.5, color:'var(--text-muted)', marginTop:1 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)',
      borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:12, boxShadow:'0 8px 32px rgba(0,0,0,.15)' }}>
      {label && <div style={{ color:'var(--text-muted)', marginBottom:6, fontWeight:600 }}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:p.color||'var(--accent)', flexShrink:0 }}/>
          <span style={{ color:'var(--text-secondary)' }}>{p.name} </span>
          <strong style={{ color:p.color||'var(--text-primary)' }}>
            {typeof p.value==='number'?p.value.toLocaleString('fr-FR'):p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Spinner({ size=16, color }) {
  return <div style={{ width:size, height:size, flexShrink:0, border:'2px solid var(--border-light)',
    borderTop:`2px solid ${color||'var(--accent)'}`, borderRadius:'50%', animation:'spin .7s linear infinite' }}/>;
}

function Badge({ children, color }) {
  const c = color||'var(--accent)';
  return <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, letterSpacing:.5,
    background:`${c}18`, color:c, border:`1px solid ${c}30` }}>{children}</span>;
}

function SectionLabel({ children, color }) {
  return <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.8,
    marginBottom:8, color:color||'var(--text-muted)' }}>{children}</div>;
}

function Btn({ children, onClick, active, color, disabled, small, style:ext }) {
  const c = color||'var(--accent)';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:small?'5px 10px':'8px 16px', borderRadius:'var(--radius-sm)',
      border:`1.5px solid ${active?c:'var(--border-light)'}`,
      background:active?`${c}15`:'transparent', color:active?c:'var(--text-secondary)',
      fontSize:small?11:12, fontWeight:600, cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?0.5:1, transition:'all .15s', display:'flex', alignItems:'center', gap:5,
      outline:active?`1px solid ${c}20`:'none', outlineOffset:'-2px', ...ext,
    }}
    onMouseEnter={e=>{ if(!active&&!disabled){e.currentTarget.style.borderColor=c;e.currentTarget.style.color=c;e.currentTarget.style.background=`${c}10`;}}}
    onMouseLeave={e=>{ if(!active&&!disabled){e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.background='transparent';}}}
    >{children}</button>
  );
}

function StyledInput({ value, onChange, placeholder, style:ext }) {
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'100%', boxSizing:'border-box', padding:'8px 12px',
        background:'var(--bg-elevated)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-sm)', color:'var(--text-primary)',
        fontSize:12, outline:'none', transition:'border-color .15s',
        fontFamily:'var(--font-body)', ...ext }}
      onFocus={e=>e.target.style.borderColor='var(--border-focus)'}
      onBlur={e=>e.target.style.borderColor='var(--border)'}
    />
  );
}

function KPICard({ label, value, sub, color, trend }) {
  return (
    <div style={{ background:'var(--bg-card)', border:`1px solid ${color}20`,
      borderRadius:'var(--radius-md)', padding:'16px 18px', position:'relative',
      overflow:'hidden', transition:'transform .15s, box-shadow .15s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${color}20`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}
    >
      <div style={{ position:'absolute', top:0, right:0, width:80, height:80,
        background:`radial-gradient(circle, ${color}15 0%, transparent 70%)`, borderRadius:'0 var(--radius-md) 0 0' }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color }}/>
        {trend!==undefined&&trend!==null&&(
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, fontWeight:600,
            background:trend>=0?'rgba(0,229,160,0.12)':'rgba(255,77,106,0.12)',
            color:trend>=0?'#00e5a0':'#ff4d6a' }}>
            {trend>=0?'↑':'↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', color, lineHeight:1, marginBottom:4 }}>{value??'—'}</div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:sub?2:0 }}>{label}</div>
      {sub&&<div style={{ fontSize:10, color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, sub, children, accentColor }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)',
      borderRadius:'var(--radius-md)', padding:'18px 20px', transition:'border-color .15s' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-focus)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-light)'}
    >
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {accentColor&&<div style={{ width:3, height:16, borderRadius:2, background:accentColor, flexShrink:0 }}/>}
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{title}</div>
        </div>
        {sub&&<div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER CHART
// ═══════════════════════════════════════════════════════════════════════════════
function RenderChart({ chartType, data, xKey, yKeys, colors, height=220 }) {
  const getVar = v => typeof document!=='undefined'?getComputedStyle(document.documentElement).getPropertyValue(v).trim():'#888';
  const textColor = getVar('--text-muted')||'#6b7280';
  const gridColor = getVar('--border')||'rgba(0,0,0,0.08)';
  const ax  = { fontSize:10, fill:textColor };
  const gr  = { stroke:gridColor, strokeDasharray:'3 3' };
  const pal = colors||PALETTES.ocean;

  if (!data?.length) return <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--text-muted)', fontSize:12 }}>Aucune donnée</div>;

  const cp = { data, margin:{ top:4, right:8, bottom:4, left:-18 } };

  if (chartType==='bar') return (
    <ResponsiveContainer width="100%" height={height}><BarChart {...cp}>
      <CartesianGrid {...gr}/><XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false}/>
      <YAxis tick={ax} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip/>}/>
      {yKeys.map((k,i)=><Bar key={k} dataKey={k} fill={pal[i%pal.length]} radius={[3,3,0,0]}/>)}
    </BarChart></ResponsiveContainer>
  );
  if (chartType==='bar_grouped') return (
    <ResponsiveContainer width="100%" height={height}><BarChart {...cp}>
      <CartesianGrid {...gr}/><XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false}/>
      <YAxis tick={ax} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{fontSize:10}}/>
      {yKeys.map((k,i)=><Bar key={k} dataKey={k} fill={pal[i%pal.length]} radius={[2,2,0,0]}/>)}
    </BarChart></ResponsiveContainer>
  );
  if (chartType==='bar_stacked') return (
    <ResponsiveContainer width="100%" height={height}><BarChart {...cp}>
      <CartesianGrid {...gr}/><XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false}/>
      <YAxis tick={ax} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip/>}/>
      <Legend wrapperStyle={{fontSize:10}}/>
      {yKeys.map((k,i)=><Bar key={k} dataKey={k} stackId="a" fill={pal[i%pal.length]}/>)}
    </BarChart></ResponsiveContainer>
  );
  if (chartType==='line') return (
    <ResponsiveContainer width="100%" height={height}><LineChart {...cp}>
      <CartesianGrid {...gr}/><XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false}/>
      <YAxis tick={ax} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip/>}/>
      {yKeys.length>1&&<Legend wrapperStyle={{fontSize:10}}/>}
      {yKeys.map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={pal[i%pal.length]} strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>)}
    </LineChart></ResponsiveContainer>
  );
  if (chartType==='area') return (
    <ResponsiveContainer width="100%" height={height}><AreaChart {...cp}>
      <defs>{yKeys.map((k,i)=><linearGradient key={k} id={`ag_${k}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={pal[i%pal.length]} stopOpacity={0.3}/>
        <stop offset="95%" stopColor={pal[i%pal.length]} stopOpacity={0}/>
      </linearGradient>)}</defs>
      <CartesianGrid {...gr}/><XAxis dataKey={xKey} tick={ax} axisLine={false} tickLine={false}/>
      <YAxis tick={ax} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip/>}/>
      {yKeys.map((k,i)=><Area key={k} type="monotone" dataKey={k} stroke={pal[i%pal.length]} fill={`url(#ag_${k})`} strokeWidth={2}/>)}
    </AreaChart></ResponsiveContainer>
  );
  if (chartType==='pie'||chartType==='donut') {
    const yKey=yKeys[0]; const total=data.reduce((s,d)=>s+(Number(d[yKey])||0),0);
    return (
      <ResponsiveContainer width="100%" height={height}><PieChart>
        <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={85}
          innerRadius={chartType==='donut'?'45%':0} paddingAngle={2}>
          {data.map((_,i)=><Cell key={i} fill={pal[i%pal.length]}/>)}
        </Pie>
        <Tooltip content={<CustomTooltip/>} formatter={v=>[`${Number(v).toLocaleString('fr-FR')} (${Math.round(v/total*100)}%)`]}/>
        <Legend wrapperStyle={{fontSize:10}}/>
      </PieChart></ResponsiveContainer>
    );
  }
  if (chartType==='radar') return (
    <ResponsiveContainer width="100%" height={height}><RadarChart data={data}>
      <PolarGrid stroke={gridColor}/>
      <PolarAngleAxis dataKey={xKey} tick={{fontSize:9,fill:textColor}}/>
      {yKeys.map((k,i)=><Radar key={k} dataKey={k} stroke={pal[i%pal.length]} fill={pal[i%pal.length]} fillOpacity={0.15}/>)}
      <Tooltip content={<CustomTooltip/>}/>
      {yKeys.length>1&&<Legend wrapperStyle={{fontSize:10}}/>}
    </RadarChart></ResponsiveContainer>
  );
  return <div style={{ color:'var(--text-muted)', fontSize:12, padding:20 }}>Type non supporté</div>;
}

// ─── Mini AI Report ────────────────────────────────────────────────────────────
function MiniAIReport({ chartId, filters, chartRef, chartData }) {
  const [state,  setState]  = useState('idle');
  const [report, setReport] = useState(null);
  const [open,   setOpen]   = useState(false);
  const pollRef = useRef(null);

  const generate = useCallback(async () => {
    setState('loading'); setOpen(true);
    try {
      const created = await statsApi.generateReport({
        titre:`Analyse automatique — ${new Date().toLocaleDateString('fr-FR')}`, ...filters,
      });
      const poll = async () => {
        try {
          const r = await statsApi.getReport(created.id);
          if (r.status==='done')  { setReport(r); setState('done'); }
          else if (r.status==='error') setState('error');
          else pollRef.current = setTimeout(poll,1500);
        } catch { setState('error'); }
      };
      if (created.status==='done') { setReport(created); setState('done'); }
      else pollRef.current = setTimeout(poll,1200);
    } catch { setState('error'); }
  },[filters, chartId]);

  useEffect(()=>()=>clearTimeout(pollRef.current),[]);

  const PRIO = { haute:{color:'#ff4d6a',label:'Haute'}, moyenne:{color:'#f5a623',label:'Moyenne'}, basse:{color:'#00e5a0',label:'Basse'} };

  return (
    <div style={{ borderTop:'1px solid var(--border)', marginTop:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
          background:state==='done'?'#00e5a0':state==='loading'?'#f5a623':'var(--text-muted)' }}/>
        <span style={{ fontSize:10, color:'var(--text-muted)', flex:1 }}>
          {state==='idle'    && 'Rapport IA non généré'}
          {state==='loading' && 'Analyse en cours...'}
          {state==='done'    && `${report?.recommandations?.length||0} recommandations`}
          {state==='error'   && 'Erreur de génération'}
        </span>
        {state==='loading' && <Spinner size={12} color="#f5a623"/>}
        {(state==='idle'||state==='error') && (
          <button onClick={generate} style={{ fontSize:10, padding:'3px 10px', borderRadius:20,
            background:'var(--accent-dim)', border:'1px solid var(--border-focus)',
            color:'var(--accent)', cursor:'pointer', fontWeight:700,
            display:'flex', alignItems:'center', gap:4 }}>
            <span>✦</span> Analyser
          </button>
        )}
        {state==='done' && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={()=>setOpen(o=>!o)} style={{ fontSize:10, padding:'3px 10px', borderRadius:20,
              background:open?'var(--accent-dim)':'transparent',
              border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>
              {open?'Masquer':'Voir rapport'}
            </button>
            {/* DownloadMenu = exporte le rapport IA enrichi */}
            <DownloadMenu
              report={report}
              chartLabel={`Rapport IA — ${new Date().toLocaleDateString('fr-FR')}`}
              chartData={chartData}
              chartRef={chartRef}
            />
          </div>
        )}
      </div>

      {open && state==='done' && report && (
        <div style={{ margin:'0 12px 12px', background:'var(--bg-elevated)',
          border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
          overflow:'hidden', animation:'fadeUp .25s ease' }}>
          {report.recommandations?.length>0 && (
            <div style={{ padding:'12px 14px' }}>
              <SectionLabel>Recommandations</SectionLabel>
              {report.recommandations.slice(0,3).map((rec,i)=>{
                const p = PRIO[rec.priorite]||PRIO.basse;
                return (
                  <div key={i} style={{ borderLeft:`2px solid ${p.color}`, paddingLeft:10, marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)' }}>{rec.titre}</span>
                      <Badge color={p.color}>{p.label}</Badge>
                    </div>
                    <p style={{ fontSize:10.5, color:'var(--text-secondary)', margin:0, lineHeight:1.6 }}>{rec.detail}</p>
                    <div style={{ fontSize:9.5, color:p.color, marginTop:4, fontWeight:600 }}>Cible: {rec.kpi_cible}</div>
                  </div>
                );
              })}
            </div>
          )}
          {report.contenu_md && (
            <div style={{ borderTop:'1px solid var(--border)', padding:'10px 14px', maxHeight:180, overflowY:'auto' }}>
              <SectionLabel>Synthèse</SectionLabel>
              <pre style={{ fontSize:10.5, lineHeight:1.7, color:'var(--text-secondary)',
                whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>
                {report.contenu_md.slice(0,600)}{report.contenu_md.length>600?'...':''}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chart Card ────────────────────────────────────────────────────────────────
function ChartCard({ chart, filters, onRemove }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [cType,   setCType]   = useState(chart.chartType);
  const [palette, setPalette] = useState(chart.palette||'ocean');
  const chartRef = useRef(null);   // ← ref pour capture PNG

  useEffect(()=>{
    setLoading(true); setError(null);
    statsApi.getChartData(chart.endpoint,filters)
      .then(res=>setData(Array.isArray(res)?res:(res?.data||[])))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[chart.endpoint, JSON.stringify(filters)]);

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-md)', overflow:'hidden', display:'flex', flexDirection:'column',
      transition:'border-color .15s, box-shadow .15s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{chart.label}</div>
          <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2 }}>{chart.cat} · {data?.length??'—'} enregistrements</div>
        </div>
        <Badge color="var(--accent)">{chart.cat}</Badge>
        {onRemove&&<button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer',
          color:'var(--text-muted)', fontSize:16, lineHeight:1, padding:'0 2px', transition:'color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 14px',
        borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', overflowX:'auto' }}>
        {CHART_TYPES.map(ct=>(
          <button key={ct.id} onClick={()=>setCType(ct.id)} title={ct.label} style={{
            padding:'3px 8px', borderRadius:'var(--radius-sm)', border:'1px solid',
            borderColor:cType===ct.id?'var(--border-focus)':'var(--border)',
            background:cType===ct.id?'var(--accent-dim)':'transparent',
            color:cType===ct.id?'var(--accent)':'var(--text-muted)', fontSize:11, cursor:'pointer', flexShrink:0,
          }}>{ct.icon}</button>
        ))}
        <div style={{ flex:1 }}/>
        {Object.entries(PALETTES).map(([k,pal])=>(
          <button key={k} onClick={()=>setPalette(k)} title={k} style={{
            padding:'3px 5px', borderRadius:'var(--radius-sm)', border:'1px solid',
            borderColor:palette===k?'var(--border-focus)':'var(--border)',
            background:palette===k?'var(--accent-dim)':'transparent',
            cursor:'pointer', display:'flex', gap:2, flexShrink:0,
          }}>
            {pal.slice(0,3).map((c,i)=><div key={i} style={{ width:5, height:12, borderRadius:1, background:c }}/>)}
          </button>
        ))}
      </div>

      {/* Chart — on pose le ref ici pour la capture */}
      <div ref={chartRef} style={{ padding:'14px 12px 8px' }}>
        {loading&&<div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <Spinner size={18}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>Chargement des données...</span>
        </div>}
        {error&&<div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center',
          flexDirection:'column', gap:6, color:'var(--danger)' }}>
          <span style={{ fontSize:20 }}>!</span><span style={{ fontSize:11 }}>{error}</span>
        </div>}
        {!loading&&!error&&<RenderChart key={`${chart.id}-${cType}-${palette}`}
          chartType={cType} data={data} xKey={chart.xKey} yKeys={chart.yKeys} colors={PALETTES[palette]}/>}
      </div>


      {/* ── Rapport IA + export enrichi ── */}
      <MiniAIReport chartId={chart.id} filters={filters} chartRef={chartRef} chartData={data}/>
    </div>
  );
}

// ─── Source Axis Config ────────────────────────────────────────────────────────
function SourceAxisConfig({ src, axisOverride, onChange, onRemove, color }) {
  const cols = src.cols||[src.xKey,...src.yKeys];
  const curX = axisOverride?.xKey||src.xKey;
  const curY = axisOverride?.yKeys?.length>0?axisOverride.yKeys:[...src.yKeys];
  const setX    = col => onChange({ xKey:col, yKeys:curY.filter(k=>k!==col) });
  const toggleY = col => { const next=curY.includes(col)?curY.filter(k=>k!==col):[...curY,col]; onChange({ xKey:curX, yKeys:next.length>0?next:curY }); };
  const btnS    = active => ({ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:'var(--radius-sm)',
    border:'none', background:active?`${color}15`:'transparent', cursor:'pointer', textAlign:'left', transition:'background .1s', width:'100%' });

  return (
    <div style={{ borderRadius:'var(--radius-sm)', border:`1px solid ${color}30`, background:`${color}06`, overflow:'hidden', marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', background:`${color}10`, borderBottom:`1px solid ${color}20` }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{src.label}</span>
        <Badge color={color}>{src.cat}</Badge>
        <button onClick={onRemove} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:15, padding:'0 2px', lineHeight:1 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>
      </div>
      <div style={{ display:'flex' }}>
        <div style={{ flex:1, borderRight:`1px solid ${color}15`, padding:'8px 10px' }}>
          <SectionLabel color={color}>← Axe X</SectionLabel>
          {cols.map(col=>(
            <button key={col} onClick={()=>setX(col)} style={btnS(curX===col)}>
              <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0,
                border:`1.5px solid ${curX===col?color:'var(--border-light)'}`, background:curX===col?color:'transparent' }}/>
              <span style={{ fontSize:10.5, fontFamily:'var(--font-mono)', color:curX===col?'var(--text-primary)':'var(--text-secondary)' }}>{col}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, padding:'8px 10px' }}>
          <SectionLabel color={color}>↑ Axe Y (multi)</SectionLabel>
          {cols.filter(c=>c!==curX).map(col=>{
            const checked=curY.includes(col);
            return (
              <button key={col} onClick={()=>toggleY(col)} style={btnS(checked)}>
                <div style={{ width:10, height:10, borderRadius:2, flexShrink:0,
                  border:`1.5px solid ${checked?color:'var(--border-light)'}`, background:checked?color:'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, color:'#fff' }}>{checked&&'✓'}</div>
                <span style={{ fontSize:10.5, fontFamily:'var(--font-mono)', color:checked?'var(--text-primary)':'var(--text-secondary)' }}>{col}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding:'4px 10px 7px', fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)', borderTop:`1px solid ${color}10` }}>
        X: <span style={{ color }}>{curX}</span>{'  ·  Y: '}<span style={{ color:'var(--info)' }}>[{curY.join(', ')}]</span>
      </div>
    </div>
  );
}

// ─── Source Selector ───────────────────────────────────────────────────────────
function SourceSelector({ onAdd, filters }) {
  const [search,setSearch]=useState(''); const [cat,setCat]=useState('Tous');
  const [selId,setSelId]=useState(null); const [selChart,setSelChart]=useState('bar');
  const [selPal,setSelPal]=useState('ocean'); const [aiLoading,setAiLoading]=useState(false);
  const [axisMap,setAxisMap]=useState({});

  const filtered = useMemo(()=>SOURCE_CATALOG.filter(s=>{
    const matchCat=cat==='Tous'||s.cat===cat;
    const matchQ=!search||s.label.toLowerCase().includes(search.toLowerCase())||(s.cols||[]).some(c=>c.toLowerCase().includes(search.toLowerCase()));
    return matchCat&&matchQ;
  }),[search,cat]);

  const selectedSource = SOURCE_CATALOG.find(s=>s.id===selId)||null;
  const toggleSource   = useCallback(src=>{ setSelId(prev=>prev===src.id?null:src.id); setAxisMap({}); },[]);
  const setAxis        = useCallback((id,ax)=>setAxisMap(p=>({...p,[id]:ax})),[]);

  const handleAdd = () => {
    if (!selectedSource) return;
    const ax=axisMap[selectedSource.id];
    onAdd({ id:Date.now()+Math.random(), label:selectedSource.label, endpoint:selectedSource.endpoint,
      cat:selectedSource.cat, xKey:ax?.xKey||selectedSource.xKey,
      yKeys:ax?.yKeys?.length>0?ax.yKeys:selectedSource.yKeys, chartType:selChart, palette:selPal });
    setSelId(null); setAxisMap({}); setSelChart('bar');
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const suggestions = await statsApi.suggestCharts(filters);
      (suggestions||[]).slice(0,6).forEach(s=>{
        const src=SOURCE_CATALOG.find(c=>c.endpoint===s.source||c.id===s.source);
        if (src) onAdd({ id:Date.now()+Math.random(), label:s.titre||src.label, endpoint:src.endpoint,
          cat:src.cat, xKey:src.xKey, yKeys:src.yKeys, chartType:s.chart_type||src.chart, palette:'aurora' });
      });
    } catch(e){ console.error(e); }
    finally{ setAiLoading(false); }
  };

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Sources de données</div>
          <div style={{ fontSize:9.5, color:'var(--text-muted)', marginTop:1 }}>{SOURCE_CATALOG.length} sources · colonnes X/Y configurables</div>
        </div>
        {selId&&<button onClick={()=>{ setSelId(null); setAxisMap({}); }} style={{ padding:'4px 10px', borderRadius:'var(--radius-sm)', border:'1px solid var(--danger)', background:'transparent', color:'var(--danger)', fontSize:10, fontWeight:700, cursor:'pointer' }}>Vider</button>}
        <button onClick={handleAISuggest} disabled={aiLoading} style={{ padding:'7px 14px', borderRadius:'var(--radius-sm)',
          background:aiLoading?'var(--bg-elevated)':'var(--accent-dim)', border:'1px solid var(--border-focus)',
          color:aiLoading?'var(--text-muted)':'var(--accent)', fontSize:11, fontWeight:700,
          cursor:aiLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .15s' }}>
          {aiLoading?<Spinner size={11}/>:<span>✦</span>}
          {aiLoading?'Analyse IA...':'Générer par IA'}
        </button>
      </div>
      <div style={{ padding:'14px 16px' }}>
        <StyledInput value={search} onChange={setSearch} placeholder="Rechercher... cancer, wilaya, taux..." style={{ marginBottom:10 }}/>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
          {CATS.map(c=>(
            <Btn key={c} small active={cat===c} onClick={()=>setCat(c)}>
              {c}{c!=='Tous'&&<span style={{ fontSize:9, opacity:.6 }}>{SOURCE_CATALOG.filter(s=>s.cat===c).length}</span>}
            </Btn>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 10px',
          borderRadius:'var(--radius-sm)', background:selId?'var(--accent-dim)':'var(--bg-elevated)',
          border:`1px solid ${selId?'var(--border-focus)':'var(--border)'}`, transition:'all .2s' }}>
          <span style={{ fontSize:11, fontWeight:700, color:selId?'var(--accent)':'var(--text-muted)' }}>
            {!selId?'☐ Sélectionnez une source':`✓ ${selectedSource?.label}`}
          </span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:220, overflowY:'auto', paddingRight:4 }}>
          {filtered.length===0&&<div style={{ padding:20, textAlign:'center', color:'var(--text-muted)', fontSize:12 }}>Aucune source pour « {search} »</div>}
          {filtered.map(src=>{
            const isSel=selId===src.id;
            return (
              <button key={src.id} onClick={()=>toggleSource(src)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                borderRadius:'var(--radius-sm)', border:`1px solid ${isSel?'var(--border-focus)':'var(--border)'}`,
                background:isSel?'var(--accent-dim)':'transparent', cursor:'pointer', textAlign:'left', transition:'all .12s' }}
                onMouseEnter={e=>{ if(!isSel){e.currentTarget.style.background='var(--bg-hover)';e.currentTarget.style.borderColor='var(--border-light)';}}}
                onMouseLeave={e=>{ if(!isSel){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';}}}
              >
                <div style={{ width:14, height:14, borderRadius:'50%', flexShrink:0,
                  border:`1.5px solid ${isSel?'var(--accent)':'var(--border-light)'}`,
                  background:isSel?'var(--accent)':'transparent', transition:'all .12s' }}/>
                <div style={{ width:3, height:24, borderRadius:2, flexShrink:0, background:isSel?'var(--accent)':'var(--border-light)' }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:isSel?'var(--text-primary)':'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{src.label}</div>
                  <div style={{ fontSize:8.5, color:'var(--text-muted)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(src.cols||[]).join(' · ')}</div>
                </div>
                <Badge color={isSel?'var(--accent)':'var(--text-muted)'}>{src.cat}</Badge>
              </button>
            );
          })}
        </div>
        {selectedSource&&(
          <div style={{ marginTop:12, padding:14, background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-focus)', animation:'fadeUp .2s ease' }}>
            <SectionLabel># Axes X / Y</SectionLabel>
            <SourceAxisConfig src={selectedSource} axisOverride={axisMap[selectedSource.id]||null}
              onChange={ax=>setAxis(selectedSource.id,ax)} onRemove={()=>toggleSource(selectedSource)} color={CHART_COLORS[0]}/>
            <SectionLabel>Type de graphique</SectionLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
              {CHART_TYPES.map(ct=>(
                <Btn key={ct.id} small active={selChart===ct.id} onClick={()=>setSelChart(ct.id)} color="var(--success)">
                  <span style={{ fontFamily:'var(--font-mono)' }}>{ct.icon}</span> {ct.label}
                </Btn>
              ))}
            </div>
            <SectionLabel>Palette de couleurs</SectionLabel>
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {Object.entries(PALETTES).map(([k,pal])=>(
                <button key={k} onClick={()=>setSelPal(k)} title={k} style={{ padding:'4px 6px', borderRadius:'var(--radius-sm)',
                  border:'1px solid', borderColor:selPal===k?'var(--border-focus)':'var(--border)',
                  background:selPal===k?'var(--accent-dim)':'transparent', cursor:'pointer', display:'flex', gap:2 }}>
                  {pal.slice(0,4).map((c,i)=><div key={i} style={{ width:6, height:14, borderRadius:1, background:c }}/>)}
                </button>
              ))}
            </div>
            <button onClick={handleAdd} style={{ width:'100%', padding:'10px 0', borderRadius:'var(--radius-sm)',
              border:'1.5px solid var(--border-focus)', background:'var(--accent-dim)', color:'var(--accent)',
              fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--accent-glow)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--accent-dim)'}>
              Ajouter à la galerie
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Custom Chart Builder ──────────────────────────────────────────────────────
function CustomChartBuilder({ onAdd }) {
  const [selDim,setSelDim]=useState(null); const [selMets,setSelMets]=useState([]);
  const [selChart,setSelChart]=useState('bar'); const [selPal,setSelPal]=useState('ocean');
  const [label,setLabel]=useState('');
  const dimensions = INDIVIDUAL_SOURCES.filter(s=>s.type==='dimension');
  const metrics    = INDIVIDUAL_SOURCES.filter(s=>s.type==='metric');
  const canAdd     = selDim&&selMets.length>0;
  const toggleMet  = met=>setSelMets(prev=>prev.find(m=>m.id===met.id)?prev.filter(m=>m.id!==met.id):[...prev,met]);

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ id:Date.now()+Math.random(), label:label.trim()||`${selDim.label} x ${selMets.map(m=>m.label).join(' + ')}`,
      endpoint:`custom__${selDim.id}__${selMets.map(m=>m.id).join('_')}`, cat:'Custom',
      xKey:selDim.key, yKeys:selMets.map(m=>m.key), chartType:selChart, palette:selPal });
    setSelDim(null); setSelMets([]); setLabel(''); setSelChart('bar');
  };

  const chip = (active,color) => ({ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:20,
    border:`1.5px solid ${active?color:'var(--border-light)'}`,
    background:active?`${color}15`:'transparent', color:active?color:'var(--text-secondary)',
    fontSize:11.5, fontWeight:active?700:500, cursor:'pointer', transition:'all .12s', outline:'none' });

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--accent-2)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-elevated)', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Constructeur libre</div>
          <div style={{ fontSize:9.5, color:'var(--text-muted)', marginTop:1 }}>Dimension X + Métriques Y → graphique sur mesure</div>
        </div>
        <Badge color="var(--accent-2)">Custom</Badge>
      </div>
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <SectionLabel color="var(--accent-2)">← Axe X — Dimension {selDim&&<Badge color="var(--accent-2)">{selDim.label}</Badge>}</SectionLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {dimensions.map(dim=>(
              <button key={dim.id} onClick={()=>setSelDim(selDim?.id===dim.id?null:dim)} style={chip(selDim?.id===dim.id,'var(--accent-2)')}
                onMouseEnter={e=>{ if(selDim?.id!==dim.id){e.currentTarget.style.borderColor='var(--accent-2)';e.currentTarget.style.color='var(--text-primary)';}}}
                onMouseLeave={e=>{ if(selDim?.id!==dim.id){e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.color='var(--text-secondary)';}}}
              >{dim.label}</button>
            ))}
          </div>
        </div>
        <div style={{ height:1, background:'var(--border)' }}/>
        <div>
          <SectionLabel color="var(--success)">↑ Axe Y — Métriques {selMets.length>0&&<Badge color="var(--success)">{selMets.length} sélectionnée{selMets.length>1?'s':''}</Badge>}</SectionLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {metrics.map(met=>(
              <button key={met.id} onClick={()=>toggleMet(met)} style={chip(!!selMets.find(m=>m.id===met.id),'var(--success)')}
                onMouseEnter={e=>{ if(!selMets.find(m=>m.id===met.id)){e.currentTarget.style.borderColor='var(--success)';e.currentTarget.style.color='var(--text-primary)';}}}
                onMouseLeave={e=>{ if(!selMets.find(m=>m.id===met.id)){e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.color='var(--text-secondary)';}}}
              >{met.label}</button>
            ))}
          </div>
        </div>
        {canAdd&&(
          <>
            <div style={{ padding:'10px 12px', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:10.5, lineHeight:1.9 }}>
              <span style={{ color:'var(--text-muted)' }}>X: </span><span style={{ color:'var(--accent-2)' }}>{selDim.label}</span>
              {'   '}<span style={{ color:'var(--text-muted)' }}>Y: </span><span style={{ color:'var(--success)' }}>[{selMets.map(m=>m.label).join(', ')}]</span>
            </div>
            <StyledInput value={label} onChange={setLabel} placeholder={`${selDim?.label} x ${selMets.map(m=>m.label).join(', ')}`}/>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {CHART_TYPES.map(ct=>(
                <Btn key={ct.id} small active={selChart===ct.id} onClick={()=>setSelChart(ct.id)} color="var(--accent-2)">
                  <span style={{ fontFamily:'var(--font-mono)' }}>{ct.icon}</span> {ct.label}
                </Btn>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {Object.entries(PALETTES).map(([k,pal])=>(
                <button key={k} onClick={()=>setSelPal(k)} style={{ padding:'4px 6px', borderRadius:'var(--radius-sm)',
                  border:'1px solid', borderColor:selPal===k?'var(--border-focus)':'var(--border)',
                  background:selPal===k?'var(--accent-dim)':'transparent', cursor:'pointer', display:'flex', gap:2 }}>
                  {pal.slice(0,4).map((c,i)=><div key={i} style={{ width:6, height:14, borderRadius:1, background:c }}/>)}
                </button>
              ))}
            </div>
            <button onClick={handleAdd} style={{ width:'100%', padding:'10px 0', borderRadius:'var(--radius-sm)',
              border:'1.5px solid var(--accent-2)', background:'var(--accent-dim)', color:'var(--accent-2)',
              fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              Générer le graphique personnalisé
            </button>
          </>
        )}
        {!selDim&&<div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center' }}>Choisissez une dimension X puis des métriques Y</div>}
        {selDim&&selMets.length===0&&<div style={{ fontSize:11, color:'var(--warning)', textAlign:'center' }}><strong style={{ color:'var(--text-primary)' }}>{selDim.label}</strong> sélectionné · choisissez les métriques Y ↑</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════════
const SK  = 'statistiques_galerie_v1';
const SKU = 'statistiques_galerie_user_v1';
function loadCharts()  { try { if(!localStorage.getItem(SKU)) return null; const s=localStorage.getItem(SK); return s?JSON.parse(s):null; } catch { return null; } }
function saveCharts(c) { try { localStorage.setItem(SK,JSON.stringify(c)); } catch {} }
function markUser()    { try { localStorage.setItem(SKU,'1'); } catch {} }

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function StatistiquesPage() {
  const [kpi,setKpi]=useState(null); const [kpiLoad,setKpiLoad]=useState(true);
  const [charts,setCharts]=useState(()=>loadCharts()||[]);
  const [filters,setFilters]=useState({ annee:CURRENT_YEAR, sexe:'all' });
  const [tab,setTab]=useState('galerie');

  useEffect(()=>{ saveCharts(charts); },[charts]);
  useEffect(()=>{
    setKpiLoad(true);
    statsApi.getKPI(filters).then(r=>setKpi(r)).catch(()=>setKpi(null)).finally(()=>setKpiLoad(false));
  },[filters.annee, filters.sexe]);

  const addChart    = useCallback(c=>{ markUser(); setCharts(prev=>[c,...prev].slice(0,50)); setTab('galerie'); },[]);
  const removeChart = useCallback(id=>{ markUser(); setCharts(prev=>prev.filter(c=>c.id!==id)); },[]);

  useEffect(()=>{
    if (loadCharts()) return;
    const ids=['cancer_count','cancer_sexe','cancer_stade','stade_count','stade_evolution','monthly_cas','annuel_tendance','wilaya_cas','survival','age_count'];
    setCharts(ids.map((id,i)=>{ const s=SOURCE_CATALOG.find(x=>x.id===id); if(!s) return null;
      return { id:i+1, label:s.label, endpoint:s.endpoint, cat:s.cat, xKey:s.xKey, yKeys:s.yKeys, chartType:s.chart, palette:Object.keys(PALETTES)[i%5] };
    }).filter(Boolean));
  },[]);

  const KPI_FIELDS = kpi?[
    { label:'Total cas enregistrés', value:kpi.total_cas_annee?.toLocaleString('fr-FR'), sub:`Année ${filters.annee}`,   color:'#00a8ff', trend:kpi.variation_vs_n1  },
    { label:'Taux de survie 5 ans',  value:`${kpi.taux_survie_5ans??'—'}%`,              sub:'Moyenne tous cancers',      color:'#00e5a0', trend:null                 },
    { label:'Âge médian diagnostic', value:kpi.age_median?`${kpi.age_median} ans`:'—',  sub:'Au moment du diagnostic',  color:'#f5a623', trend:null                 },
    { label:'Taux de mortalité',     value:kpi.taux_mortalite?.toLocaleString('fr-FR'), sub:'Décès recensés',            color:'#ff4d6a', trend:kpi.variation_mort_n1 },
  ]:[];

  return (
    <AppLayout title="Statistiques & Analyses">
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fadeUp .4s ease' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:2 }}>
              Statistiques & Analyses
            </h1>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>
              Année {filters.annee} · {charts.length} graphique{charts.length>1?'s':''} actif{charts.length>1?'s':''}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'12px 16px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8 }}>Année</div>
          {YEAR_OPTIONS.map(y=><Btn key={y} small active={filters.annee===y} onClick={()=>setFilters(p=>({...p,annee:y}))}>{y}</Btn>)}
          <div style={{ width:1, height:20, background:'var(--border-light)' }}/>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.8 }}>Sexe</div>
          {[['all','Tous'],['M','Masculin'],['F','Féminin']].map(([v,l])=>(
            <Btn key={v} small active={filters.sexe===v} onClick={()=>setFilters(p=>({...p,sexe:v}))}>{l}</Btn>
          ))}
        </div>

        {/* KPI Row */}
        {kpiLoad?(
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[...Array(4)].map((_,i)=><div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', height:100, opacity:.5 }}/>)}
          </div>
        ):(
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {KPI_FIELDS.map((k,i)=><KPICard key={i} {...k}/>)}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border-light)' }}>
          {[['galerie',`Galerie (${charts.length})`],['sources','Ajouter des graphiques']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 22px', background:'none', border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, color:tab===id?'var(--accent)':'var(--text-muted)',
              borderBottom:tab===id?'2px solid var(--accent)':'2px solid transparent',
              marginBottom:-1, transition:'all .15s' }}>{lbl}</button>
          ))}
          {charts.length>0&&tab==='galerie'&&(
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', paddingBottom:8 }}>
              <button onClick={()=>{ setCharts([]); localStorage.removeItem(SK); localStorage.removeItem(SKU); }}
                style={{ background:'transparent', border:'1px solid var(--danger)', color:'var(--danger)',
                  borderRadius:'var(--radius-sm)', padding:'4px 12px', fontSize:11, cursor:'pointer' }}>
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Tab Sources */}
        {tab==='sources'&&(
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <SourceSelector onAdd={addChart} filters={filters}/>
              <CustomChartBuilder onAdd={addChart}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <SectionCard title="Génération IA" sub="Claude analyse vos données épidémiologiques" accentColor="#9b8afb">
                  <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7, margin:'0 0 10px' }}>
                    Le bouton <strong style={{ color:'#9b8afb' }}>Générer par IA</strong> sélectionne automatiquement les graphiques les plus pertinents.
                  </p>
                  {["Analyse l'incidence et la mortalité par type","Détecte les anomalies de stade (IV élevé)","Identifie les disparités géographiques","Score de pertinence pour chaque graphique"].map((t,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:4 }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:'#9b8afb', marginTop:5, flexShrink:0 }}/>
                      <span style={{ fontSize:11.5, color:'var(--text-secondary)' }}>{t}</span>
                    </div>
                  ))}
                </SectionCard>
                <SectionCard title="Export par graphique" accentColor="var(--success)">
                  <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7, margin:0 }}>
                    Chaque graphique dispose d'une barre <strong style={{ color:'var(--success)' }}>Télécharger</strong> (CSV / PDF / Word) disponible dès le chargement des données, et d'un rapport IA enrichi exportable via le bouton <strong style={{ color:'var(--success)' }}>Analyser</strong>.
                  </p>
                </SectionCard>
              </div>
              <SectionCard title="Ajout rapide" accentColor="var(--info)">
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { label:'Vue Cancer complète',   ids:['cancer_count','cancer_sexe','cancer_stade'] },
                    { label:'Analyse géographique',  ids:['wilaya_cas','wilaya_cancer']               },
                    { label:'Tendances temporelles', ids:['monthly_cas','survival']                   },
                    { label:'Distribution clinique', ids:['stade_count','age_count','age_stade']      },
                  ].map(({ label, ids })=>(
                    <button key={label} onClick={()=>ids.forEach(id=>{ const s=SOURCE_CATALOG.find(x=>x.id===id);
                      if(s) addChart({ id:Date.now()+Math.random(), label:s.label, endpoint:s.endpoint, cat:s.cat, xKey:s.xKey, yKeys:s.yKeys, chartType:s.chart, palette:'ocean' }); })}
                      style={{ padding:'10px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg-elevated)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .12s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--border-focus)'; e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.color='var(--text-secondary)'; }}
                    >
                      <span>{label}</span>
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>{ids.length} graphiques →</span>
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* Tab Galerie */}
        {tab==='galerie'&&(
          charts.length===0?(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'64px 24px', gap:14, border:'1px dashed var(--border-light)',
              borderRadius:'var(--radius-md)', color:'var(--text-muted)' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text-secondary)' }}>Galerie vide</div>
              <div style={{ fontSize:12 }}>Ajoutez des graphiques depuis l'onglet Sources</div>
              <Btn onClick={()=>setTab('sources')} color="var(--accent)">Ajouter des graphiques</Btn>
            </div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{charts.length} graphique{charts.length>1?'s':''}</span>
                <span style={{ fontSize:10, color:'var(--text-muted)' }}>· données en direct depuis la base</span>
                <div style={{ marginLeft:'auto' }}>
                  <Btn small onClick={()=>setTab('sources')} color="var(--accent)">+ Nouveau graphique</Btn>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:16 }}>
                {charts.map(ch=><ChartCard key={ch.id} chart={ch} filters={filters} onRemove={()=>removeChart(ch.id)}/>)}
              </div>
            </div>
          )
        )}

      </div>
    </AppLayout>
  );
}
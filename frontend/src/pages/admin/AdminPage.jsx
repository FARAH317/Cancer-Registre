import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { AppLayout } from '../../components/layout/Sidebar';
import {
 BarChart, Bar, AreaChart, Area, XAxis, YAxis,
 CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import toast from 'react-hot-toast';

// ── Constantes ────────────────────────────────────────────────────
const ROLE_CFG = {
 admin: { color:'#ff4d6a', label:'Administrateur' },
 doctor: { color:'#00a8ff', label:'Médecin Oncologue' },
 registrar: { color:'#9b8afb', label:'Enregistreur' },
 epidemiologist: { color:'#00e5a0', label:'Épidémiologiste' },
 analyst: { color:'#f5a623', label:'Analyste' },
 readonly: { color:'#6b7280', label:'Lecture seule' } };
const ACTION_CFG = {
 login: { color:'#00e5a0' }, logout: { color:'#6b7280' },
 view: { color:'#00a8ff' }, create: { color:'#9b8afb' },
 update: { color:'#f5a623' }, delete: { color:'#ff4d6a' },
 export: { color:'#fb923c' }, report: { color:'#38bdf8' },
 import: { color:'#a78bfa' } };
const C = ['#00a8ff','#9b8afb','#00e5a0','#f5a623','#ff4d6a','#c084fc','#38bdf8','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div style={{ background:'#0f1420', border:'1px solid #1e2a3a', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
 {label && <div style={{ color:'#9ca3af', marginBottom:4, fontWeight:600 }}>{label}</div>}
 {payload.map((p,i) => <div key={i} style={{ color:p.color||'#e2e8f0' }}>{p.name||'Valeur'} : <b>{p.value}</b></div>)}
 </div>
 );
};

// ── Composants ─────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
 return (
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'14px 18px' }}>
 <div style={{ fontSize:26, fontWeight:800, fontFamily:'var(--font-display)', color, marginBottom:2 }}>{value ?? '—'}</div>
 <div style={{ fontSize:11, color:'var(--text-muted)' }}>{label}</div>
 {sub && <div style={{ fontSize:10, color, marginTop:3 }}>{sub}</div>}
 </div>
 );
}

function RoleBadge({ role }) {
 const cfg = ROLE_CFG[role] || { color:'#9ca3af', label:role };
 return (
 <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:`${cfg.color}15`, color:cfg.color, border:`1px solid ${cfg.color}25` }}>
 {cfg.label}
 </span>
 );
}

function ActionBadge({ action, label }) {
 const cfg = ACTION_CFG[action] || { color:'#9ca3af' };
 return (
 <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:`${cfg.color}12`, color:cfg.color, border:`1px solid ${cfg.color}20` }}>
 {label}
 </span>
 );
}

// ─────────────────────────────────────────────────────────────────
// SECTION UTILISATEURS
// ─────────────────────────────────────────────────────────────────

function SectionUsers() {
 const [users, setUsers] = useState([]);
 const [stats, setStats] = useState(null);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [roleFilter, setRole] = useState('');
 const [activeFilter, setActive] = useState('');
 const [selected, setSelected] = useState(null); // user detail modal
 const [editMode, setEditMode] = useState(false);
 const [editData, setEditData] = useState({});
 const [saving, setSaving] = useState(false);
 const [resetPwd, setResetPwd] = useState('');
 const [showResetModal, setShowResetModal] = useState(null);

 const fetchUsers = useCallback(async () => {
 setLoading(true);
 try {
 const params = {};
 if (search) params.search = search;
 if (roleFilter) params.role = roleFilter;
 if (activeFilter) params.is_active= activeFilter;
 const { data } = await adminService.users.list(params);
 setUsers(data.results || data);
 } catch { toast.error('Erreur chargement'); }
 finally { setLoading(false); }
 }, [search, roleFilter, activeFilter]);

 useEffect(() => { fetchUsers(); }, [fetchUsers]);
 useEffect(() => { adminService.users.stats().then(({ data }) => setStats(data)).catch(() => {}); }, []);

 const handleAction = async (action, userId, extra) => {
 try {
 if (action === 'activer') await adminService.users.activer(userId);
 if (action === 'desactiver') await adminService.users.desactiver(userId);
 if (action === 'resetPwd') await adminService.users.resetPassword(userId, extra);
 if (action === 'setRole') await adminService.users.setRole(userId, extra);
 toast.success('Action effectuée !');
 fetchUsers();
 if (selected?.id === userId) {
 const { data } = await adminService.users.get(userId);
 setSelected(data);
 }
 } catch (err) {
 toast.error(err.response?.data?.error || 'Erreur');
 }
 };

 const handleSaveEdit = async () => {
 setSaving(true);
 try {
 await adminService.users.update(selected.id, editData);
 toast.success('Modifications enregistrées !');
 fetchUsers();
 const { data } = await adminService.users.get(selected.id);
 setSelected(data);
 setEditMode(false);
 } catch (err) {
 toast.error(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Erreur');
 } finally { setSaving(false); }
 };

 return (
 <div>
 {/* Stats */}
 {stats && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
 <StatCard label="Utilisateurs total" value={stats.total} color="#00a8ff" />
 <StatCard label="Comptes actifs" value={stats.actifs} color="#00e5a0" />
 <StatCard label="En attente" value={stats.inactifs} color="#f5a623" />
 <StatCard label="Connectés (7j)" value={stats.connectes_7j} color="#9b8afb" />
 </div>
 )}

 {/* Rôles distribution */}
 {stats?.par_role && (
 <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
 {stats.par_role.map(r => {
 const cfg = ROLE_CFG[r.role] || { color:'#9ca3af', label:r.role };
 return (
 <div key={r.role} onClick={() => setRole(roleFilter === r.role ? '' : r.role)}
 style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, cursor:'pointer',
 background: roleFilter===r.role ? `${cfg.color}20` : 'var(--bg-card)',
 border:`1px solid ${roleFilter===r.role ? cfg.color+'40' : 'var(--border-light)'}`,
 color:cfg.color, fontSize:12, fontWeight:500 }}>
 {cfg.label} <span style={{ fontFamily:'var(--font-mono)', fontSize:11 }}>({r.n})</span>
 </div>
 );
 })}
 </div>
 )}

 {/* Toolbar */}
 <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
 <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'7px 12px' }}>
 <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, email, username..."
 style={{ background:'none', border:'none', outline:'none', flex:1, fontSize:12.5, color:'var(--text-primary)', fontFamily:'var(--font-body)' }} />
 </div>
 <select value={activeFilter} onChange={e => setActive(e.target.value)} style={selSt}>
 <option value="">Tous les statuts</option>
 <option value="true">Actifs</option>
 <option value="false">Inactifs</option>
 </select>
 {(search || roleFilter || activeFilter) && (
 <button onClick={() => { setSearch(''); setRole(''); setActive(''); }}
 style={{ padding:'6px 12px', background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.2)', borderRadius:8, color:'#ff4d6a', fontSize:11, cursor:'pointer' }}>
 Reset
 </button>
 )}
 </div>

 {/* Table */}
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
 {loading ? (
 <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>
 <div style={{ width:28, height:28, border:'3px solid var(--border)', borderTopColor:'#00a8ff', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
 Chargement...
 </div>
 ) : (
 <table style={{ width:'100%', borderCollapse:'collapse' }}>
 <thead>
 <tr style={{ background:'var(--bg-elevated)' }}>
 {['Utilisateur','Rôle','Institution','Wilaya','Statut','Dernière connexion','Actions'].map(h => (
 <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {users.map((u, i) => (
 <tr key={u.id}
 style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)', cursor:'pointer' }}
 onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
 onMouseLeave={e => e.currentTarget.style.background=i%2===0?'transparent':'rgba(255,255,255,0.01)'}
 onClick={() => { setSelected(u); setEditMode(false); setEditData({}); }}
 >
 <td style={{ padding:'11px 14px' }}>
 <div style={{ display:'flex', alignItems:'center', gap:10 }}>
 <div style={{ width:32, height:32, borderRadius:'50%', background:`${ROLE_CFG[u.role]?.color||'#9ca3af'}20`, border:`1px solid ${ROLE_CFG[u.role]?.color||'#9ca3af'}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
 {(u.role || 'U')[0].toUpperCase()}
 </div>
 <div>
 <div style={{ fontWeight:700, fontSize:13, color:'var(--text-primary)' }}>{u.full_name || u.username}</div>
 <div style={{ fontSize:10, color:'var(--text-muted)' }}>{u.email}</div>
 </div>
 </div>
 </td>
 <td style={{ padding:'11px 14px' }}><RoleBadge role={u.role} /></td>
 <td style={{ padding:'11px 14px', fontSize:12, color:'var(--text-secondary)', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.institution || '—'}</td>
 <td style={{ padding:'11px 14px', fontSize:12, color:'var(--text-muted)' }}>{u.wilaya || '—'}</td>
 <td style={{ padding:'11px 14px' }}>
 <span style={{ fontSize:11, fontWeight:600, color: u.is_active ? '#00e5a0' : '#f5a623' }}>
 {u.is_active ? '● Actif' : '○ Inactif'}
 </span>
 </td>
 <td style={{ padding:'11px 14px', fontSize:11, color:'var(--text-muted)' }}>{u.last_login_str}</td>
 <td style={{ padding:'11px 14px' }} onClick={e => e.stopPropagation()}>
 <div style={{ display:'flex', gap:5 }}>
 {!u.is_active ? (
 <BtnTiny color="#00e5a0" onClick={() => handleAction('activer', u.id)}> Activer</BtnTiny>
 ) : (
 <BtnTiny color="#f5a623" onClick={() => handleAction('desactiver', u.id)}>⊘ Désact.</BtnTiny>
 )}
 <BtnTiny color="#9b8afb" onClick={() => { setShowResetModal(u); setResetPwd(''); }}></BtnTiny>
 </div>
 </td>
 </tr>
 ))}
 {users.length === 0 && (
 <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Aucun utilisateur trouvé</td></tr>
 )}
 </tbody>
 </table>
 )}
 </div>

 {/* Detail Modal */}
 {selected && (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
 {/* Header */}
 <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
 <div style={{ display:'flex', alignItems:'center', gap:12 }}>
 <div style={{ width:42, height:42, borderRadius:'50%', background:`${ROLE_CFG[selected.role]?.color||'#9ca3af'}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
 {(selected.role || 'U')[0].toUpperCase()}
 </div>
 <div>
 <div style={{ fontWeight:800, fontSize:15, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>{selected.full_name || selected.username}</div>
 <div style={{ fontSize:11, color:'var(--text-muted)' }}>{selected.email}</div>
 </div>
 </div>
 <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:22, cursor:'pointer', padding:'0 6px', lineHeight:1 }}>×</button>
 </div>

 <div style={{ padding:'20px 24px' }}>
 {!editMode ? (
 <>
 {/* Info grid */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px', marginBottom:18 }}>
 {[
 ['Rôle', <RoleBadge role={selected.role} />],
 ['Statut', <span style={{ color: selected.is_active ? '#00e5a0' : '#f5a623', fontWeight:600, fontSize:12 }}>{selected.is_active ? '● Actif' : '○ Inactif'}</span>],
 ['Username', selected.username],
 ['Téléphone', selected.phone || '—'],
 ['Institution',selected.institution || '—'],
 ['Wilaya', selected.wilaya || '—'],
 ['Inscrit le', selected.date_joined ? new Date(selected.date_joined).toLocaleDateString('fr-DZ') : '—'],
 ['Actions', <span style={{ fontFamily:'var(--font-mono)', color:'#9b8afb' }}>{selected.nb_actions}</span>],
 ].map(([label, val]) => (
 <div key={label} style={{ padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
 <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{label}</div>
 <div style={{ fontSize:12.5, color:'var(--text-primary)' }}>{val}</div>
 </div>
 ))}
 </div>

 {/* Permissions */}
 <div style={{ marginBottom:18 }}>
 <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Permissions</div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
 {[
 ['Voir patients', selected.can_view_patients],
 ['Modifier patients', selected.can_edit_patients],
 ['Exporter données', selected.can_export_data],
 ['Gérer utilisateurs', selected.can_manage_users],
 ['Voir statistiques', selected.can_view_statistics],
 ].map(([perm, val]) => (
 <div key={perm} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:6, background:`${val ? '#00e5a0' : '#ff4d6a'}08`, border:`1px solid ${val ? '#00e5a0' : '#ff4d6a'}15` }}>
 <span style={{ color: val ? '#00e5a0' : '#ff4d6a', fontSize:12 }}>{val ? '' : ''}</span>
 <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{perm}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Changer rôle rapide */}
 <div style={{ marginBottom:18 }}>
 <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 }}>Changer le rôle</div>
 <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
 {Object.entries(ROLE_CFG).map(([role, cfg]) => (
 <button key={role}
 onClick={() => handleAction('setRole', selected.id, role)}
 style={{ padding:'5px 10px', borderRadius:20, fontSize:11, cursor:'pointer', fontWeight: selected.role === role ? 700 : 400,
 background: selected.role === role ? `${cfg.color}25` : 'var(--bg-elevated)',
 border:`1px solid ${selected.role === role ? cfg.color : 'var(--border)'}`,
 color: selected.role === role ? cfg.color : 'var(--text-secondary)' }}>
 {cfg.label}
 </button>
 ))}
 </div>
 </div>

 {/* Actions */}
 <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:14, borderTop:'1px solid var(--border)' }}>
 <button onClick={() => { setEditMode(true); setEditData({ first_name: selected.first_name, last_name: selected.last_name, phone: selected.phone, institution: selected.institution, wilaya: selected.wilaya }); }}
 style={actionBtnSt('#00a8ff')}> Modifier</button>
 {!selected.is_active
 ? <button onClick={() => handleAction('activer', selected.id)} style={actionBtnSt('#00e5a0')}> Activer le compte</button>
 : <button onClick={() => handleAction('desactiver', selected.id)} style={actionBtnSt('#f5a623')}>⊘ Désactiver</button>
 }
 <button onClick={() => { setShowResetModal(selected); setResetPwd(''); setSelected(null); }} style={actionBtnSt('#9b8afb')}> Réinitialiser MDP</button>
 </div>
 </>
 ) : (
 /* Edit form */
 <div>
 <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}> Modifier les informations</div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
 {[
 ['Prénom', 'first_name', 'text'],
 ['Nom', 'last_name', 'text'],
 ['Téléphone', 'phone', 'text'],
 ['Institution', 'institution','text'],
 ['Wilaya', 'wilaya', 'text'],
 ].map(([label, field, type]) => (
 <div key={field} style={{ marginBottom:12 }}>
 <label style={{ display:'block', fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</label>
 <input type={type} value={editData[field] || ''} onChange={e => setEditData(p => ({...p, [field]: e.target.value}))} style={inputSt} />
 </div>
 ))}
 </div>
 <div style={{ display:'flex', gap:8, marginTop:16 }}>
 <button onClick={() => setEditMode(false)} style={{ flex:'0 0 90px', padding:'10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }}>Annuler</button>
 <button onClick={handleSaveEdit} disabled={saving} style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#00a8ff,#0080cc)', border:'none', borderRadius:8, color:'#fff', fontSize:12.5, fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
 {saving ? 'Enregistrement...' : 'Sauvegarder'}
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Reset password modal */}
 {showResetModal && (
 <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }}>
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'24px 28px', width:'100%', maxWidth:400 }}>
 <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}> Réinitialiser le mot de passe</div>
 <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>Pour : <strong style={{ color:'#9b8afb' }}>{showResetModal.full_name || showResetModal.username}</strong></div>
 <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)}
 placeholder="Nouveau mot de passe (min. 8 caractères)"
 style={{ ...inputSt, marginBottom:16, width:'100%', boxSizing:'border-box' }} />
 <div style={{ display:'flex', gap:8 }}>
 <button onClick={() => setShowResetModal(null)} style={{ flex:'0 0 80px', padding:'10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }}>Annuler</button>
 <button onClick={async () => {
 if (resetPwd.length < 8) { toast.error('Min. 8 caractères'); return; }
 await handleAction('resetPwd', showResetModal.id, resetPwd);
 setShowResetModal(null);
 }} style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#9b8afb,#7c6fcd)', border:'none', borderRadius:8, color:'#fff', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
 Confirmer
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// ─────────────────────────────────────────────────────────────────
// SECTION AUDIT LOGS
// ─────────────────────────────────────────────────────────────────

function SectionAudit() {
 const [logs, setLogs] = useState([]);
 const [stats, setStats] = useState(null);
 const [loading, setLoad] = useState(true);
 const [action, setAction]= useState('');
 const [dateFrom, setDF] = useState('');
 const [dateTo, setDT] = useState('');

 const fetchLogs = useCallback(async () => {
 setLoad(true);
 try {
 const params = { page_size: 50 };
 if (action) params.action = action;
 if (dateFrom) params.date_from = dateFrom;
 if (dateTo) params.date_to = dateTo;
 const { data } = await adminService.audit.list(params);
 setLogs(data.results || data);
 } catch {} finally { setLoad(false); }
 }, [action, dateFrom, dateTo]);

 useEffect(() => { fetchLogs(); }, [fetchLogs]);
 useEffect(() => { adminService.audit.stats().then(({ data }) => setStats(data)).catch(() => {}); }, []);

 return (
 <div>
 {/* Stats */}
 {stats && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
 <StatCard label="Logs total" value={stats.total?.toLocaleString()} color="#9b8afb" />
 <StatCard label="Aujourd'hui" value={stats.aujourd_hui} color="#00a8ff" />
 <StatCard label="Cette semaine" value={stats.cette_semaine} color="#00e5a0" />
 <StatCard label="Ce mois" value={stats.ce_mois} color="#f5a623" />
 </div>
 )}

 {/* Graphique activité 7j */}
 {stats?.activite_7j && (
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginBottom:20 }}>
 <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Activité — 7 derniers jours</div>
 <ResponsiveContainer width="100%" height={100}>
 <AreaChart data={stats.activite_7j} margin={{top:0,right:0,bottom:0,left:-30}}>
 <defs>
 <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#9b8afb" stopOpacity={0.35} />
 <stop offset="95%" stopColor="#9b8afb" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
 <XAxis dataKey="date" tick={{fill:'#6b7280',fontSize:9}} axisLine={false} tickLine={false} tickFormatter={d => d.slice(5)} />
 <YAxis tick={{fill:'#6b7280',fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false} />
 <Tooltip content={<CustomTooltip />} />
 <Area type="monotone" dataKey="count" name="Actions" stroke="#9b8afb" fill="url(#gA)" strokeWidth={2} dot={false} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* Top actions & ressources */}
 {stats && (
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'14px 16px' }}>
 <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Par type d'action</div>
 {stats.par_action.map((a, i) => {
 const cfg = ACTION_CFG[a.action] || { color:'#9ca3af' };
 return (
 <div key={a.action} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
 <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}>{cfg.icon} {a.action}</span>
 <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:cfg.color }}>{a.n}</span>
 </div>
 );
 })}
 </div>
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'14px 16px' }}>
 <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 }}>Utilisateurs les plus actifs</div>
 {(stats.top_users || []).map((u, i) => {
 const nom = `${u.user__first_name || ''} ${u.user__last_name || ''}`.trim() || u.user__username || '?';
 return (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
 <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{nom}</span>
 <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#9b8afb' }}>{u.n}</span>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Filtres */}
 <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
 <select value={action} onChange={e => setAction(e.target.value)} style={selSt}>
 <option value="">Toutes les actions</option>
 {Object.entries(ACTION_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {k}</option>)}
 </select>
 <input type="date" value={dateFrom} onChange={e => setDF(e.target.value)} style={selSt} />
 <span style={{ fontSize:11, color:'var(--text-muted)' }}>→</span>
 <input type="date" value={dateTo} onChange={e => setDT(e.target.value)} style={selSt} />
 {(action || dateFrom || dateTo) && (
 <button onClick={() => { setAction(''); setDF(''); setDT(''); }} style={{ padding:'6px 12px', background:'rgba(255,77,106,0.1)', border:'1px solid rgba(255,77,106,0.2)', borderRadius:8, color:'#ff4d6a', fontSize:11, cursor:'pointer' }}> Reset</button>
 )}
 </div>

 {/* Table logs */}
 <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
 {loading ? (
 <div style={{ padding:36, textAlign:'center', color:'var(--text-muted)' }}>
 <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'#9b8afb', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 8px' }} />
 </div>
 ) : (
 <table style={{ width:'100%', borderCollapse:'collapse' }}>
 <thead>
 <tr style={{ background:'var(--bg-elevated)' }}>
 {['Horodatage','Utilisateur','Action','Ressource','IP'].map(h => (
 <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {logs.map((log, i) => (
 <tr key={log.id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
 <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
 {new Date(log.timestamp).toLocaleString('fr-DZ', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
 </td>
 <td style={{ padding:'9px 12px' }}>
 <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{log.user_nom}</div>
 <div style={{ fontSize:10, color:'var(--text-muted)' }}>{log.user_role}</div>
 </td>
 <td style={{ padding:'9px 12px' }}><ActionBadge action={log.action} label={log.action_label} /></td>
 <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>
 {log.resource}{log.resource_id ? `#${log.resource_id}` : ''}
 </td>
 <td style={{ padding:'9px 12px', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{log.ip_address || '—'}</td>
 </tr>
 ))}
 {logs.length === 0 && (
 <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>Aucun log trouvé</td></tr>
 )}
 </tbody>
 </table>
 )}
 </div>
 </div>
 );
}

// ─────────────────────────────────────────────────────────────────
// SECTION SYSTÈME
// ─────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
 const [tab, setTab] = useState('users');

 const TABS = [
 { key:'users', label:'Utilisateurs', color:'#00a8ff' },
 { key:'audit', label:'Audit Logs', color:'#9b8afb' },
 ];

 return (
 <AppLayout title="Administration">
 <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
 <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,77,106,0.12)', border:'1px solid rgba(255,77,106,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#ff4d6a' }}>ADM</div>
 <div>
 <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--text-primary)', marginBottom:2 }}>Panneau d'administration</h2>
 <p style={{ fontSize:11, color:'var(--text-muted)' }}>Gestion des utilisateurs · Audit logs · Informations système</p>
 </div>
 </div>

 {/* Tabs */}
 <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'var(--radius-md)', overflow:'hidden', marginBottom:20 }}>
 {TABS.map(t => (
 <button key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, padding:'12px', background:'none', border:'none', borderBottom:`2px solid ${tab===t.key ? t.color : 'transparent'}`, color:tab===t.key ? t.color : 'var(--text-muted)', fontSize:13, fontWeight:tab===t.key ? 600 : 400, cursor:'pointer', fontFamily:'var(--font-body)', transition:'color 0.15s' }}>
 {t.label}
 </button>
 ))}
 </div>

 {tab === 'users'&& <SectionUsers />}
 {tab === 'audit'&& <SectionAudit />}
 </AppLayout>
 );
}

// ── Styles & helpers ───────────────────────────────────────────────
function BtnTiny({ color, onClick, children }) {
 return (
 <button onClick={onClick} style={{ padding:'4px 8px', background:`${color}12`, border:`1px solid ${color}25`, borderRadius:6, color, fontSize:10, cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}
 onMouseEnter={e => e.currentTarget.style.background=`${color}22`}
 onMouseLeave={e => e.currentTarget.style.background=`${color}12`}
 >{children}</button>
 );
}
const actionBtnSt = (color) => ({ padding:'8px 14px', background:`${color}12`, border:`1px solid ${color}25`, borderRadius:8, color, fontSize:12, fontWeight:600, cursor:'pointer' });
const selSt = { padding:'7px 10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:12, outline:'none', cursor:'pointer' };
const inputSt = { width:'100%', padding:'8px 11px', background:'var(--bg-elevated)', border:'1px solid var(--border-light)', borderRadius:8, color:'var(--text-primary)', fontSize:12.5, outline:'none', fontFamily:'var(--font-body)', boxSizing:'border-box' };
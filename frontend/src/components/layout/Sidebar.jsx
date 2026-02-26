import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [
      { path: '/dashboard', label: 'Tableau de bord', icon: GridIcon },
      { path: '/patients',  label: 'Patients',         icon: UsersIcon },
    ]
  },
  {
    section: 'CLINIQUE',
    items: [
      { path: '/diagnostics', label: 'Diagnostics',  icon: MicroscopeIcon },
      { path: '/traitements', label: 'Traitements',  icon: PillIcon },
      { path: '/suivi',       label: 'Suivi clinique', icon: HeartIcon },
    ]
  },
  {
    section: 'ANALYSES',
    items: [
      { path: '/statistiques', label: 'Statistiques', icon: ChartIcon },
      { path: '/carte',        label: 'Carte SIG',     icon: MapIcon },
      { path: '/rcp',          label: 'RCP',           icon: CalendarIcon },
    ]
  },
  {
    section: 'SYSTÈME',
    items: [
      { path: '/admin', label: 'Administration', icon: SettingsIcon },
    ]
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <aside style={{
      width: 220,
      background: '#080d18',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00a8ff, #00e5c0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
              RegistreCancer
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8 }}>
              CIRC · OMS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{
              padding: '12px 16px 4px',
              fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
            }}>{section}</div>
            {items.map(({ path, label, icon: Icon }) => {
              const active = location.pathname.startsWith(path);
              return (
                <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px',
                    background: active ? 'rgba(0,168,255,0.12)' : 'transparent',
                    borderLeft: `2px solid ${active ? '#00a8ff' : 'transparent'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontSize: 12.5, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)', e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {isAuthenticated ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #00a8ff, #00e5c0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name || 'Utilisateur'}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {user?.role_display || ''}
                </div>
              </div>
            </div>
            <button onClick={logout} style={{
              width: '100%', padding: '7px',
              background: 'rgba(255,77,106,0.1)',
              border: '1px solid rgba(255,77,106,0.2)',
              borderRadius: 6, color: '#ff4d6a',
              fontSize: 11.5, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,106,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,77,106,0.1)'}
            >
              <LogoutIcon size={13} /> Déconnexion
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', padding: '7px',
                background: 'rgba(0,168,255,0.1)',
                border: '1px solid rgba(0,168,255,0.2)',
                borderRadius: 6, color: '#00a8ff',
                fontSize: 11.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                Connexion
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', padding: '7px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, color: 'rgba(255,255,255,0.5)',
                fontSize: 11.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                S'inscrire
              </button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export function AppLayout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 52, background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600,
            color: 'var(--text-primary)',
          }}>{title}</h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,168,255,0.2)',
            borderRadius: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              SYSTÈME EN LIGNE
            </span>
          </div>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Minimal SVG icons ─────────────────────────────────────────────
function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
}
function UsersIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function MicroscopeIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v11m0 0a5 5 0 005 5H6a5 5 0 005-5zm0 0V3m0 0h3M9 3H6m9 0v4m0-4h3m-3 0h-3" /></svg>;
}
function PillIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>;
}
function HeartIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
}
function ChartIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function MapIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
}
function CalendarIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function SettingsIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function LogoutIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}

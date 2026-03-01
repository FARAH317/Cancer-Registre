import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuth';

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [
      { path: '/dashboard', label: 'Tableau de bord', icon: GridIcon },
      { path: '/patients', label: 'Patients', icon: UsersIcon },
    ]
  },
  {
    section: 'CLINIQUE',
    items: [
      { path: '/diagnostics', label: 'Diagnostics', icon: MicroscopeIcon },
      { path: '/traitements', label: 'Traitements', icon: PillIcon },
      { path: '/suivi', label: 'Suivi clinique', icon: HeartIcon },
    ]
  },
  {
    section: 'ANALYSES',
    items: [
      { path: '/statistiques', label: 'Statistiques', icon: ChartIcon },
      { path: '/carte', label: 'Carte SIG', icon: MapIcon },
      { path: '/rcp', label: 'RCP', icon: CalendarIcon },
    ]
  },
  {
    section: 'SYSTÈME',
    items: [
      { path: '/exports', label: 'Rapports & Exports', icon: DownloadIcon },
      { path: '/administration', label: 'Administration', icon: SettingsIcon },
    ]
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
      <nav style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{
              padding: '12px 16px 4px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.2)',
              textTransform: 'uppercase',
            }}>
              {section}
            </div>

            {items.map(({ path, label, icon: Icon }) => {
              const active = location.pathname.startsWith(path);
              return (
                <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    background: active ? 'rgba(0,168,255,0.12)' : 'transparent',
                    borderLeft: `2px solid ${active ? '#00a8ff' : 'transparent'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={15} />
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={logout} style={{
          width: '100%',
          padding: '7px',
          background: 'rgba(255,77,106,0.1)',
          border: '1px solid rgba(255,77,106,0.2)',
          borderRadius: 6,
          color: '#ff4d6a',
          fontSize: 11.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <LogoutIcon size={13} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}

export function AppLayout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1 }}>
        <div style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #eee'
        }}>
          <h1 style={{ fontSize: 15 }}>{title}</h1>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ================= ICONS ================= */

function GridIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}

function UsersIcon({ size = 16 }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="9" cy="7" r="4" /><circle cx="17" cy="7" r="4" /><path d="M2 21c0-4 4-7 7-7s7 3 7 7" /></svg>;
}

function MicroscopeIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M6 21h12M12 3v12" /></svg>;
}

function PillIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><rect x="3" y="8" width="18" height="8" rx="4" /></svg>;
}

function HeartIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M12 21s-8-6-8-11a5 5 0 0110 0 5 5 0 0110 0c0 5-8 11-8 11z" /></svg>;
}

function ChartIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M4 19V5M10 19V9M16 19v-6M22 19V3" /></svg>;
}

function MapIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /></svg>;
}

function CalendarIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" /></svg>;
}

function SettingsIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><circle cx="12" cy="12" r="3" /></svg>;
}

function DownloadIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>;
}

function LogoutIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
}
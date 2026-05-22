import { Outlet, NavLink, useLocation } from "react-router-dom";
import { BookOpen, Clock3, FileScan, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme.jsx";

const navItems = [
  { to: "/", label: "Upload", icon: FileScan },
  { to: "/results", label: "Results", icon: ShieldCheck },
  { to: "/history", label: "History", icon: Clock3 },
  { to: "/help", label: "Help", icon: BookOpen }
];

function AppLayout() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="brand-lockup" aria-label="Passport Extraction System">
          <span className="brand-mark" aria-hidden="true">
            PE
          </span>
          <div>
            <strong>Passport Extraction System</strong>
            <span>Client-side OCR workspace</span>
          </div>
        </div>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink className="nav-link" key={to} to={to} end={to === "/"}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="icon-text-button theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark mode">
          {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      </header>

      <main id="main-content" className="main-content" data-route={location.pathname}>
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink className="mobile-nav-link" key={to} to={to} end={to === "/"}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AppLayout;

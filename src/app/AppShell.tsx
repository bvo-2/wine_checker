import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { TopBar } from './TopBar';
import styles from './AppShell.module.css';

export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip} onClick={focusMain}>
        Skip to content
      </a>
      <TopBar />
      <main id="main" tabIndex={-1} className={styles.main}>
        {/* Keyed by path so a crash on one screen clears when navigating away. */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className={styles.footer}>
        <p className="t-caption-sm">Decant · Your data stays on this device. Drink responsibly.</p>
      </footer>
    </div>
  );
}

/** With hash routing, "#main" would be read as a route; move focus by hand instead. */
function focusMain(event: React.MouseEvent) {
  event.preventDefault();
  document.getElementById('main')?.focus();
}

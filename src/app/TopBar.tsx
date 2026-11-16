import { useState } from 'react';
import { Link, NavLink, useHref, useLocation, useNavigate } from 'react-router-dom';
// A 96px copy (2x of the 48px mark) of docs/design/decant-logo.png, resized only.
import logoUrl from '../assets/decant-logo-96.png';
import { ButtonLink } from '../components/Button/Button';
import { Icon } from '../components/Icon/Icon';
import { IconButton, IconButtonLink } from '../components/IconButton/IconButton';
import { Modal } from '../components/Modal/Modal';
import { ProductTabs } from '../components/ProductTabs/ProductTabs';
import { activeTabId, PRODUCT_TABS } from './nav';
import styles from './AppShell.module.css';

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // useHref gives the address as the router writes it ("#/wineries" with hash routing).
  const base = useHref('/');
  const tabs = PRODUCT_TABS.map((tab) => ({
    ...tab,
    href: tab.path === '/' ? base : `${base.replace(/\/$/, '')}${tab.path}`,
  }));
  const close = () => setMenuOpen(false);

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <Link to="/" className={styles.brand} aria-label="Decant, home">
          <img src={logoUrl} alt="" width={48} height={48} className={styles.logo} />
          <span>Decant</span>
        </Link>
        {/* Below 744px the tabs live in the menu sheet instead. */}
        <div className={styles.tabs}>
          <ProductTabs
            tabs={tabs}
            active={activeTabId(pathname)}
            label="Sections"
            onChange={(id) => navigate(PRODUCT_TABS.find((tab) => tab.id === id)?.path ?? '/')}
          />
        </div>
        <div className={styles.actions}>
          <ButtonLink to="/wines/new" variant="secondary" className={styles.wideOnly}>
            Add a wine
          </ButtonLink>
          <IconButtonLink
            to="/wines/new"
            icon="plus"
            label="Add a wine"
            variant="outline"
            className={styles.narrowOnly}
          />
          <IconButton
            icon="menu"
            label="Open menu"
            variant="outline"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </div>

      <Modal open={menuOpen} onClose={close} title="Menu" variant="sheet">
        <nav aria-label="Menu" className={styles.menu}>
          {PRODUCT_TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              end={tab.path === '/'}
              onClick={close}
              className={styles.menuLink}
            >
              {tab.label}
              <Icon name="chevron" size={16} />
            </NavLink>
          ))}
          <NavLink to="/wines/new" onClick={close} className={styles.menuLink}>
            Add a wine
            <Icon name="chevron" size={16} />
          </NavLink>
          <NavLink to="/backup" onClick={close} className={styles.menuLink}>
            Backup and restore
            <Icon name="chevron" size={16} />
          </NavLink>
        </nav>
      </Modal>
    </header>
  );
}

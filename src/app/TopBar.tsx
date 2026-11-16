import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
// A 96px copy (2x of the 48px mark) of docs/design/decant-logo.png, resized only.
import logoUrl from '../assets/decant-logo-96.png';
import { ButtonLink } from '../components/Button/Button';
import { IconButton, IconButtonLink } from '../components/IconButton/IconButton';
import { Modal } from '../components/Modal/Modal';
import { ProductTabs } from '../components/ProductTabs/ProductTabs';
import { Icon } from '../components/Icon/Icon';
import { PRODUCT_TABS } from './nav';
import styles from './AppShell.module.css';

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <Link to="/" className={styles.brand} aria-label="Decant, home">
          <img src={logoUrl} alt="" width={48} height={48} className={styles.logo} />
          <span>Decant</span>
        </Link>
        <div className={styles.desktopTabs}>
          <ProductTabs tabs={PRODUCT_TABS} />
        </div>
        <div className={styles.actions}>
          <ButtonLink to="/wines/new" className={styles.desktopOnly}>
            Add a wine
          </ButtonLink>
          <IconButtonLink
            to="/wines/new"
            icon="plus"
            label="Add a wine"
            variant="filled"
            className={styles.phoneOnly}
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
      <div className={styles.phoneTabs}>
        <ProductTabs tabs={PRODUCT_TABS} variant="compact" />
      </div>

      <Modal open={menuOpen} onClose={close} title="Menu" variant="sheet">
        <nav aria-label="Menu" className={styles.menu}>
          <NavLink to="/wines/new" onClick={close} className={styles.menuLink}>
            Add a wine
            <Icon name="chevron" size={16} />
          </NavLink>
          {PRODUCT_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              onClick={close}
              className={styles.menuLink}
            >
              {tab.label === 'Wines' ? 'My cellar' : tab.label}
              <Icon name="chevron" size={16} />
            </NavLink>
          ))}
          <NavLink to="/backup" onClick={close} className={styles.menuLink}>
            Backup and restore
            <Icon name="chevron" size={16} />
          </NavLink>
        </nav>
      </Modal>
    </header>
  );
}

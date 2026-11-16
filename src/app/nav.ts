import type { ProductTab } from '../components/ProductTabs/ProductTabs';

/** The five product tabs, in the design system's order, with their routes. */
export const PRODUCT_TABS: readonly (ProductTab & { path: string })[] = [
  { id: 'wines', label: 'Wines', path: '/' },
  { id: 'wineries', label: 'Wineries', path: '/wineries' },
  { id: 'regions', label: 'Regions', path: '/regions' },
  { id: 'countries', label: 'Countries', path: '/countries' },
  { id: 'tastings', label: 'Tastings', path: '/tastings' },
];

/** The tab a route belongs to. Wine pages belong to Wines; Backup belongs to none. */
export function activeTabId(pathname: string): string | undefined {
  if (pathname === '/' || pathname.startsWith('/wines')) return 'wines';
  return PRODUCT_TABS.find((tab) => tab.path !== '/' && pathname.startsWith(tab.path))?.id;
}

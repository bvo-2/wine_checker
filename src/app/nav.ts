import type { ProductTab } from '../components/ProductTabs/ProductTabs';

export const PRODUCT_TABS: readonly ProductTab[] = [
  { label: 'Wines', to: '/', end: true },
  { label: 'Wineries', to: '/wineries' },
  { label: 'Regions', to: '/regions' },
  { label: 'Countries', to: '/countries' },
  { label: 'Tastings', to: '/tastings' },
];

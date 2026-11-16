import type { GroupField } from '../domain/grouping';

/** How each "browse by" tab is worded and where it lives. */
export const GROUP_PAGES: Record<
  GroupField,
  { path: string; title: string; one: string; emptyText: string }
> = {
  producer: {
    path: '/wineries',
    title: 'Wineries',
    one: 'winery',
    emptyText: 'Wineries appear here once you add wines. Add a producer to a wine to group it.',
  },
  region: {
    path: '/regions',
    title: 'Regions',
    one: 'region',
    emptyText: 'Regions appear here once you add wines. Add a region to a wine to group it.',
  },
  country: {
    path: '/countries',
    title: 'Countries',
    one: 'country',
    emptyText: 'Countries appear here once you add wines. Add a country to a wine to group it.',
  },
};

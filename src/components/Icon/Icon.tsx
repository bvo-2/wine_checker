export type IconName =
  | 'heart'
  | 'heart-filled'
  | 'search'
  | 'share'
  | 'star'
  | 'star-filled'
  | 'back'
  | 'close'
  | 'alert'
  | 'plus'
  | 'menu'
  | 'edit'
  | 'trash'
  | 'download'
  | 'upload'
  | 'check'
  | 'chevron';

const PATHS: Record<IconName, string> = {
  heart:
    'M16 27s-11-6.6-11-14.2C5 8.5 8 6 11.3 6c2.2 0 3.8 1.2 4.7 2.8C16.9 7.2 18.5 6 20.7 6 24 6 27 8.5 27 12.8 27 20.4 16 27 16 27z',
  'heart-filled':
    'M16 27s-11-6.6-11-14.2C5 8.5 8 6 11.3 6c2.2 0 3.8 1.2 4.7 2.8C16.9 7.2 18.5 6 20.7 6 24 6 27 8.5 27 12.8 27 20.4 16 27 16 27z',
  search: 'M14 6a8 8 0 100 16 8 8 0 000-16zM20 20l7 7',
  share: 'M16 4v16M10 10l6-6 6 6M7 18v8h18v-8',
  star: 'M16 4l3.7 7.6 8.3 1.2-6 5.8 1.4 8.3L16 23l-7.4 3.9L10 18.6l-6-5.8 8.3-1.2z',
  'star-filled': 'M16 4l3.7 7.6 8.3 1.2-6 5.8 1.4 8.3L16 23l-7.4 3.9L10 18.6l-6-5.8 8.3-1.2z',
  back: 'M19 7l-9 9 9 9',
  close: 'M8 8l16 16M24 8L8 24',
  alert: 'M16 4a12 12 0 100 24 12 12 0 000-24zM16 10v7M16 22v.5',
  plus: 'M16 6v20M6 16h20',
  menu: 'M5 9h22M5 16h22M5 23h22',
  edit: 'M6 26l1.5-6L21 6.5a2.1 2.1 0 013 0l1.5 1.5a2.1 2.1 0 010 3L12 24.5zM18 9.5l4.5 4.5',
  trash: 'M6 9h20M12 9V6h8v3M9 9l1 17h12l1-17M13.5 14v7M18.5 14v7',
  download: 'M16 5v15M10 14l6 6 6-6M6 26h20',
  upload: 'M16 21V6M10 12l6-6 6 6M6 26h20',
  check: 'M6 17l6 6L26 9',
  chevron: 'M13 7l9 9-9 9',
};

export interface IconProps {
  name: IconName;
  /** Rendered size in CSS pixels. */
  size?: number;
  className?: string;
}

/**
 * Simple 2px-stroke line glyphs on a 32px grid, drawn in currentColor. The filled
 * heart and filled star are the only solid glyphs. Glyphs beyond the design
 * system's set (plus, menu, edit, trash, download, upload, check, chevron, alert)
 * follow the same rules.
 */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill={name === 'star-filled' || name === 'heart-filled' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2 * (32 / Math.max(size, 16))}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-icon={name}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

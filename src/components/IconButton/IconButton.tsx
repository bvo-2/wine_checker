import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

/** circle: 32px on a surface-strong fill. outline: 40px with a ring. ghost: no fill, for dense rows. */
export type IconButtonVariant = 'circle' | 'outline' | 'ghost';

interface CommonProps {
  icon: IconName;
  /** Accessible name (becomes aria-label). Required: the button has no visible text. */
  label: string;
  variant?: IconButtonVariant;
}

export interface IconButtonProps
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {}

function classes(variant: IconButtonVariant, extra?: string) {
  return [styles.iconButton, styles[variant], extra].filter(Boolean).join(' ');
}

export function IconButton({
  icon,
  label,
  variant = 'circle',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button {...rest} type={type} aria-label={label} className={classes(variant, className)}>
      <Icon name={icon} size={variant === 'circle' ? 16 : 20} />
    </button>
  );
}

export interface IconButtonLinkProps
  extends CommonProps, Omit<LinkProps, 'aria-label' | 'children'> {}

/** A router link that looks like an IconButton. */
export function IconButtonLink({
  icon,
  label,
  variant = 'circle',
  className,
  ...rest
}: IconButtonLinkProps) {
  return (
    <Link {...rest} aria-label={label} className={classes(variant, className)}>
      <Icon name={icon} size={variant === 'circle' ? 16 : 20} />
    </Link>
  );
}

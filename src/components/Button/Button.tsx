import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface CommonProps {
  /** primary: the one main action on a screen. secondary: other actions. tertiary: text link. danger: destructive. */
  variant?: ButtonVariant;
  /** Fill the width of the container. */
  block?: boolean;
  children: ReactNode;
}

export interface ButtonProps
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Shows a spinner, sets aria-busy and blocks clicks. */
  loading?: boolean;
}

function classes(variant: ButtonVariant, block: boolean | undefined, extra?: string) {
  return [styles.button, styles[variant], block && styles.block, extra].filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  block,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={classes(variant, block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends CommonProps, Omit<LinkProps, 'children'> {}

/** A router link that looks like a Button. */
export function ButtonLink({
  variant = 'primary',
  block,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={classes(variant, block, className)}>
      {children}
    </Link>
  );
}

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../components/Button/Button';
import styles from './AppShell.module.css';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Catches rendering errors so a bug shows a recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Decant crashed', error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className={styles.message} role="alert">
        <h1 className="t-display-xl">Something went wrong</h1>
        <p className="t-body-md">
          Your wines and tastings are safe; they are stored on this device. Reload the app to carry
          on.
        </p>
        <Button onClick={() => window.location.reload()}>Reload Decant</Button>
      </main>
    );
  }
}

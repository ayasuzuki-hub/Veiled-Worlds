import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-eyebrow">Encrypted frontier</span>
          <h1 className="header-title">Veiled Worlds</h1>
          <p className="header-subtitle">Discover your coordinates. Build in secret.</p>
        </div>
        <div className="header-actions">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}

type BrandLogoProps = { compact?: boolean }

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return <span className={`brand-lockup${compact ? ' brand-lockup-compact' : ''}`} aria-label="OnlineProjects4U">
    <svg className="brand-symbol" viewBox="0 0 36 36" role="img" aria-hidden="true">
      <path d="M11 8 4.5 18 11 28M25 8l6.5 10L25 28M21 5l-6 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="18" r="2.2" fill="var(--brand-cyan)" />
    </svg>
    {!compact && <span className="brand-wordmark">OnlineProjects<span>4U</span></span>}
  </span>
}
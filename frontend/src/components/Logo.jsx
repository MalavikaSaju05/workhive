import { Link } from 'react-router-dom';

/**
 * WorkHive logo component.
 *
 * Icon: a faceted "W" mark in white on a rounded square tile with a
 * blue-to-violet gradient background, followed by the "WorkHive" wordmark.
 *
 * @param {object} props
 * @param {'full' | 'icon'} [props.variant='full'] - 'full' shows icon + wordmark, 'icon' shows icon only
 * @param {string} [props.className] - additional Tailwind classes for sizing
 * @param {boolean} [props.linkToHome=true] - whether the logo links to the landing page
 */
const Logo = ({ variant = 'full', className = 'h-8 w-auto', linkToHome = true }) => {
  const icon = (
    <svg viewBox="0 0 64 64" className={className} aria-hidden={variant === 'full'}>
      <title>WorkHive</title>
      <defs>
        <linearGradient id="workhiveTileGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#4F2DD9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx="14" fill="url(#workhiveTileGrad)" />
      <polygon points="12,17 25,47 32,31 39,47 52,17 43,17 32,41 21,17" fill="#FFFFFF" />
      <polygon points="32,31 39,47 32,41" fill="#BFDBFE" />
    </svg>
  );

  const content =
    variant === 'icon' ? (
      icon
    ) : (
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xl font-semibold text-secondary">WorkHive</span>
      </div>
    );

  if (!linkToHome) return content;

  return (
    <Link to="/" className="inline-flex items-center">
      {content}
    </Link>
  );
};

export default Logo;

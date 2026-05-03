// frontend/src/components/layout/PageHeader.jsx
import Link from 'next/link';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  icon,
}) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Title Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center
                            justify-center text-xl flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
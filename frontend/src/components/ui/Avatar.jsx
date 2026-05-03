
// frontend/src/components/ui/Avatar.jsx
export default function Avatar({ user, size = 'md', showName = false }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
  const src = user?.avatar?.url ||
    `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=6366f1&color=fff`;

  return (
    <div className="flex items-center gap-2">
      <img
        src={src}
        alt={user?.name}
        title={user?.name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
      {showName && (
        <span className="text-sm font-medium text-slate-700">{user?.name}</span>
      )}
    </div>
  );
}

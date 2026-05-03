// frontend/src/components/project/MemberList.jsx
'use client';
import Avatar   from '../ui/Avatar';
import Badge    from '../ui/Badge';

const ROLE_VARIANT = {
  owner:  'primary',
  admin:  'warning',
  member: 'success',
  viewer: 'default',
};

export default function MemberList({ members = [], compact = false }) {
  if (compact) {
    return (
      <div className="flex -space-x-2">
        {members.slice(0, 4).map((m) => (
          <img
            key={m.user?._id || m.user}
            src={
              m.user?.avatar?.url ||
              `https://ui-avatars.com/api/?name=${m.user?.name || 'U'}&size=28&background=random`
            }
            alt={m.user?.name}
            title={`${m.user?.name} (${m.role})`}
            className="w-7 h-7 rounded-full border-2 border-white object-cover"
          />
        ))}
        {members.length > 4 && (
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200
                          flex items-center justify-center text-xs font-medium text-slate-600">
            +{members.length - 4}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.user?._id || member.user}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Avatar user={member.user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{member.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{member.user?.email}</p>
          </div>
          <Badge variant={ROLE_VARIANT[member.role] || 'default'} className="capitalize">
            {member.role}
          </Badge>
        </div>
      ))}
    </div>
  );
}
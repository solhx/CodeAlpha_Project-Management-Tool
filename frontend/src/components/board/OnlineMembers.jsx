// frontend/src/components/board/OnlineMembers.jsx
'use client';
import { useSelector } from 'react-redux';

export default function OnlineMembers() {
  const onlineMembers = useSelector((state) => state.board.onlineMembers);

  if (!onlineMembers.length) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium">Online:</span>
      <div className="flex -space-x-1.5">
        {onlineMembers.slice(0, 5).map((member) => (
          <div key={member._id} className="relative group">
            <img
              src={
                member.avatar?.url ||
                `https://ui-avatars.com/api/?name=${member.name}&size=28&background=6366f1&color=fff`
              }
              alt={member.name}
              className="w-7 h-7 rounded-full border-2 border-white ring-2 ring-green-400"
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            bg-slate-800 text-white text-xs rounded-lg px-2 py-1
                            whitespace-nowrap opacity-0 group-hover:opacity-100
                            transition-opacity pointer-events-none z-10">
              {member.name}
              <span className="ml-1 text-green-400">● online</span>
            </div>
          </div>
        ))}
        {onlineMembers.length > 5 && (
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300
                          flex items-center justify-center text-xs text-slate-600 font-medium">
            +{onlineMembers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
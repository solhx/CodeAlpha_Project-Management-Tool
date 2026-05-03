// frontend/src/components/task/TypingIndicator.jsx
'use client';
import { useState, useEffect } from 'react';
import { useSocket }           from '@/hooks/useSocket';

export default function TypingIndicator({ taskId }) {
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket, joinTask, leaveTask } = useSocket();

  useEffect(() => {
    if (!socket || !taskId) return;

    joinTask(taskId);

    const onTypingStart = ({ user }) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u._id === user._id)) return prev;
        return [...prev, user];
      });
    };

    const onTypingStop = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop',  onTypingStop);

    return () => {
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop',  onTypingStop);
      leaveTask(taskId);
    };
  }, [socket, taskId, joinTask, leaveTask]);

  if (!typingUsers.length) return null;

  const names = typingUsers.map((u) => u.name.split(' ')[0]);
  const text   =
    names.length === 1 ? `${names[0]} is typing...`  :
    names.length === 2 ? `${names.join(' and ')} are typing...` :
    `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      {text}
    </div>
  );
}
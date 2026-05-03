// frontend/src/components/comment/CommentForm.jsx (final version)
'use client';
import { useState, useRef, useCallback } from 'react';
import { useCreateCommentMutation }       from '@/store/api/commentApi';
import { useSelector }                    from 'react-redux';
import { selectCurrentUser }              from '@/store/slices/authSlice';
import { useSocket }                      from '@/hooks/useSocket';
import { debounce }                       from '@/lib/utils';
import TypingIndicator                    from '../task/TypingIndicator';

export default function CommentForm({ taskId, parentId = null, onCancel }) {
  const [content,  setContent]  = useState('');
  const user                    = useSelector(selectCurrentUser);
  const [createComment, { isLoading }] = useCreateCommentMutation();
  const { emitTypingStart, emitTypingStop } = useSocket();
  const isTypingRef = useRef(false);

  // Debounced stop-typing signal
  const stopTyping = useCallback(
    debounce(() => {
      if (isTypingRef.current) {
        emitTypingStop(taskId);
        isTypingRef.current = false;
      }
    }, 1500),
    [taskId, emitTypingStop]
  );

  const handleChange = (e) => {
    setContent(e.target.value);

    if (!isTypingRef.current && e.target.value.trim()) {
      isTypingRef.current = true;
      emitTypingStart(taskId);
    }

    if (!e.target.value.trim() && isTypingRef.current) {
      isTypingRef.current = false;
      emitTypingStop(taskId);
    }

    stopTyping();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Stop typing indicator
    if (isTypingRef.current) {
      emitTypingStop(taskId);
      isTypingRef.current = false;
    }

    try {
      await createComment({
        taskId,
        content:       content.trim(),
        parentComment: parentId,
      }).unwrap();
      setContent('');
      onCancel?.();
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <img
          src={
            user?.avatar?.url ||
            `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`
          }
          className="w-8 h-8 rounded-full flex-shrink-0 mt-1"
          alt={user?.name}
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={parentId ? 'Write a reply...' : 'Write a comment... (Ctrl+Enter to send)'}
            rows={parentId ? 2 : 3}
            className="w-full text-sm border border-slate-200 rounded-xl p-3
                       resize-none focus:outline-none focus:ring-2
                       focus:ring-indigo-300 transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {content.length > 0 && `${content.length} / 2000`}
            </p>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={() => {
                    emitTypingStop(taskId);
                    isTypingRef.current = false;
                    onCancel();
                  }}
                  className="text-sm text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || isLoading || content.length > 2000}
                className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg
                           hover:bg-indigo-700 transition-colors disabled:opacity-60
                           disabled:cursor-not-allowed"
              >
                {isLoading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Show who else is typing */}
      {!parentId && <TypingIndicator taskId={taskId} />}
    </div>
  );
}
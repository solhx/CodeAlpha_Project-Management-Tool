// frontend/src/components/comment/CommentItem.jsx
'use client';
import { useState } from 'react';
import { useDeleteCommentMutation, useUpdateCommentMutation } from '@/store/api/commentApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import CommentForm from './CommentForm';

export default function CommentItem({ comment, taskId }) {
  const user = useSelector(selectCurrentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const [deleteComment] = useDeleteCommentMutation();
  const [updateComment] = useUpdateCommentMutation();

  const isOwner = user?._id === comment.author?._id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    await updateComment({ id: comment._id, content: editContent });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete comment?')) return;
    await deleteComment({ id: comment._id, taskId });
  };

  return (
    <div className="flex gap-3 group">
      <img
        src={comment.author?.avatar?.url ||
          `https://ui-avatars.com/api/?name=${comment.author?.name}&size=32`}
        className="w-8 h-8 rounded-full flex-shrink-0"
        alt={comment.author?.name}
      />
      <div className="flex-1">
        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-800">
              {comment.author?.name}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
              {comment.isEdited && <span className="ml-1 italic">(edited)</span>}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg p-2 
                           resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg"
                >Save</button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 px-3 py-1 rounded-lg hover:bg-slate-200"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-1 ml-2">
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Reply
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {showReply && (
          <div className="mt-2">
            <CommentForm
              taskId={taskId}
              parentId={comment._id}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
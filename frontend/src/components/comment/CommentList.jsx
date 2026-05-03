// frontend/src/components/comment/CommentList.jsx
'use client';
import { useGetCommentsQuery } from '@/store/api/commentApi';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Spinner from '../ui/Spinner';

export default function CommentList({ taskId }) {
  const { data, isLoading } = useGetCommentsQuery(taskId);
  const comments = data?.data?.comments || [];

  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <CommentForm taskId={taskId} />
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} taskId={taskId} />
          ))
        )}
      </div>
    </div>
  );
}
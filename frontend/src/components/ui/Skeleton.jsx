// frontend/src/components/ui/Skeleton.jsx
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="shrink-0 w-72 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
      <Skeleton className="h-6 w-24 rounded-full mb-3" />
      {[...Array(3)].map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <Skeleton className="h-2 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex justify-between pt-1">
          <div className="flex -space-x-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-7 h-7 rounded-full border-2 border-white" />
            ))}
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 w-${i === 0 ? '3/4' : '1/2'}`} />
        </td>
      ))}
    </tr>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex gap-3 px-5 py-4 border-b border-slate-50">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="card p-6 flex items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="card p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
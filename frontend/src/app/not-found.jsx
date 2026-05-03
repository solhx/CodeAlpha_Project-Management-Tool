// frontend/src/app/not-found.jsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50
                    flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-9xl font-black text-indigo-100 select-none mb-4">404</div>
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center
                        text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
          P
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            🏠 Go to Dashboard
          </Link>
          <Link href="/projects" className="btn-secondary">
            📋 My Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
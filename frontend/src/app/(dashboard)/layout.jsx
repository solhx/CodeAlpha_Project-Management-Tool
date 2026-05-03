// frontend/src/app/(dashboard)/layout.jsx
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorBoundary   from '@/components/ui/ErrorBoundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ErrorBoundary>
  );
}
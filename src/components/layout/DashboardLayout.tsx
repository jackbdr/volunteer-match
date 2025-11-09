import { ReactNode } from 'react';
import { AuthUser } from '@/lib/types/auth';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  user: AuthUser;
  children: ReactNode;
}

export default function DashboardLayout({ user, children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="flex">
        <DashboardSidebar user={user} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
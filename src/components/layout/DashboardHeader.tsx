import { AuthUser } from '@/lib/types/auth';

interface DashboardHeaderProps {
  user: AuthUser;
}

export default function DashboardHeader({ user }: DashboardHeaderProps): React.JSX.Element {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VM</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              VolunteerMatch
            </h1>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-4">
            {/* User profile dropdown */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
                
                <form action="/api/auth/signout" method="post" className="inline">
                  <button
                    type="submit"
                    className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
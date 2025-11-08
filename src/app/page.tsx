import { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export default async function Home(): Promise<JSX.Element> {
  // Check if user is already logged in
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">VM</span>
          </div>
          
          {/* Hero Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                VolunteerMatch
              </h1>
              <p className="text-xl text-gray-600">
                Intelligent volunteer coordination platform
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Connect volunteers with opportunities that match their skills, availability, and interests.
              </p>
              
              <ul className="text-sm text-gray-600 space-y-2">
                <li>🎯 Smart matching algorithm</li>
                <li>🔗 Integrated Zoom meetings for virtual events</li>
                <li>📊 Real-time analytics and coordination tools</li>
                <li>👥 Streamlined volunteer management</li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign In to Get Started
              </Link>
              
              <div className="text-xs text-gray-500">
                <p>Demo Accounts Available</p>
                <p className="mt-1">
                  <span className="font-medium">Admin:</span> admin@volunteermatch.com<br />
                  <span className="font-medium">Volunteer:</span> john@example.com<br />
                  <span className="text-gray-400">Password: password123</span>
                </p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-12 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Built for Modern Volunteer Coordination
            </h2>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900">For Admins</h3>
                <p className="text-gray-600 mt-1">
                  Create events, manage volunteers, and get intelligent match recommendations
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-gray-900">For Volunteers</h3>
                <p className="text-gray-600 mt-1">
                  Discover opportunities that match your skills and availability
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { User } from '@prisma/client';
import Link from 'next/link';

interface VolunteerDashboardProps {
  user: User;
}

// Mock data - would come from API calls
const mockData = {
  profileCompleteness: 75,
  upcomingEvents: [
    { 
      id: 1, 
      title: 'Community Garden Cleanup', 
      date: '2024-01-15', 
      time: '9:00 AM', 
      type: 'PHYSICAL',
      location: 'Central Park'
    },
    { 
      id: 2, 
      title: 'Virtual Tutoring Session', 
      date: '2024-01-18', 
      time: '2:00 PM', 
      type: 'VIRTUAL',
      meetingUrl: 'https://zoom.us/j/123456789'
    }
  ],
  recommendations: [
    {
      id: 3,
      title: 'Food Bank Volunteer',
      matchScore: 92,
      date: '2024-01-20',
      time: '10:00 AM',
      requiredSkills: ['Organization', 'Physical Labor'],
      location: 'Downtown Food Bank'
    },
    {
      id: 4,
      title: 'Senior Center Reading Program',
      matchScore: 87,
      date: '2024-01-22',
      time: '3:00 PM',
      requiredSkills: ['Communication', 'Patience'],
      location: 'Sunset Senior Center'
    }
  ],
  notifications: [
    { id: 1, message: 'You were matched to "Community Garden Cleanup"', time: '2 hours ago', unread: true },
    { id: 2, message: 'New opportunity available: "Food Bank Volunteer"', time: '1 day ago', unread: true },
    { id: 3, message: 'Profile updated successfully', time: '3 days ago', unread: false }
  ]
};

export default function VolunteerDashboard({ user }: VolunteerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.name || user.email}! 🌟
        </h1>
        <p className="text-green-100">
          Ready to make a difference? Here are your volunteer opportunities and updates.
        </p>
      </div>

      {/* Profile Completion Banner */}
      {mockData.profileCompleteness < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete your profile ({mockData.profileCompleteness}%)
                </h3>
                <p className="text-sm text-yellow-700">
                  Add your skills and availability to get better matched to events.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">My Upcoming Events</h2>
                <Link
                  href="/dashboard/my-events"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {mockData.upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {mockData.upcomingEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{event.title}</h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              📅 {event.date} at {event.time}
                            </p>
                            {event.type === 'PHYSICAL' ? (
                              <p className="text-sm text-gray-600">📍 {event.location}</p>
                            ) : (
                              <p className="text-sm text-gray-600">💻 Virtual Event</p>
                            )}
                          </div>
                          {event.meetingUrl && (
                            <div className="mt-3">
                              <a
                                href={event.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Join Zoom Meeting</span>
                              </a>
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.type === 'VIRTUAL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {event.type === 'VIRTUAL' ? 'Virtual' : 'In-Person'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by browsing available opportunities.</p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/opportunities"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Find Opportunities
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Events */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
              <p className="text-sm text-gray-600 mt-1">Based on your skills and preferences</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {mockData.recommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{rec.title}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {rec.matchScore}% match
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">📅 {rec.date} at {rec.time}</p>
                          <p className="text-sm text-gray-600">📍 {rec.location}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rec.requiredSkills.map((skill, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {mockData.notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg ${
                    notification.unread ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link
                  href="/dashboard/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Impact</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Events Completed</span>
                <span className="text-lg font-semibold text-gray-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Hours Volunteered</span>
                <span className="text-lg font-semibold text-gray-900">32</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Match Success Rate</span>
                <span className="text-lg font-semibold text-green-600">94%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/opportunities"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Opportunities
              </Link>
              <Link
                href="/dashboard/profile"
                className="block w-full text-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
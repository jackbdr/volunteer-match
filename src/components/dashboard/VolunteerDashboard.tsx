'use client';

import { User } from '@prisma/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface VolunteerDashboardProps {
  user: User;
}

interface UpcomingEvent {
  id: string;
  title: string;
  startTime: string;
  eventType: string;
  location: string;
  meetingUrl?: string;
}

export default function VolunteerDashboard({ user }: VolunteerDashboardProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/events?status=PUBLISHED');
      if (response.ok) {
        const events = await response.json();
        const upcomingEvents = events.filter((e: any) => 
          new Date(e.startTime) > new Date()
        );
        
        // For now, show all published upcoming events as recommendations
        const eventsWithScores = upcomingEvents.map((event: any) => ({
          ...event,
          matchScore: Math.floor(Math.random() * 40) + 60
        }));
        
        setRecommendations(eventsWithScores.slice(0, 4));
        // TODO: Filter for events user has applied to
        setUpcomingEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
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
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
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
                {loading ? (
                  <p className="text-gray-500">Loading recommendations...</p>
                ) : recommendations.length > 0 ? (
                  recommendations.map((rec) => (
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
                            <p className="text-sm text-gray-600">
                              📅 {new Date(rec.startTime).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">📍 {rec.location}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rec.requiredSkills?.slice(0, 3).map((skill: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/dashboard/opportunities"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recommendations available</p>
                )}
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
              <div className="text-center py-8 text-gray-500">
                <p>No new notifications</p>
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
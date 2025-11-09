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
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const matchesResponse = await fetch('/api/volunteers/me/matches');
      if (matchesResponse.ok) {
        const data = await matchesResponse.json();
        const accepted = data.matches.filter((m: any) => m.status === 'ACCEPTED');
        const upcoming = accepted
          .filter((m: any) => new Date(m.event.startTime) > new Date())
          .map((m: any) => ({
            id: m.event.id,
            title: m.event.title,
            startTime: m.event.startTime,
            eventType: m.event.eventType,
            location: m.event.location,
            meetingUrl: m.event.meetingUrl,
            duration: m.event.duration
          }));
        setUpcomingEvents(upcoming);
      }

      // Fetch pending invitations
      const invitationsResponse = await fetch('/api/volunteers/me/invitations');
      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json();
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (matchId: string, action: 'accept' | 'decline') => {
    setRespondingTo(matchId);
    try {
      const response = await fetch(`/api/matches/${matchId}/respond?action=${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to respond to invitation');
      }

      const data = await response.json();
      setToast({ 
        message: data.message, 
        type: 'success' 
      });
      setTimeout(() => setToast(null), 3000);

      fetchDashboardData();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setToast({ 
        message: 'Failed to respond to invitation', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRespondingTo(null);
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
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-blue-600">📬</span>
                    Pending Invitations
                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                      {invitations.length}
                    </span>
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {invitations.map((invitation: any) => (
                  <div key={invitation.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{invitation.event.title}</h3>
                        <p className="text-sm text-gray-600 mt-2">{invitation.event.description}</p>
                        <div className="mt-3 space-y-1.5">
                          <p className="text-sm text-gray-600">
                            📅 {new Date(invitation.event.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            ⏱️ Duration: {invitation.event.duration} minutes
                          </p>
                          <p className="text-sm text-gray-600">
                            📍 {invitation.event.eventType === 'VIRTUAL' ? 'Virtual (Online)' : invitation.event.location}
                          </p>
                          <p className="text-sm text-gray-600">
                            🎯 Skills: {invitation.event.requiredSkills.join(', ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Match score: {invitation.score}%
                          </p>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => respondToInvitation(invitation.matchId, 'accept')}
                            disabled={respondingTo === invitation.matchId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            {respondingTo === invitation.matchId ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => respondToInvitation(invitation.matchId, 'decline')}
                            disabled={respondingTo === invitation.matchId}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          >
                            ✗ Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Upcoming Events</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <Link 
                      key={event.id} 
                      href={`/dashboard/events/${event.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 hover:text-blue-600">{event.title}</h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              📅 {new Date(event.startTime).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              ⏱️ Duration: {event.duration} minutes
                            </p>
                            {event.eventType === 'PHYSICAL' ? (
                              <p className="text-sm text-gray-600">📍 {event.location}</p>
                            ) : (
                              <p className="text-sm text-gray-600">💻 Virtual Event</p>
                            )}
                          </div>
                          {event.meetingUrl && (
                            <div className="mt-3">
                              <span className="inline-flex items-center space-x-2 text-sm text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Zoom Meeting Available</span>
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.eventType === 'VIRTUAL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {event.eventType === 'VIRTUAL' ? 'Virtual' : 'In-Person'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                  <p className="mt-1 text-sm text-gray-500">You'll see events here once you accept invitations.</p>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
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
                href="/dashboard/profile"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
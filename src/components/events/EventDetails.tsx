'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventType } from '@prisma/client';

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  location: string;
  startTime: string;
  duration: number;
  requiredSkills: string[];
  meetingUrl?: string;
  zoomMeetingId?: string;
  maxVolunteers?: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    matches: number;
    registeredVolunteers?: number;
  };
}

interface EventDetailsProps {
  eventId: string;
  isAdmin?: boolean;
}

interface Match {
  id: string;
  score: number;
  status: string;
  volunteer: {
    id: string;
    user: {
      name: string | null;
      email: string;
    };
    skills: string[];
  };
  emailSentAt?: string;
}

export default function EventDetails({ eventId, isAdmin = true }: EventDetailsProps): React.JSX.Element {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [creatingZoom, setCreatingZoom] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEvent = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Event not found');
        }
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/events/${eventId}/matches`);
      if (response.ok) {
        const matchesData = await response.json();
        if (matchesData.length > 0) {
          setMatches(matchesData);
          setShowMatches(true);
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const toggleEventStatus = async (): Promise<void> => {
    if (!event) return;

    const newStatus = event.status === 'PUBLISHED' ? 'CANCELLED' : 'PUBLISHED';

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      fetchEvent();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status');
    }
  };

  const calculateMatches = async (): Promise<void> => {
    setCalculating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/matches`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate matches');
      }

      const result = await response.json();
      
      const matchesResponse = await fetch(`/api/events/${eventId}/matches`);
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
        setShowMatches(true);
      }
      
      setSuccessMessage(`${result.matchesCreated} new matches created! Total matches: ${result.matchesFound}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchEvent();
    } catch (error) {
      console.error('Error calculating matches:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate matches');
      setTimeout(() => setError(''), 5000);
    } finally {
      setCalculating(false);
    }
  };

  const deleteEvent = async (): Promise<void> => {
    if (!event) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      setToast({ message: 'Failed to delete event', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const createZoomMeeting = async (): Promise<void> => {
    setCreatingZoom(true);
    try {
      const response = await fetch(`/api/events/${eventId}/zoom`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Zoom meeting');
      }

      setSuccessMessage('Zoom meeting created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchEvent();
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      setError(error instanceof Error ? error.message : 'Failed to create Zoom meeting');
      setTimeout(() => setError(''), 5000);
    } finally {
      setCreatingZoom(false);
    }
  };

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const sendInvitation = async (matchId: string, _volunteerEmail: string): Promise<void> => {
    if (!event || event.status !== 'PUBLISHED') {
      setToast({ message: 'Event must be published to send invitations', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSendingInvite(matchId);
    try {
      const response = await fetch(`/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const data = await response.json();
      setToast({ message: data.message, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
      fetchMatches();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setToast({ message: 'Failed to send invitation', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSendingInvite(null);
    }
  };

  const isUpcoming = (startTime: string): boolean => {
    return new Date(startTime) > new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading event</h3>
            <p className="mt-1 text-gray-500">{error}</p>
            <div className="mt-6 space-x-3">
              <button
                onClick={fetchEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <Link
                href="/dashboard/events"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const { date, time } = formatDateTime(event.startTime);
  const upcoming = isUpcoming(event.startTime);

  return (
    <div className="space-y-6">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/events"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              event.status === 'PUBLISHED' 
                ? 'bg-green-100 text-green-800' 
                : event.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : event.status === 'COMPLETED'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {event.status}
            </span>
            
            {upcoming && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Upcoming
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.eventType === 'VIRTUAL' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {event.eventType === 'VIRTUAL' ? '💻 Virtual Event' : '📍 In-Person Event'}
                </span>
                <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                {event._count && (
                  <span className="font-medium">{event._count.matches} matches calculated</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {/* Required Skills */}
              {event.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.requiredSkills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Zoom Meeting Info */}
              {event.eventType === 'VIRTUAL' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Virtual Meeting</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    {event.meetingUrl ? (
                      <div className="space-y-2">
                        <p className="text-blue-800">
                          <span className="font-medium">Zoom Meeting:</span> Ready
                        </p>
                        <a
                          href={event.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Zoom Meeting
                        </a>
                        {event.zoomMeetingId && (
                          <p className="text-sm text-blue-600">Meeting ID: {event.zoomMeetingId}</p>
                        )}
                      </div>
                    ) : isAdmin ? (
                      <div className="space-y-3">
                        <p className="text-blue-800">
                          <span className="font-medium">Status:</span> No Zoom meeting created yet
                        </p>
                        <button
                          onClick={createZoomMeeting}
                          disabled={creatingZoom}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {creatingZoom ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Meeting...
                            </span>
                          ) : (
                            'Create Zoom Meeting'
                          )}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-blue-800">
                          <span className="font-medium">Status:</span> Meeting details will be available closer to the event
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registered Volunteers */}
              {showMatches && matches.filter((m: Match) => m.status === 'ACCEPTED').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Registered Volunteers</h3>
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200 bg-green-50">
                      <p className="text-sm text-gray-600">{matches.filter((m: Match) => m.status === 'ACCEPTED').length} volunteer(s) registered</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="divide-y divide-gray-200">
                        {matches.filter((m: Match) => m.status === 'ACCEPTED').map((match: Match) => (
                          <div key={match.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-medium text-sm">
                                  {match.volunteer.user.name?.charAt(0) || match.volunteer.user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {match.volunteer.user.name || 'Unnamed Volunteer'}
                                  </h4>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Registered
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{match.volunteer.user.email}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {match.volunteer.skills.slice(0, 3).map((skill: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {match.volunteer.skills.length > 3 && (
                                    <span className="text-xs text-gray-500">+{match.volunteer.skills.length - 3}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Potential Volunteers (Pending/Declined) - Admin Only */}
              {isAdmin && showMatches && matches.filter((m: Match) => m.status !== 'ACCEPTED').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Potential Volunteers</h3>
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-600">{matches.filter((m: Match) => m.status !== 'ACCEPTED').length} potential volunteer(s)</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="divide-y divide-gray-200">
                        {matches.filter((m: Match) => m.status !== 'ACCEPTED').map((match: Match) => (
                          <div key={match.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {match.volunteer.user.name?.charAt(0) || match.volunteer.user.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {match.volunteer.user.name || 'Unnamed Volunteer'}
                                    </h4>
                                    <span className="text-xs font-medium text-green-600">{match.score}%</span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{match.volunteer.user.email}</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {match.volunteer.skills.slice(0, 3).map((skill: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {match.volunteer.skills.length > 3 && (
                                      <span className="text-xs text-gray-500">+{match.volunteer.skills.length - 3}</span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        match.status === 'ACCEPTED'
                                          ? 'bg-green-100 text-green-800'
                                          : match.status === 'DECLINED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {match.status}
                                    </span>
                                    {match.emailSentAt && (
                                      <span className="text-xs text-gray-500">
                                        ✓ Invited {new Date(match.emailSentAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Send Invitation Button - Admin Only */}
                              {isAdmin && match.status === 'PENDING' && event?.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => sendInvitation(match.id, match.volunteer.user.email)}
                                  disabled={sendingInvite === match.id}
                                  className="ml-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                  {sendingInvite === match.id ? 'Sending...' : match.emailSentAt ? 'Resend' : 'Send Invite'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Event Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">📅 Date:</span>
                    <div className="font-medium text-gray-900">{date}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">🕐 Time:</span>
                    <div className="font-medium text-gray-900">{time}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">⏱️ Duration:</span>
                    <div className="font-medium text-gray-900">{event.duration} minutes</div>
                  </div>
                  <div>
                    <span className="text-gray-500">📍 Location:</span>
                    <div className="font-medium text-gray-900">{event.location}</div>
                  </div>
                  {event.maxVolunteers && (
                    <div>
                      <span className="text-gray-500">👥 Max Volunteers:</span>
                      <div className="font-medium text-gray-900">{event.maxVolunteers}</div>
                    </div>
                  )}
                  {event.registrationDeadline && (
                    <div>
                      <span className="text-gray-500">📝 Registration Deadline:</span>
                      <div className="font-medium text-gray-900">
                        {formatDateTime(event.registrationDeadline).date}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions - Admin Only */}
              {isAdmin && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                  
                  <button
                    onClick={calculateMatches}
                    disabled={calculating}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {calculating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      'Calculate Matches'
                    )}
                  </button>
                  
                  <button
                    onClick={toggleEventStatus}
                    className={`w-full px-4 py-2 rounded-lg transition-colors ${
                      event.status === 'PUBLISHED'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {event.status === 'PUBLISHED' ? 'Cancel Event' : 'Publish Event'}
                  </button>

                  <button
                    onClick={deleteEvent}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Delete Event
                  </button>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium text-gray-900">{event.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-900">{event.eventType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{isAdmin ? 'Matches:' : 'Registered:'}</span>
                    <span className="font-medium text-gray-900">
                      {isAdmin 
                        ? (event._count?.matches || 0) 
                        : (event._count?.registeredVolunteers || 0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skills Required:</span>
                    <span className="font-medium text-gray-900">{event.requiredSkills.length}</span>
                  </div>
                </div>
              </div>
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
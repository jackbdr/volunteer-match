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
  location: string;
  startTime: string;
  duration: number;
  requiredSkills: string[];
  isActive: boolean;
  meetingUrl?: string;
  zoomMeetingId?: string;
  maxVolunteers?: number;
  registrationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    matches: number;
  };
}

interface EventDetailsProps {
  eventId: string;
}

export default function EventDetails({ eventId }: EventDetailsProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
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

  const toggleEventStatus = async () => {
    if (!event) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !event.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      // Refresh event data
      fetchEvent();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status');
    }
  };

  const calculateMatches = async () => {
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
      alert(`Matches calculated successfully! Found ${result.matchesFound || result.matchCount || 0} matches.`);
      
      // Refresh event data to show updated match count
      fetchEvent();
    } catch (error) {
      console.error('Error calculating matches:', error);
      alert(error instanceof Error ? error.message : 'Failed to calculate matches');
    } finally {
      setCalculating(false);
    }
  };

  const deleteEvent = async () => {
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

      alert('Event deleted successfully');
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const formatDateTime = (dateString: string) => {
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

  const isUpcoming = (startTime: string) => {
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
    return null;
  }

  const { date, time } = formatDateTime(event.startTime);
  const upcoming = isUpcoming(event.startTime);

  return (
    <div className="space-y-6">
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
              event.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {event.isActive ? 'Active' : 'Inactive'}
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
                    ) : (
                      <p className="text-blue-800">
                        <span className="font-medium">Status:</span> Zoom meeting will be created automatically
                      </p>
                    )}
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

              {/* Actions */}
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
                    event.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {event.isActive ? 'Deactivate Event' : 'Activate Event'}
                </button>

                <button
                  onClick={deleteEvent}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Delete Event
                </button>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium">{event.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{event.eventType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matches:</span>
                    <span className="font-medium">{event._count?.matches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Skills Required:</span>
                    <span className="font-medium">{event.requiredSkills.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
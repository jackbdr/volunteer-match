'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  _count?: {
    matches: number;
  };
}

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'cancelled'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'CANCELLED' : 'PUBLISHED';
    
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

      // Refresh events list
      fetchEvents();
      setToast({ message: 'Event status updated successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating event status:', error);
      setToast({ message: 'Failed to update event status', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const calculateMatches = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/matches`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to calculate matches');
      }

      const data = await response.json();
      setToast({ message: `Successfully calculated ${data.matchCount || 0} matches!`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      // Refresh the events list to show updated match counts
      fetchEvents();
    } catch (error) {
      console.error('Error calculating matches:', error);
      setToast({ message: 'Failed to calculate matches', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'published') return event.status === 'PUBLISHED';
    if (filter === 'draft') return event.status === 'DRAFT';
    if (filter === 'cancelled') return event.status === 'CANCELLED';
    return true;
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading events</h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Events', count: events.length },
              { key: 'published', label: 'Published', count: events.filter(e => e.status === 'PUBLISHED').length },
              { key: 'draft', label: 'Draft', count: events.filter(e => e.status === 'DRAFT').length },
              { key: 'cancelled', label: 'Cancelled', count: events.filter(e => e.status === 'CANCELLED').length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-gray-500">
              {filter === 'all' ? 'Get started by creating your first event.' : `No ${filter} events found.`}
            </p>
            {filter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/events/create"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First Event
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const { date, time } = formatDateTime(event.startTime);
              const upcoming = isUpcoming(event.startTime);
              
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {event.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.eventType === 'VIRTUAL' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {event.eventType === 'VIRTUAL' ? '💻 Virtual' : '📍 In-Person'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">📅 Date & Time:</span>
                          <div className="font-medium text-gray-900">{date} at {time}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">📍 Location:</span>
                          <div className="font-medium text-gray-900">{event.location}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">⏱️ Duration:</span>
                          <div className="font-medium text-gray-900">{event.duration} minutes</div>
                        </div>
                      </div>

                      {/* Skills and Matches */}
                      <div className="mt-4 flex items-center space-x-6">
                        {event.requiredSkills.length > 0 && (
                          <div>
                            <span className="text-gray-500 text-sm">Required Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {event.requiredSkills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                  {skill}
                                </span>
                              ))}
                              {event.requiredSkills.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                  +{event.requiredSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {event._count && (
                          <div>
                            <span className="text-gray-500 text-sm">Matches:</span>
                            <div className="font-medium text-gray-900">{event._count.matches}</div>
                          </div>
                        )}
                      </div>

                      {/* Zoom Meeting Link */}
                      {event.eventType === 'VIRTUAL' && event.meetingUrl && (
                        <div className="mt-3">
                          <a
                            href={event.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Join Zoom Meeting
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex items-center space-x-2">
                      <button
                        onClick={() => calculateMatches(event.id)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                      >
                        Calculate Matches
                      </button>
                      
                      <button
                        onClick={() => toggleEventStatus(event.id, event.status)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          event.status === 'PUBLISHED'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {event.status === 'PUBLISHED' ? 'Cancel' : 'Publish'}
                      </button>

                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
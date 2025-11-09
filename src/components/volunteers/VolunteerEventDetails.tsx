'use client';

import { useEffect, useState } from 'react';
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
  maxVolunteers?: number;
  meetingUrl?: string;
  registrationDeadline?: string;
  _count?: {
    matches: number;
  };
}

interface VolunteerEventDetailsProps {
  eventId: string;
}

export default function VolunteerEventDetails({ eventId }: VolunteerEventDetailsProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    checkRegistrationStatus();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      // Check if volunteer is already registered for this event
      const response = await fetch(`/api/events/${eventId}/registration-status`);
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.isRegistered);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleApply = async () => {
    if (applying) return;

    setApplying(true);
    try {
      const response = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to apply');
      }

      setIsRegistered(true);
      alert('Successfully registered for this event!');
    } catch (error) {
      console.error('Error applying:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-gray-500">{error || 'Event not found'}</p>
          <button
            onClick={() => router.push('/dashboard/opportunities')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Opportunities
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(event.startTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/opportunities')}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Opportunities
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
        </div>
        {!isRegistered ? (
          <button
            onClick={handleApply}
            disabled={applying}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {applying ? 'Registering...' : 'Register for Event'}
          </button>
        ) : (
          <div className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium">
            ✓ Registered
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Opportunity</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Required Skills */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {event.requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Meeting Link (for registered volunteers) */}
          {isRegistered && event.eventType === 'VIRTUAL' && event.meetingUrl && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Virtual Meeting</h2>
              <p className="text-gray-600 mb-4">Join the event using the link below:</p>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Zoom Meeting
              </a>
            </div>
          )}
        </div>

        {/* Right Column - Event Details */}
        <div className="space-y-6">
          {/* Event Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Type</div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {event.eventType === 'VIRTUAL' ? '💻 Virtual' : '📍 In-Person'}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Date</div>
                <div className="font-medium text-gray-900">{date}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Time</div>
                <div className="font-medium text-gray-900">{time}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Duration</div>
                <div className="font-medium text-gray-900">{event.duration} minutes</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Location</div>
                <div className="font-medium text-gray-900">{event.location}</div>
              </div>

              {event.registrationDeadline && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Registration Deadline</div>
                  <div className="font-medium text-gray-900">
                    {formatDateTime(event.registrationDeadline).date}
                  </div>
                </div>
              )}

              {event.maxVolunteers && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Spots Available</div>
                  <div className="font-medium text-gray-900">
                    {event._count?.matches || 0} / {event.maxVolunteers} registered
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Reminder */}
          {!isRegistered && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-medium text-yellow-900 mb-1">Not Registered Yet</h3>
                  <p className="text-sm text-yellow-700">
                    Register now to secure your spot and receive event updates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

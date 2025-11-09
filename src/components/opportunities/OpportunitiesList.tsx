'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventType } from '@prisma/client';

interface Opportunity {
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
  matchScore?: number;
  registrationDeadline?: string;
  _count?: {
    matches: number;
  };
}

export default function OpportunitiesList(): React.JSX.Element {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | EventType>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'title'>('match');

  const allSkills = [
    'Communication', 'Leadership', 'Organization', 'Teaching', 'Physical Labor',
    'Technology', 'Customer Service', 'Problem Solving', 'Teamwork', 'Event Planning',
    'Social Media', 'Writing', 'Design', 'Translation', 'Driving', 'Cooking',
    'First Aid', 'Fundraising', 'Marketing', 'Data Entry'
  ];

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async (): Promise<void> => {
    try {
      // Only fetch PUBLISHED events for volunteers
      const response = await fetch('/api/events?status=PUBLISHED');
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      const data = await response.json();
      
      // Filter only active events and add mock match scores
      const activeEvents = data.filter((event: Opportunity) => new Date(event.startTime) > new Date());
      
      // Add mock match scores (in real app, this would come from the matching API)
      const eventsWithScores = activeEvents.map((event: Opportunity) => ({
        ...event,
        matchScore: Math.floor(Math.random() * 40) + 60 // Mock scores between 60-100
      }));
      
      setOpportunities(eventsWithScores);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const applyToEvent = async (eventId: string): Promise<void> => {
    try {
      // In a real application, this would create an application or match
      const response = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to apply to event');
      }

      alert('Successfully applied to the event!');
      
      // Refresh opportunities to update application status
      fetchOpportunities();
    } catch (error) {
      console.error('Error applying to event:', error);
      alert('Failed to apply to event. Please try again.');
    }
  };

  const filteredAndSortedOpportunities = (): Opportunity[] => {
    const filtered = opportunities.filter(opp => {
      const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           opp.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || opp.eventType === selectedType;
      
      const matchesSkills = selectedSkills.length === 0 || 
                           selectedSkills.some(skill => opp.requiredSkills.includes(skill));
      
      return matchesSearch && matchesType && matchesSkills;
    });

    // Sort opportunities
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'date':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const toggleSkillFilter = (skill: string): void => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading opportunities</h3>
          <p className="mt-1 text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchOpportunities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayedOpportunities = filteredAndSortedOpportunities();

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'date' | 'title')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="match">Sort by Match Score</option>
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            {[
              { value: 'all', label: 'All Events' },
              { value: 'VIRTUAL', label: 'Virtual' },
              { value: 'PHYSICAL', label: 'In-Person' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSelectedType(value as 'all' | EventType)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedType === value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Skills Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Filter by Skills:</span>
              {selectedSkills.length > 0 && (
                <button
                  onClick={() => setSelectedSkills([])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all ({selectedSkills.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allSkills.slice(0, 10).map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkillFilter(skill)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedSkills.includes(skill)
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {displayedOpportunities.length} of {opportunities.length} opportunities
          </span>
          {searchTerm && (
            <span>Search: &ldquo;{searchTerm}&rdquo;</span>
          )}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {displayedOpportunities.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No opportunities found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your filters or search terms to find more opportunities.
              </p>
            </div>
          </div>
        ) : (
          displayedOpportunities.map((opportunity) => {
            const { date, time } = formatDateTime(opportunity.startTime);
            
            return (
              <div 
                key={opportunity.id} 
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/opportunities/${opportunity.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with Title and Match Score */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {opportunity.title}
                        </h3>
                        {opportunity.matchScore && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(opportunity.matchScore)}`}>
                            {opportunity.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Event Type and Status Badges */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        opportunity.eventType === 'VIRTUAL' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {opportunity.eventType === 'VIRTUAL' ? '💻 Virtual' : '📍 In-Person'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Open for Applications
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {opportunity.description}
                    </p>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">📅 Date & Time:</span>
                        <div className="font-medium text-gray-900">{date} at {time}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">📍 Location:</span>
                        <div className="font-medium text-gray-900">{opportunity.location}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">⏱️ Duration:</span>
                        <div className="font-medium text-gray-900">{opportunity.duration} minutes</div>
                      </div>
                    </div>

                    {/* Required Skills */}
                    {opportunity.requiredSkills.length > 0 && (
                      <div className="mb-4">
                        <span className="text-gray-500 text-sm">Required Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opportunity.requiredSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                selectedSkills.includes(skill)
                                  ? 'bg-blue-100 text-blue-800 font-medium'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zoom Meeting Link for Virtual Events */}
                    {opportunity.eventType === 'VIRTUAL' && opportunity.meetingUrl && (
                      <div className="mb-4">
                        <a
                          href={opportunity.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Meeting will be available after registration
                        </a>
                      </div>
                    )}

                    {/* Registration Deadline */}
                    {opportunity.registrationDeadline && (
                      <div className="text-sm text-gray-500 mb-4">
                        Registration closes: {formatDateTime(opportunity.registrationDeadline).date} at {formatDateTime(opportunity.registrationDeadline).time}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/opportunities/${opportunity.id}`);
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyToEvent(opportunity.id);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventType } from '@prisma/client';

interface EventFormData {
  title: string;
  description: string;
  eventType: EventType;
  status: 'DRAFT' | 'PUBLISHED';
  requiredSkills: string[];
  location: string;
  startTime: string;
  duration: number;
  maxVolunteers?: number;
  registrationDeadline?: string;
}

const skillOptions = [
  'communication',
  'leadership',
  'organization',
  'teaching',
  'physical labor',
  'technology',
  'customer service',
  'problem solving',
  'teamwork',
  'event planning',
  'social media',
  'writing',
  'design',
  'translation',
  'driving',
  'cooking',
  'first aid',
  'fundraising'
];

export default function EventCreateForm(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: 'PHYSICAL' as EventType,
    status: 'PUBLISHED',
    requiredSkills: [],
    location: '',
    startTime: '',
    duration: 120,
    maxVolunteers: undefined,
    registrationDeadline: ''
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    const validationErrors: string[] = [];
    
    if (!formData.title.trim()) {
      validationErrors.push('Title is required');
    }
    
    if (!formData.description.trim()) {
      validationErrors.push('Description is required');
    } else if (formData.description.trim().length < 10) {
      validationErrors.push('Description must be at least 10 characters');
    }
    
    if (!formData.location.trim()) {
      validationErrors.push('Location is required');
    }
    
    if (!formData.startTime) {
      validationErrors.push('Start date and time is required');
    } else if (new Date(formData.startTime) <= new Date()) {
      validationErrors.push('Start time must be in the future');
    }
    
    if (formData.registrationDeadline && new Date(formData.registrationDeadline) >= new Date(formData.startTime)) {
      validationErrors.push('Registration deadline must be before the event start time');
    }

    if (validationErrors.length > 0) {
      setError(`Please fix the following issues:\n• ${validationErrors.join('\n• ')}`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          timeSlot: `${new Date(formData.startTime).toLocaleDateString()} ${new Date(formData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          registrationDeadline: formData.registrationDeadline 
            ? new Date(formData.registrationDeadline).toISOString() 
            : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle detailed validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((detail: { path?: string[]; message: string }) => {
            const field = detail.path ? detail.path.join('.') : 'Unknown field';
            return `${field}: ${detail.message}`;
          });
          throw new Error(`Validation errors:\n• ${errorMessages.join('\n• ')}`);
        }
        
        throw new Error(errorData.error || 'Failed to create event');
      }

      const event = await response.json();
      
      router.push(`/dashboard/events/${event.id}`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillToggle = (skill: string): void => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter(s => s !== skill)
        : [...prev.requiredSkills, skill]
    }));
  };

  const handleEventTypeChange = (type: EventType): void => {
    setFormData(prev => ({
      ...prev,
      eventType: type,
      // Auto-set location for virtual events
      location: type === 'VIRTUAL' ? 'Online (Zoom meeting will be created automatically)' : prev.location === 'Online (Zoom meeting will be created automatically)' ? '' : prev.location
    }));
  };

  // Format datetime-local input value
  const formatDateTimeLocal = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-800">
                {error.split('\n').map((line, index) => (
                  <div key={index} className={index > 0 ? 'mt-1' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Event Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="e.g., Community Garden Cleanup"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Describe the event, what volunteers will do, and any important details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleEventTypeChange('PHYSICAL')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.eventType === 'PHYSICAL'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-2">📍</div>
                  <div className="font-medium">In-Person</div>
                  <div className="text-sm text-gray-600">Physical location required</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeChange('VIRTUAL')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.eventType === 'VIRTUAL'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-2">💻</div>
                  <div className="font-medium">Virtual</div>
                  <div className="text-sm text-gray-600">Zoom meeting auto-created</div>
                </button>
              </div>
            </div>

            {/* Status Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Status *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'PUBLISHED' }))}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.status === 'PUBLISHED'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-2">✅</div>
                  <div className="font-medium">Publish Now</div>
                  <div className="text-sm text-gray-600">Event is live, volunteers can register</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'DRAFT' }))}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.status === 'DRAFT'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg mb-2">📝</div>
                  <div className="font-medium">Save as Draft</div>
                  <div className="text-sm text-gray-600">Not visible to volunteers yet</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                disabled={formData.eventType === 'VIRTUAL'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.eventType === 'VIRTUAL' ? 'bg-gray-100 text-gray-600' : ''
                }`}
                placeholder={formData.eventType === 'VIRTUAL' ? 'Zoom meeting will be created automatically' : 'e.g., 123 Main St, City, State'}
              />
            </div>
          </div>
        </div>

        {/* DateTime and Duration */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                required
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                min={formatDateTimeLocal(new Date())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours (full day)</option>
              </select>
            </div>

            <div>
              <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                id="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                max={formData.startTime}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">Optional: When volunteer applications close</p>
            </div>
          </div>
        </div>

        {/* Required Skills */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Required Skills
          </h2>
          
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Select the skills that would be helpful for this event. This helps match the right volunteers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {skillOptions.map((skill) => (
                <label key={skill} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiredSkills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{skill}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {formData.requiredSkills.length} skills
            </p>
          </div>
        </div>

        {/* Volunteer Limits */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Volunteer Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="maxVolunteers" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Volunteers
              </label>
              <input
                type="number"
                id="maxVolunteers"
                min="1"
                value={formData.maxVolunteers || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxVolunteers: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Leave empty for unlimited"
              />
              <p className="text-sm text-gray-500 mt-1">Optional: Limit the number of volunteers</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Event...
              </span>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
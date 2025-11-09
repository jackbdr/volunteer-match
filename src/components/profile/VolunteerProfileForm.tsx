'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/types/auth';

interface VolunteerProfile {
  id?: string;
  skills: string[];
  availability: string[];
  location: string;
  preferredCauses: string[];
  bio: string;
}

interface VolunteerProfileFormProps {
  user: AuthUser;
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
  'fundraising',
  'marketing',
  'data entry',
  'photography',
  'video editing',
  'public speaking',
  'research'
];

const availabilityOptions = [
  'Monday Morning',
  'Monday Afternoon',
  'Monday Evening',
  'Tuesday Morning',
  'Tuesday Afternoon',
  'Tuesday Evening',
  'Wednesday Morning',
  'Wednesday Afternoon',
  'Wednesday Evening',
  'Thursday Morning',
  'Thursday Afternoon',
  'Thursday Evening',
  'Friday Morning',
  'Friday Afternoon',
  'Friday Evening',
  'Saturday Morning',
  'Saturday Afternoon',
  'Saturday Evening',
  'Sunday Morning',
  'Sunday Afternoon',
  'Sunday Evening',
  'Weekends',
  'Weekdays',
  'Flexible'
];

const causeOptions = [
  'Education',
  'Environment',
  'Health & Medicine',
  'Homelessness',
  'Animal Welfare',
  'Children & Youth',
  'Seniors',
  'Disaster Relief',
  'Community Development',
  'Arts & Culture',
  'Sports & Recreation',
  'Food Security',
  'Mental Health',
  'Technology',
  'Human Rights',
  'Faith-Based',
  'International Aid',
  'Veterans',
  'LGBTQ+ Support',
  'Disability Support'
];

export default function VolunteerProfileForm({ user: _user }: VolunteerProfileFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [profile, setProfile] = useState<VolunteerProfile>({
    skills: [],
    availability: [],
    location: '',
    preferredCauses: [],
    bio: ''
  });

  const [originalProfile, setOriginalProfile] = useState<VolunteerProfile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Check if there are changes
    if (originalProfile) {
      const changed = JSON.stringify(profile) !== JSON.stringify(originalProfile);
      setHasChanges(changed);
    }
  }, [profile, originalProfile]);

  const fetchProfile = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/volunteers/me');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setOriginalProfile(data);
      } else if (response.status !== 404) {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/volunteers/me', {
        method: profile.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setSuccess('Profile saved successfully!');
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArrayToggle = (field: keyof VolunteerProfile, value: string): void => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const calculateProfileCompleteness = (): number => {
    let completed = 0;
    const total = 5;

    if (profile.skills.length > 0) completed++;
    if (profile.availability.length > 0) completed++;
    if (profile.location.trim()) completed++;
    if (profile.preferredCauses.length > 0) completed++;
    if (profile.bio.trim()) completed++;

    return Math.round((completed / total) * 100);
  };

  const completeness = calculateProfileCompleteness();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completeness */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Profile Completeness</h2>
          <span className="text-2xl font-bold text-blue-600">{completeness}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Complete your profile to get better matched to volunteer opportunities
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h2>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="e.g., San Francisco, CA"
              />
              <p className="text-sm text-gray-500 mt-1">
                This helps match you with local opportunities
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Tell us about yourself, your interests, and what motivates you to volunteer..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Share what drives your passion for volunteering
              </p>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Skills & Abilities
            </h2>
            
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select your skills and abilities. This helps us match you with suitable opportunities.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {skillOptions.map((skill) => (
                  <label 
                    key={skill} 
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={profile.skills.includes(skill)}
                      onChange={() => handleArrayToggle('skills', skill)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {profile.skills.length} skills
              </p>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Availability
            </h2>
            
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When are you typically available to volunteer?
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map((timeSlot) => (
                  <label 
                    key={timeSlot} 
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={profile.availability.includes(timeSlot)}
                      onChange={() => handleArrayToggle('availability', timeSlot)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{timeSlot}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {profile.availability.length} time slots
              </p>
            </div>
          </div>

          {/* Preferred Causes */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Preferred Causes
            </h2>
            
            <div>
              <p className="text-sm text-gray-600 mb-4">
                What causes are you passionate about? Select all that apply.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {causeOptions.map((cause) => (
                  <label 
                    key={cause} 
                    className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={profile.preferredCauses.includes(cause)}
                      onChange={() => handleArrayToggle('preferredCauses', cause)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{cause}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {profile.preferredCauses.length} causes
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
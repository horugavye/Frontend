import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { toast } from 'react-hot-toast';
import {
  Bell,
  UserCircle,
  Shield,
  Lock,
  Globe,
  Moon,
  Sun,
  Mail,
  Smartphone,
  MessageSquare,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, className = '' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative flex items-center h-8 w-20 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-white dark:focus:ring-offset-dark-bg border border-gray-300 dark:border-gray-700 shadow-sm px-2 ${
        checked
          ? 'bg-green-600 hover:bg-green-700 justify-between'
          : 'bg-red-600 hover:bg-red-700 justify-start'
      } ${className}`}
    >
      {/* ON/OFF Text */}
      <span
        className={`font-bold text-white text-sm select-none transition-all duration-200 ${
          checked ? 'order-1 ml-1' : 'order-2 mr-1'
        }`}
        style={{ minWidth: 28 }}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
      {/* Circle */}
      <span
        className={`transition-transform duration-200 ease-in-out bg-white h-7 w-7 rounded-full shadow-md border border-gray-200 dark:border-gray-700 ${
          checked ? 'order-2' : 'order-1'
        }`}
      />
      <span className="sr-only">{checked ? 'On' : 'Off'}</span>
    </button>
  );
};

interface NotificationPreferences {
  email_connection_requests: boolean;
  email_community_invites: boolean;
  email_messages: boolean;
  email_achievements: boolean;
  email_events: boolean;
  push_connection_requests: boolean;
  push_community_invites: boolean;
  push_messages: boolean;
  push_achievements: boolean;
  push_events: boolean;
  in_app_connection_requests: boolean;
  in_app_community_invites: boolean;
  in_app_messages: boolean;
  in_app_achievements: boolean;
  in_app_events: boolean;
  email_community_join: boolean;
  email_community_join_accepted: boolean;
  email_community_join_rejected: boolean;
  email_community_role_change: boolean;
  push_community_join: boolean;
  push_community_join_accepted: boolean;
  push_community_join_rejected: boolean;
  push_community_role_change: boolean;
  in_app_community_join: boolean;
  in_app_community_join_accepted: boolean;
  in_app_community_join_rejected: boolean;
  in_app_community_role_change: boolean;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_connection_requests: true,
    email_community_invites: true,
    email_messages: true,
    email_achievements: true,
    email_events: true,
    push_connection_requests: true,
    push_community_invites: true,
    push_messages: true,
    push_achievements: true,
    push_events: true,
    in_app_connection_requests: true,
    in_app_community_invites: true,
    in_app_messages: true,
    in_app_achievements: true,
    in_app_events: true,
    email_community_join: true,
    email_community_join_accepted: true,
    email_community_join_rejected: true,
    email_community_role_change: true,
    push_community_join: true,
    push_community_join_accepted: true,
    push_community_join_rejected: true,
    push_community_role_change: true,
    in_app_community_join: true,
    in_app_community_join_accepted: true,
    in_app_community_join_rejected: true,
    in_app_community_role_change: true
  });
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const defaultPreferences = {
    email_connection_requests: true,
    email_community_invites: true,
    email_messages: true,
    email_achievements: true,
    email_events: true,
    push_connection_requests: true,
    push_community_invites: true,
    push_messages: true,
    push_achievements: true,
    push_events: true,
    in_app_connection_requests: true,
    in_app_community_invites: true,
    in_app_messages: true,
    in_app_achievements: true,
    in_app_events: true,
    email_community_join: true,
    email_community_join_accepted: true,
    email_community_join_rejected: true,
    email_community_role_change: true,
    push_community_join: true,
    push_community_join_accepted: true,
    push_community_join_rejected: true,
    push_community_role_change: true,
    in_app_community_join: true,
    in_app_community_join_accepted: true,
    in_app_community_join_rejected: true,
    in_app_community_role_change: true
  };

  const fetchNotificationPreferences = async () => {
    try {
      setIsPreferencesLoading(true);
      const response = await axios.get('notifications/preferences/');
      setPreferences({ ...defaultPreferences, ...response.data });
      setPreferencesError(null);
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setPreferencesError('Failed to fetch notification preferences');
    } finally {
      setIsPreferencesLoading(false);
    }
  };

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value };
      await axios.put('notifications/preferences/update_current/', updatedPreferences);
      setPreferences(updatedPreferences);
      toast.success('Notification preference updated');
    } catch (err) {
      console.error('Error updating notification preference:', err);
      toast.error('Failed to update notification preference');
    }
  };

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const renderNotificationPreferences = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">Notification Preferences</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive notifications</p>
          </div>
        </div>
      </div>

      {preferencesError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{preferencesError}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Email Notifications */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card-hover">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Email Notifications</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {Object.entries(preferences)
              .filter(([key]) => key.startsWith('email_'))
              .map(([key, value]) => (
                <div key={key} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      {key.replace('email_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive email notifications for {key.replace('email_', '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {value ? 'On' : 'Off'}
                    </span>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card-hover">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Push Notifications</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {Object.entries(preferences)
              .filter(([key]) => key.startsWith('push_'))
              .map(([key, value]) => (
                <div key={key} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      {key.replace('push_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive push notifications for {key.replace('push_', '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {value ? 'On' : 'Off'}
                    </span>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-card-hover">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">In-App Notifications</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {Object.entries(preferences)
              .filter(([key]) => key.startsWith('in_app_'))
              .map(([key, value]) => (
                <div key={key} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-card-hover transition-colors">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      {key.replace('in_app_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive in-app notifications for {key.replace('in_app_', '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${value ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {value ? 'On' : 'Off'}
                    </span>
                    <Switch
                      checked={value}
                      onChange={(checked) => updateNotificationPreference(key as keyof NotificationPreferences, checked)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const [profileFirstName, setProfileFirstName] = useState(user?.first_name || '');
  const [profileLastName, setProfileLastName] = useState(user?.last_name || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const response = await axios.put('auth/profile/update/', {
        username: profileUsername,
        email: profileEmail,
        first_name: profileFirstName,
        last_name: profileLastName
      });
      toast.success('Profile updated successfully');
      setProfileError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPasswordLoading(true);
      const response = await axios.post('auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      toast.success('Password changed successfully');
      setPasswordError(null);
      setPasswordSuccess(response.data.message);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const [privacy, setPrivacy] = useState(user?.profile_visibility || 'public');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  const handlePrivacyChange = async (newPrivacy: string) => {
    setPrivacyLoading(true);
    try {
      await axios.put('auth/profile/update/', {
        profile_visibility: newPrivacy
      });
      setPrivacy(newPrivacy);
      toast.success(`Account privacy set to ${newPrivacy}`);
      setPrivacyError(null);
    } catch (err) {
      setPrivacyError('Failed to update privacy');
      toast.error('Failed to update privacy');
    } finally {
      setPrivacyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <nav className="space-y-1 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                  activeTab === 'profile'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5" />
                  <span>Privacy</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                  activeTab === 'security'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5" />
                  <span>Security</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center justify-between px-4 py-3 transition-all ${
                  activeTab === 'appearance'
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5" />
                  <span>Appearance</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border p-6">
              {activeTab === 'notifications' && renderNotificationPreferences()}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-dark-text">Edit Profile</h2>
                  <form
                    className="space-y-6"
                    onSubmit={handleProfileSubmit}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">First Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={profileFirstName}
                        onChange={e => setProfileFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Last Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={profileLastName}
                        onChange={e => setProfileLastName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                        required
                      />
                    </div>
                    {profileError && (
                      <div className="text-red-600 dark:text-red-400 text-sm">{profileError}</div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      disabled={profileLoading}
                    >
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>

                  <hr className="my-8" />

                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-dark-text">Change Password</h2>
                  <form
                    className="space-y-6"
                    onSubmit={handlePasswordSubmit}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Current Password</label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">New Password</label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Confirm New Password</label>
                      <input
                        type="password"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    {passwordError && (
                      <div className="text-red-600 dark:text-red-400 text-sm">{passwordError}</div>
                    )}
                    {passwordSuccess && (
                      <div className="text-green-600 dark:text-green-400 text-sm">{passwordSuccess}</div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'privacy' && (
                <div className="max-w-md mx-auto py-12">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-dark-text">Account Privacy</h2>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 dark:text-dark-text">Private</span>
                    <Switch
                      checked={privacy === 'public'}
                      onChange={(checked) => handlePrivacyChange(checked ? 'public' : 'private')}
                    />
                    <span className="text-gray-700 dark:text-dark-text">Public</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {privacy === 'public'
                      ? 'Your profile is visible to everyone.'
                      : 'Your profile is only visible to you and your connections.'}
                  </p>
                  {privacyError && (
                    <div className="text-red-600 dark:text-red-400 text-sm mb-2">{privacyError}</div>
                  )}
                  {privacyLoading && (
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Updating privacy...</div>
                  )}
                </div>
              )}
              {activeTab === 'security' && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Security settings coming soon...</p>
                </div>
              )}
              {activeTab === 'appearance' && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Appearance settings coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
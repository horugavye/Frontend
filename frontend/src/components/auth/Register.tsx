import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle, FaApple, FaUser, FaPhone } from 'react-icons/fa';
import { HiMail } from 'react-icons/hi';
import { FaRegCommentDots } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import Logo from '../Logo';
import PersonalityTagSelector from '../PersonalityTagSelector';
import InterestCreator from '../InterestCreator';

const tagColorMap: Record<string, string> = {
  purple: '#a78bfa', // Tailwind purple-400
  blue: '#60a5fa',   // Tailwind blue-400
  green: '#34d399',  // Tailwind green-400
  orange: '#fb923c', // Tailwind orange-400
  pink: '#f472b6',   // Tailwind pink-400
};

const Register: React.FC = () => {
  console.log('[Register] Render');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, loginWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);
  const [sessionTags, setSessionTags] = useState<{ name: string; color: string }[]>([]);
  const [personalityTags, setPersonalityTags] = useState<{ name: string; color: string }[]>([]);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showInterestCreator, setShowInterestCreator] = useState(false);
  const [location, setLocation] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [justRegistered, setJustRegistered] = useState(false);

  console.log('[Register] isAuthenticated =', isAuthenticated, 'loading =', loading);

  useEffect(() => {
    console.log('[Register useEffect] isAuthenticated:', isAuthenticated);
    if (isAuthenticated && !justRegistered) {
      console.log('[Register useEffect] Navigating to /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, justRegistered]);

  useEffect(() => {
    if (!username && fullName) {
      setUsername(fullName);
    }
  }, [fullName]);

  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
    } else if (password.length < 8) {
      setPasswordStrength('Password is too short.');
    } else if ([
      'password', '123456', '12345678', 'qwerty', 'abc123', 'password1', '111111', '123123', '12345', '123456789', '1234', '1q2w3e4r', 'admin', 'letmein', 'welcome', 'monkey', 'login', 'princess', 'qwertyuiop', 'solo', 'passw0rd', 'starwars'
    ].includes(password.toLowerCase())) {
      setPasswordStrength('This password is too common.');
    } else if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password)) {
      setPasswordStrength('Strong password!');
    } else {
      setPasswordStrength('Password should include uppercase, lowercase, number, and special character.');
    }
  }, [password]);

  if (loading) {
    return null; // or a spinner if you prefer
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Validation check:', { username, email, password, confirmPassword, interests, personalityTags, bio, location });
    if (!personalityTags || personalityTags.length === 0) {
      console.warn('No personality tags selected:', personalityTags);
    }
    const hasValidInterests = Array.isArray(interests) && interests.filter(i => i && i.trim()).length > 0;
    const hasValidTags = Array.isArray(personalityTags) && personalityTags.filter(t => t && t.name && t.name.trim()).length > 0;
    if (!username || !email || !password || !confirmPassword || !bio || !location || !hasValidInterests || !hasValidTags) {
      setError('Please complete all required fields, including bio, location, at least one interest and one personality tag.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const usernamePattern = /^[\w.@+-]+$/;
    if (!usernamePattern.test(username)) {
      setError('Username may contain only letters, numbers, and @/./+/-/_ characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await register({
        username,
        email,
        password,
        confirmPassword,
        interests,
        personality_tags: personalityTags,
        bio,
        location,
        first_name: fullName.split(' ')[0] || fullName,
        last_name: fullName.split(' ').slice(1).join(' ') || '',
      });
      if (result && result.userId) {
        navigate(`/connections/${result.userId}`);
      } else {
        setJustRegistered(true);
        navigate('/connectionrequests?suggested=1');
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        // Show all backend error messages
        const messages = Object.values(err.response.data).flat().join(' ');
        setError(messages);
      } else {
        setError(err.message || 'Registration failed');
      }
      setPassword('');
      setConfirmPassword('');
      document.getElementById('password')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = () => {
    document.getElementById('email')?.focus();
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        setError('');
        await loginWithGoogle(response.access_token);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Google registration failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google registration failed. Please try again.');
    }
  });

  const handleAppleLogin = () => {
    setError('Apple registration is not implemented yet');
  };

  const handleNext = () => {
    // Validate step 1 fields
    if (!fullName || !email || !username || !password || !confirmPassword || !bio || !location) {
      setError('Please fill in all required fields: Full Name, Email, Username, Password, Confirm Password, Bio, and Location');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const usernamePattern = /^[\w.@+-]+$/;
    if (!usernamePattern.test(username)) {
      setError('Username may contain only letters, numbers, and @/./+/-/_ characters.');
      return;
    }
    
    setError('');
    setStep(2);
  };

  const handlePrev = () => {
    setError('');
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-dark-bg dark:to-gray-800 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-[500px] sm:max-w-[600px] mx-auto">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 w-full">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <img src="/favicon.svg" alt="Superlink Logo" className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </p>
              <p className="mt-3 sm:mb-4 text-sm sm:text-base text-gray-600 dark:text-gray-300">Fill out the form below to create your account. Add your interests and personality tags to help others get to know you better.</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button 
                onClick={handleEmailRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiMail className="text-lg sm:text-xl" />
                Sign up with Email
              </button>
            </div>

            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>

            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm" role="alert">
                  <span className="block font-medium">{error}</span>
                </div>
              )}

              {/* Progress bar and step indicator */}
              <div className="mb-4 sm:mb-6">
                <div className="flex justify-between items-center mb-2">
                  <img src="/favicon.svg" alt="Superlink Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Step {step} of 2</span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300`} style={{ width: step === 1 ? '50%' : '100%' }}></div>
                </div>
              </div>

              {step === 1 && (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center w-full max-w-md">
                    <div className="flex flex-col items-center mb-4 sm:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-3 sm:mb-4">
                        <FaUser className="text-white text-2xl sm:text-4xl" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-purple-600 mb-1 text-center">Welcome to SuperLink</h2>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300 text-center">Let's get you connected with amazing people</p>
                    </div>
                    <div className="w-full space-y-3 sm:space-y-4">
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Full Name *"
                        />
                      </div>
                      <div className="relative">
                        <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          required
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          pattern="[\w.@+-]+"
                          className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Username (letters, numbers, @/./+/-/_) *"
                        />
                      </div>
                      <div className="relative">
                        <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Email Address *"
                        />
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Password *"
                        />
                        {passwordStrength && (
                          <p className={`mt-1 text-xs ${passwordStrength === 'Strong password!' ? 'text-green-600' : 'text-red-500'}`}>{passwordStrength}</p>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Confirm Password *"
                        />
                      </div>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Phone Number (Optional)"
                        />
                      </div>
                      <div className="relative">
                        <FaRegCommentDots className="absolute left-3 top-3 sm:top-4 text-gray-400 text-base sm:text-lg" />
                        <textarea
                          id="bio"
                          name="bio"
                          rows={3}
                          required
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          className="w-full pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
                          placeholder="Short Bio *"
                        />
                      </div>
                      <div className="relative">
                        <input
                          id="location"
                          name="location"
                          type="text"
                          required
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="Location *"
                        />
                      </div>
                    </div>
                    <div className="flex w-full justify-end mt-6 sm:mt-8">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg sm:rounded-xl transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Details</h2>
                  {/* Personality Tags */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Personality Tags <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                      {sessionTags.map(tag => (
                        <div
                          key={tag.name}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1 font-semibold rounded-full text-xs sm:text-sm shadow-md text-white"
                          style={{ backgroundColor: tagColorMap[tag.color] || '#a78bfa' }}
                        >
                          <span>{tag.name}</span>
                          <span
                            role="button"
                            onClick={() => {
                              setPersonalityTags(personalityTags.filter(t => t.name !== tag.name));
                              setSessionTags(sessionTags.filter(t => t.name !== tag.name));
                            }}
                            className="cursor-pointer text-white/80 hover:text-white ml-1 leading-none"
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTagSelector(true)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl transition-colors duration-200"
                    >
                      {personalityTags.length === 0 ? '+ Add Personality Tags' : 'Edit Personality Tags'}
                    </button>
                    <PersonalityTagSelector
                      open={showTagSelector}
                      onClose={() => setShowTagSelector(false)}
                      value={personalityTags.map(t => t.name)}
                      onChange={(names: string[]) => {
                        const updated = sessionTags.filter(t => names.includes(t.name));
                        setPersonalityTags(updated);
                      }}
                      onSessionTagsChange={tags => {
                        setSessionTags(tags);
                        setPersonalityTags(tags);
                      }}
                    />
                    {error && personalityTags.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">You must select at least one personality tag.</p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">Select or create at least one personality tag *</div>
                    <p className="text-xs text-gray-400 italic mt-1">e.g. Creative, Analytical, Leader, Empathetic, Innovative, Detail-Oriented, Collaborative, Independent, Optimistic, Realistic, Adventurous, Cautious, Extroverted, Introverted, Logical, Intuitive</p>
                  </div>
                  {/* Interests */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Interests <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                      {interests.map(interest => (
                        <div key={interest} className="flex items-center gap-1 px-2 sm:px-3 py-1 font-semibold rounded-full text-xs sm:text-sm shadow-md bg-purple-100 text-purple-700">
                          <span>{interest}</span>
                          <span
                            role="button"
                            onClick={() => setInterests(interests.filter(i => i !== interest))}
                            className="cursor-pointer text-purple-400 hover:text-purple-600 ml-1 leading-none"
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInterestCreator(true)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl transition-colors duration-200"
                    >
                      {interests.length === 0 ? '+ Add Interests' : 'Edit Interests'}
                    </button>
                    <InterestCreator
                      open={showInterestCreator}
                      onClose={() => setShowInterestCreator(false)}
                      value={interests}
                      onChange={setInterests}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Create at least one interest *</p>
                    <p className="text-xs text-gray-400 italic mt-1">e.g. Music, Technology, Sports</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {['Programming', 'AI', 'Machine Learning', 'Web Development', 'Mobile Development', 'Cloud Computing', 'Cybersecurity', 'Data Science', 'UI/UX Design', 'DevOps'].map(interest => {
                        const isSelected = interests.includes(interest);
                        return (
                          <span
                            key={interest}
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-colors duration-150 cursor-pointer select-none ${isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}`}
                            onClick={() => {
                              if (!isSelected) {
                                setInterests([...interests, interest]);
                              }
                            }}
                          >
                            {interest}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-card-hover hover:bg-gray-200 dark:hover:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg sm:rounded-xl transition-colors duration-200"
                    >
                      Previous
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              By signing up, you agree to the{' '}
              <Link to="/terms" className="text-gray-900 dark:text-gray-200 hover:underline">Terms and Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-gray-900 dark:text-gray-200 hover:underline">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 
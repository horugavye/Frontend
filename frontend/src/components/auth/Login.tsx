import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { HiMail } from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password: '***' });
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('Calling login function...');
      await login(email, password);
      // Set flag to show prototype modal after login
      localStorage.setItem('showPrototypeModal', 'true');
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error in component:', err);
      setError(err.message || 'Invalid email or password');
      // Clear password field on error
      setPassword('');
      // Focus the password field
      document.getElementById('password')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = () => {
    document.getElementById('email')?.focus();
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setIsLoading(true);
        setError('');
        await loginWithGoogle(response.access_token);
        // Set flag to show prototype modal after login
        localStorage.setItem('showPrototypeModal', 'true');
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
    }
  });

  const handleAppleLogin = () => {
    setError('Apple login is not implemented yet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-dark-bg dark:to-gray-800 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8 xl:gap-16">
        {/* Left side - App Description - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:block w-full max-w-[500px]">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Connect with your community in a meaningful way
          </h2>
          <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-600 dark:text-gray-300">
            <p>
              Superlink is a rating-based social platform that helps you connect with like-minded individuals and share your thoughts in a more meaningful way.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mt-0.5 sm:mt-1 flex-shrink-0">
                  <span className="text-xs sm:text-sm">⭐</span>
                </div>
                <p className="text-sm sm:text-base">Rate and be rated by the community to build trust and credibility</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mt-0.5 sm:mt-1 flex-shrink-0">
                  <span className="text-xs sm:text-sm">💬</span>
                </div>
                <p className="text-sm sm:text-base">Engage in meaningful discussions with people who share your interests</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mt-0.5 sm:mt-1 flex-shrink-0">
                  <span className="text-xs sm:text-sm">🤝</span>
                </div>
                <p className="text-sm sm:text-base">Build lasting connections based on shared values and interests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-[400px] sm:max-w-[440px] lg:ml-auto">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 w-full">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <img src="/favicon.svg" alt="Superlink Logo" className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Superlink</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Don't have an account?{' '}
                <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                  Sign up for free
                </Link>
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button 
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaGoogle className="text-lg sm:text-xl" />
                Log in with Google
              </button>

              <button 
                onClick={handleEmailLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiMail className="text-lg sm:text-xl" />
                Log in with Email
              </button>

              <button 
                onClick={handleAppleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-black hover:bg-gray-900 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaApple className="text-lg sm:text-xl" />
                Log in with Apple
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
            
              <div className="space-y-1 sm:space-y-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Email address"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-dark-card-hover border border-gray-200 dark:border-dark-border rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Password"
                />
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg sm:rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
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

export default Login; 
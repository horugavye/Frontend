import React, { FC, useState, useEffect } from 'react';
import { RealTimeSuggestion } from '../types/messenger';
import { realTimeSuggestionApi } from '../services/api';
import { 
  SparklesIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  BoltIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

interface MessageSuggestionsProps {
  conversationId: string;
  isDarkMode: boolean;
  onSuggestionSelect: (suggestion: RealTimeSuggestion) => void;
  onSuggestionAccept?: (suggestion: RealTimeSuggestion) => void;
  onSuggestionReject?: (suggestion: RealTimeSuggestion) => void;
  className?: string;
  variant?: 'button' | 'input-icon';
}

const MessageSuggestions: FC<MessageSuggestionsProps> = ({
  conversationId,
  isDarkMode,
  onSuggestionSelect,
  onSuggestionAccept,
  onSuggestionReject,
  className = '',
  variant = 'button'
}) => {
  const [suggestions, setSuggestions] = useState<RealTimeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const generateSuggestions = async (prompt?: string) => {
    if (!conversationId) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log('Generating suggestions for conversation:', conversationId);
      console.log('Custom prompt:', prompt);
      
      const response = await realTimeSuggestionApi.generateSuggestions(
        conversationId,
        ['quick_reply', 'context_based', 'topic_suggestion'],
        3,
        prompt
      );
      
      console.log('Received suggestions:', response.data.suggestions);
      setSuggestions(response.data.suggestions || []);
      setCustomPrompt(''); // Clear prompt after generation
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: RealTimeSuggestion) => {
    try {
      onSuggestionAccept?.(suggestion);
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error accepting suggestion:', err);
    }
  };

  const handleRejectSuggestion = async (suggestion: RealTimeSuggestion) => {
    try {
      onSuggestionReject?.(suggestion);
      // Remove from local state
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
    }
  };

  const getSuggestionColor = (type: string, index: number) => {
    const colors = [
      'bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50',
      'bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/50',
      'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
      'bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50'
    ];
    return colors[index % colors.length];
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'quick_reply':
        return <BoltIcon className="w-4 h-4" />;
      case 'context_based':
        return <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />;
      case 'topic_suggestion':
        return <LightBulbIcon className="w-4 h-4" />;
      default:
        return <SparklesIcon className="w-4 h-4" />;
    }
  };

  const getSuggestionGradient = (type: string, index: number) => {
    const gradients = [
      'from-purple-500/20 via-purple-600/10 to-purple-700/5',
      'from-cyan-500/20 via-cyan-600/10 to-cyan-700/5',
      'from-emerald-500/20 via-emerald-600/10 to-emerald-700/5',
      'from-orange-500/20 via-orange-600/10 to-orange-700/5'
    ];
    return gradients[index % gradients.length];
  };

  useEffect(() => {
    if (isOpen) {
      generateSuggestions();
    }
  }, [conversationId, isOpen]);

  // Always render if we have a conversationId, even if no suggestions
  if (!conversationId) {
    return null;
  }

  // Input icon variant - compact version for inside input field
  if (variant === 'input-icon') {
    return (
      <div className={`${className} relative`}>
        {/* AI Assistant Icon Button - compact version */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-full transition-all duration-300 ease-out ${
            isDarkMode 
              ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700/80 shadow-lg shadow-purple-500/20' 
              : 'text-purple-600 hover:text-purple-700 hover:bg-gray-100/80 shadow-lg shadow-purple-500/20'
          } ${isOpen ? 'bg-purple-100/80 dark:bg-purple-900/40 scale-110' : 'scale-100'}`}
          title="AI Message Assistant"
        >
          <SparklesIcon className="w-4 h-4" />
        </button>

        {/* Suggestions Container */}
        {isOpen && (
          <div className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 w-80 sm:w-96 md:w-[420px] lg:w-[480px] max-h-[400px] sm:max-h-[500px] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border backdrop-blur-sm z-40 animate-in slide-in-from-bottom-2 duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
              : 'bg-white/95 border-gray-200/50 shadow-gray-900/20'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${
              isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className={`p-1.5 sm:p-2 rounded-full ${
                  isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <SparklesIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <span className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    AI Assistant
                  </span>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Smart message suggestions
                  </p>
                </div>
                {suggestions.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium ${
                    isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {suggestions.length}
                  </span>
                )}
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {/* Custom Prompt Input */}
              <div className="space-y-2">
                <label className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Custom Request (Optional)
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Make it more casual' or 'Ask about their weekend'"
                    className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  <button
                    onClick={() => generateSuggestions(customPrompt)}
                    disabled={generating}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                      generating
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                    } ${
                      isDarkMode 
                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {generating ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                  isDarkMode 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              {/* Loading State */}
              {generating && (
                <div className={`flex items-center justify-center py-6 sm:py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  <span className="text-xs sm:text-sm">Generating suggestions...</span>
                </div>
              )}

              {/* Suggestions List */}
              {!generating && suggestions.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Suggested Messages
                  </h3>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className={`relative p-2.5 sm:p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                        getSuggestionColor(suggestion.suggestion_type, index)
                      } ${
                        isDarkMode 
                          ? 'hover:bg-gray-700/50 hover:border-purple-500/50' 
                          : 'hover:bg-gray-50 hover:border-purple-500/50'
                      }`}
                      onClick={() => {
                        onSuggestionSelect(suggestion);
                        setSelectedSuggestion(suggestion.id);
                      }}
                    >
                      {/* Suggestion Header */}
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          {getSuggestionIcon(suggestion.suggestion_type)}
                          <span className={`text-xs font-medium capitalize ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {suggestion.suggestion_type.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                            isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {Math.round(suggestion.confidence_score * 100)}%
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptSuggestion(suggestion);
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              isDarkMode 
                                ? 'text-green-400 hover:text-green-300 hover:bg-green-500/20' 
                                : 'text-green-600 hover:text-green-700 hover:bg-green-100'
                            }`}
                            title="Accept suggestion"
                          >
                            <CheckIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectSuggestion(suggestion);
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              isDarkMode 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                            }`}
                            title="Reject suggestion"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Suggestion Content */}
                      <p className={`text-xs sm:text-sm leading-relaxed ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>
                        {suggestion.content}
                      </p>

                      {/* Reasoning (if available) */}
                      {suggestion.context?.reasoning && (
                        <div className={`mt-1.5 sm:mt-2 text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <span className="font-medium">Why:</span> {suggestion.context.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!generating && suggestions.length === 0 && !error && (
                <div className={`text-center py-6 sm:py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">Click the button above to generate suggestions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Button variant - full version
  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          isDarkMode 
            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 hover:border-purple-500/50' 
            : 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 hover:border-purple-300'
        } ${isOpen ? 'ring-2 ring-purple-500/50' : ''}`}
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="text-sm font-medium">AI Suggestions</span>
        {suggestions.length > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-200 text-purple-700'
          }`}>
            {suggestions.length}
          </span>
        )}
      </button>

      {/* Full Suggestions Panel */}
      {isOpen && (
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 sm:w-96 md:w-[420px] lg:w-[480px] max-h-[500px] sm:max-h-[600px] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border backdrop-blur-sm z-40 animate-in slide-in-from-bottom-2 duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50 shadow-gray-900/50' 
            : 'bg-white/95 border-gray-200/50 shadow-gray-900/20'
        }`}>
          {/* Same content as input-icon variant but with more space */}
          <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          }`}>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`p-1.5 sm:p-2 rounded-full ${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <SparklesIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <span className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  AI Message Assistant
                </span>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Smart message suggestions
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
            {/* Custom Prompt Input */}
            <div className="space-y-2">
              <label className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Custom Request (Optional)
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., 'Make it more casual' or 'Ask about their weekend'"
                  className={`flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700/50 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                />
                <button
                  onClick={() => generateSuggestions(customPrompt)}
                  disabled={generating}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    generating
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 active:scale-95'
                  } ${
                    isDarkMode 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {generating ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${
                isDarkMode 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Loading State */}
            {generating && (
              <div className={`flex items-center justify-center py-6 sm:py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                <span className="text-xs sm:text-sm">Generating suggestions...</span>
              </div>
            )}

            {/* Suggestions List */}
            {!generating && suggestions.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Suggested Messages
                </h3>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`relative p-2.5 sm:p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                      getSuggestionColor(suggestion.suggestion_type, index)
                    } ${
                      isDarkMode 
                        ? 'hover:bg-gray-700/50 hover:border-purple-500/50' 
                        : 'hover:bg-gray-50 hover:border-purple-500/50'
                    }`}
                    onClick={() => {
                      onSuggestionSelect(suggestion);
                      setSelectedSuggestion(suggestion.id);
                    }}
                  >
                    {/* Suggestion Header */}
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        {getSuggestionIcon(suggestion.suggestion_type)}
                        <span className={`text-xs font-medium capitalize ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {suggestion.suggestion_type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-purple-500/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {Math.round(suggestion.confidence_score * 100)}%
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptSuggestion(suggestion);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-green-400 hover:text-green-300 hover:bg-green-500/20' 
                              : 'text-green-600 hover:text-green-700 hover:bg-green-100'
                          }`}
                          title="Accept suggestion"
                        >
                          <CheckIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectSuggestion(suggestion);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' 
                              : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                          }`}
                          title="Reject suggestion"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Suggestion Content */}
                    <p className={`text-xs sm:text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {suggestion.content}
                    </p>

                    {/* Reasoning (if available) */}
                    {suggestion.context?.reasoning && (
                      <div className={`mt-1.5 sm:mt-2 text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span className="font-medium">Why:</span> {suggestion.context.reasoning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!generating && suggestions.length === 0 && !error && (
              <div className={`text-center py-6 sm:py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Click the button above to generate suggestions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSuggestions;
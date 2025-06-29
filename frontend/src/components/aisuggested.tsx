import { FC, useEffect, useState } from 'react';
import { connectionApi } from '../services/api';
import Modal from './Modal';

interface FriendSuggestion {
  id: number;
  name: string;
  mutualFriends: number;
  bio: string;
  avatarUrl: string;
  aiReason: string;
  username?: string;
  location?: string;
  timeAgo?: string;
  matchPercent?: number;
  matchLevel?: string;
  skills?: string[];
  connectionStatus?: 'connect' | 'pending' | 'connected';
  connectionRequestId?: number;
}

const mockSkills = [
  ['Python', 'Data Science'],
  ['React', 'UI/UX'],
  ['Machine Learning', 'AI'],
  ['JavaScript', 'Backend'],
];

// Helper function to handle avatar URLs with fallback to /default.png
const getAvatarUrl = (avatarPath: string) => {
  if (avatarPath && avatarPath.startsWith('http')) return avatarPath;
  return '/default.png';
};

const SuggestedFriends: FC = () => {
  const [aiSuggestedFriends, setAiSuggestedFriends] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoModalIdx, setInfoModalIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [connectingIds, setConnectingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Move fetchAlchemyFriends out of useEffect for reuse
  const fetchAlchemyFriends = async () => {
    setLoading(true);
    try {
      const res = await connectionApi.getAISuggestedFriends();
      // Map backend data to FriendSuggestion, use backend status fields
      const mapped = (res.data || []).map((s: any, idx: number) => ({
        id: s.suggested_user.id,
        name: s.suggested_user.name || s.suggested_user.username,
        mutualFriends: s.mutual_connections || 0,
        bio: s.suggested_user.role || '',
        avatarUrl: getAvatarUrl(s.suggested_user.avatarUrl || s.suggested_user.avatar || ''),
        aiReason: (s.match_highlights && s.match_highlights[0]) || 'Similar educational background and professional trajectory in tech',
        username: s.suggested_user.username ? `@${s.suggested_user.username}` : '@username',
        location: s.suggested_user.location || 'Austin, TX',
        timeAgo: '5 hours ago',
        matchPercent: 76 + idx, // mock
        matchLevel: s.match_level, // use backend value if available
        skills: mockSkills[idx % mockSkills.length],
        connectionStatus: s.connection_status || 'connect',
        connectionRequestId: s.connection_request_id,
      })).filter((friend: FriendSuggestion) => friend.bio !== 'user');
      setAiSuggestedFriends(mapped);
    } catch (e) {
      setAiSuggestedFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlchemyFriends();
  }, []);

  const handleConnect = async (friendId: number) => {
    if (connectingIds.has(friendId)) return;
    setConnectingIds(prev => new Set([...prev, friendId]));
    setAiSuggestedFriends(prev => prev.map(f => f.id === friendId ? { ...f, connectionStatus: 'pending' } : f));
    setError(null);
    try {
      const res = await connectionApi.sendConnectionRequest(friendId);
      // Store the connectionRequestId from backend response if available
      const requestId = res?.data?.id;
      setAiSuggestedFriends(prev => prev.map(f => f.id === friendId ? { ...f, connectionStatus: 'pending', connectionRequestId: requestId } : f));
    } catch (e: any) {
      setError('Failed to send connection request.');
      setAiSuggestedFriends(prev => prev.map(f => f.id === friendId ? { ...f, connectionStatus: 'connect', connectionRequestId: undefined } : f));
    } finally {
      setConnectingIds(prev => { const s = new Set(prev); s.delete(friendId); return s; });
    }
  };

  // Cancel connection request
  const handleCancelRequest = async (requestId: number, friendId: number) => {
    if (!requestId || connectingIds.has(friendId)) return;
    setConnectingIds(prev => new Set([...prev, friendId]));
    setError(null);
    try {
      await connectionApi.cancelConnectionRequest(requestId);
      setAiSuggestedFriends(prev => prev.map(f => f.id === friendId ? { ...f, connectionStatus: 'connect', connectionRequestId: undefined } : f));
    } catch (e: any) {
      setError('Failed to cancel connection request.');
    } finally {
      setConnectingIds(prev => { const s = new Set(prev); s.delete(friendId); return s; });
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-800 max-w-7xl w-full mx-auto">
      <div className="flex items-center mb-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1">
          AI Suggested Friends
        </h2>
        <button
          className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Refresh"
          onClick={fetchAlchemyFriends}
          disabled={loading}
        >
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 0 6 6.35" /></svg>
        </button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Smart recommendations based on AI analysis</div>
      <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
        ) : aiSuggestedFriends.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm">No AI suggestions found.</div>
        ) : (
          (showAll ? aiSuggestedFriends : aiSuggestedFriends.slice(0, 5)).map((friend, idx) => (
            <div
              key={friend.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow border border-gray-100 dark:border-gray-800 flex flex-col gap-2 relative"
            >
              {/* Profile Row */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shadow-md"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).src = '/default.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold text-base truncate block">
                      {friend.name}
                    </span>
                    {/* Info Icon Button */}
                    <button
                      className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      title="Show AI explanation"
                      onClick={() => setInfoModalIdx(idx)}
                      type="button"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="8.5" r="1" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{friend.location}</span>
                  </div>
                </div>
              </div>
              {/* Match Row */}
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">{friend.matchPercent}% match</span>
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">{friend.matchLevel}</span>
              </div>
              {/* Skills */}
              <div className="flex flex-wrap gap-2 mt-1">
                {friend.skills && friend.skills.map((skill, i) => (
                  <span key={skill} className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{skill}</span>
                ))}
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">+1</span>
              </div>
              {/* Connect/Cancel Button */}
              {friend.connectionStatus === 'connect' && (
                <button
                  className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-semibold shadow hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${connectingIds.has(friend.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleConnect(friend.id)}
                  disabled={connectingIds.has(friend.id)}
                >
                  {connectingIds.has(friend.id) ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Connect
                    </>
                  )}
                </button>
              )}
              {friend.connectionStatus === 'pending' && (
                <button
                  className={`mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold shadow hover:bg-red-200 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all ${connectingIds.has(friend.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => friend.connectionRequestId && handleCancelRequest(friend.connectionRequestId, friend.id)}
                  disabled={connectingIds.has(friend.id)}
                >
                  {connectingIds.has(friend.id) ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Canceling...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      Cancel
                    </>
                  )}
                </button>
              )}
              {/* Info Modal */}
              {infoModalIdx === idx && (
                <Modal isOpen={true} onClose={() => setInfoModalIdx(null)} title={`Why did AI suggest ${friend.name}?`}>
                  <div className="text-gray-700 dark:text-gray-200 text-base">
                    {friend.aiReason}
                  </div>
                </Modal>
              )}
            </div>
          ))
        )}
        {aiSuggestedFriends.length > 5 && (
          <button
            className="w-full mt-2 py-2 bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? 'View Less' : 'View More'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestedFriends; 
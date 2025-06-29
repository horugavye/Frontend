import React from 'react';

type EmojiCategory = 'Smileys & People' | 'Animals & Nature' | 'Food & Drink' | 'Activities' | 'Objects' | 'Symbols';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isDarkMode: boolean;
}

const EMOJI_CATEGORIES: Record<EmojiCategory, string[]> = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
  'Food & Drink': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯'],
  'Activities': ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋', '⛳️', '⛸️', '🎣', '🤿', '🎽', '🛹', '🛷', '⛷️', '🏂️', '🏋️‍♀️', '🤼‍♀️', '🤸‍♀️', '⛹️‍♀️'],
  'Objects': ['⌚️', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👍', '👎', '👏', '🙌', '👋', '🤝']
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, isDarkMode }) => {
  const [activeCategory, setActiveCategory] = React.useState<EmojiCategory>('Smileys & People');

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-80">
      <div className="flex gap-1 mb-2 overflow-x-auto pb-2">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as EmojiCategory)}
            className={`px-2 py-1 text-sm rounded-lg whitespace-nowrap ${
              activeCategory === category
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {EMOJI_CATEGORIES[category as EmojiCategory][0]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xl transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker; 
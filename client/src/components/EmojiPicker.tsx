import React, { useEffect, useRef, useState } from 'react';
import { Smile, Heart, ThumbsUp, Star, Coffee, Gamepad2 } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('faces');

  const emojiCategories = {
    faces: {
      name: 'الوجوه',
      icon: <Smile className="w-4 h-4" />,
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
        '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
      ]
    },
    hearts: {
      name: 'القلوب',
      icon: <Heart className="w-4 h-4" />,
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
        '💋', '💌', '💐', '🌹', '🌺', '🌻', '🌷', '🌸', '💒', '💍'
      ]
    },
    gestures: {
      name: 'الإيماءات',
      icon: <ThumbsUp className="w-4 h-4" />,
      emojis: [
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
        '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
        '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'
      ]
    },
    symbols: {
      name: 'الرموز',
      icon: <Star className="w-4 h-4" />,
      emojis: [
        '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️',
        '🗨️', '🗯️', '💭', '💤', '💮', '♨️', '💈', '🛑', '⭐', '🌟',
        '✨', '⚡', '🔥', '💎', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅'
      ]
    },
    food: {
      name: 'الطعام',
      icon: <Coffee className="w-4 h-4" />,
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
        '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸'
      ]
    },
    games: {
      name: 'الألعاب',
      icon: <Gamepad2 className="w-4 h-4" />,
      emojis: [
        '🎮', '🕹️', '🎯', '🎲', '🃏', '🀄', '🎰', '🎳', '🏓', '🏸',
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱'
      ]
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-12 left-0 right-0 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-2xl z-50 max-w-sm"
    >
      {/* Header with categories */}
      <div className="flex border-b border-gray-600 p-2 overflow-x-auto">
        {Object.entries(emojiCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveCategory(key);
            }}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              activeCategory === key
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={category.name}
          >
            {category.icon}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="ml-auto p-2 text-gray-400 hover:text-white flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Emoji grid */}
      <div className="p-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[activeCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEmojiSelect(emoji);
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors text-lg"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
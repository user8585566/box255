import React from 'react';

interface TextPredictionProps {
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
}

const TextPrediction: React.FC<TextPredictionProps> = ({ 
  suggestions, 
  onSuggestionSelect, 
  isVisible 
}) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-lg z-40 max-h-32 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionSelect(suggestion)}
          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default TextPrediction;

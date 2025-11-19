import React from 'react';
import { Sparkles, Music, User, Disc, Search } from 'lucide-react';
import type { NaturalLanguageResponse, SearchSuggestion } from '../hooks/useNaturalLanguageSearch';
import '../styles/components/NaturalLanguageResults.css';

interface NaturalLanguageResultsProps {
  response: NaturalLanguageResponse;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onExecuteSearch: (query: string) => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'album': return <Disc size={16} />;
    case 'artist': return <User size={16} />;
    case 'track': return <Music size={16} />;
    case 'genre': return <Search size={16} />;
    default: return <Music size={16} />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'album': return 'Album';
    case 'artist': return 'Artist';
    case 'track': return 'Track';
    case 'genre': return 'Genre';
    default: return 'Music';
  }
};

export const NaturalLanguageResults: React.FC<NaturalLanguageResultsProps> = ({
  response,
  onSuggestionClick,
  onExecuteSearch,
}) => {
  if (!response.isNaturalLanguage) {
    return null;
  }

  return (
    <div className="natural-language-results">
      <div className="nl-header">
        <div className="nl-header-icon">
          <Sparkles size={20} />
        </div>
        <div className="nl-header-content">
          <h3>AI Music Recommendations</h3>
          {response.interpretation && (
            <p className="nl-interpretation">{response.interpretation}</p>
          )}
        </div>
      </div>

      {response.recommendations && response.recommendations.length > 0 && (
        <div className="nl-recommendations">
          <h4>Recommended for you:</h4>
          <div className="nl-recommendations-grid">
            {response.recommendations.map((rec, index) => (
              <div
                key={index}
                className="nl-recommendation-card"
                onClick={() => onExecuteSearch(rec.searchQuery)}
              >
                <div className="nl-rec-header">
                  <div className="nl-rec-icon">
                    {getIconForType(rec.type)}
                  </div>
                  <div className="nl-rec-type">
                    {getTypeLabel(rec.type)}
                  </div>
                </div>
                <div className="nl-rec-content">
                  <h5 className="nl-rec-title">
                    {rec.type === 'album' && rec.artist 
                      ? `${rec.name} by ${rec.artist}`
                      : rec.name}
                  </h5>
                  <p className="nl-rec-reason">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {response.searchSuggestions && response.searchSuggestions.length > 0 && (
        <div className="nl-search-suggestions">
          <h4>Try these searches:</h4>
          <div className="nl-suggestions-list">
            {response.searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="nl-suggestion-button"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <div className="nl-suggestion-icon">
                  {getIconForType(suggestion.type)}
                </div>
                <div className="nl-suggestion-content">
                  <span className="nl-suggestion-text">{suggestion.displayText}</span>
                  <span className="nl-suggestion-reason">{suggestion.reason}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {response.additionalSearchTerms && response.additionalSearchTerms.length > 0 && (
        <div className="nl-additional-terms">
          <h4>Related genres & moods:</h4>
          <div className="nl-terms-list">
            {response.additionalSearchTerms.map((term, index) => (
              <button
                key={index}
                className="nl-term-tag"
                onClick={() => onExecuteSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
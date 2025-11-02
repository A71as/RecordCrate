import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  isOpen: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  id,
  label,
  value,
  options,
  isOpen,
  onOpen,
  onClose,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const defaultValue = options[0]?.value;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const uppercaseLabel = label.toUpperCase();
  const isUsingDefault = selectedOption?.value === defaultValue;
  const triggerText = isUsingDefault
    ? uppercaseLabel
    : `${uppercaseLabel}: ${selectedOption?.label ?? ''}`;

  return (
    <div ref={containerRef} className={`discography-filter ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className={`discography-filter-trigger ${isUsingDefault ? '' : 'active'}`}
        onClick={() => (isOpen ? onClose() : onOpen(id))}
      >
        <span className="discography-filter-text">{triggerText}</span>
        <ChevronDown size={14} />
      </button>
      {isOpen && (
        <ul className="discography-filter-options">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`discography-filter-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export type MusicFilterKey = 'genre' | 'decade' | 'rating' | 'explicit';

export type MusicFilterState = Record<MusicFilterKey, string>;

interface MusicFilterBarProps {
  filters: MusicFilterState;
  onChange: (key: MusicFilterKey, value: string) => void;
  genres?: string[];
  decades?: string[];
  label?: string;
  className?: string;
}

const ratingOptions: DropdownOption[] = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 ★ (95-100)' },
  { value: '4', label: '≥ 4 ★ (85-94)' },
  { value: '3', label: '≥ 3 ★ (70-84)' },
  { value: '2', label: '≥ 2 ★ (55-69)' },
];

const explicitOptions: DropdownOption[] = [
  { value: 'all', label: 'Any Explicitness' },
  { value: 'explicit', label: 'Explicit' },
  { value: 'clean', label: 'Non-explicit' },
];

// Intentionally avoid default decades in UI when no release years are available.

export const MusicFilterBar: React.FC<MusicFilterBarProps> = ({
  filters,
  onChange,
  genres = [],
  decades = [],
  label = 'Browse By',
  className,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const genreDropdownOptions = useMemo<DropdownOption[]>(() => {
    const sortedGenres = Array.from(
      new Set(
        genres
          .map((genre) => genre.trim())
          .filter((genre) => genre.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: 'all', label: 'All Genres' },
      ...sortedGenres.map((genre) => ({ value: genre, label: genre })),
    ];
  }, [genres]);

  const decadeDropdownOptions = useMemo<DropdownOption[]>(() => {
    // Do not invent decades when none are provided; show only "Any Decade"
    const source = decades.length > 0 ? decades : [];

    const normalized = Array.from(
      new Set(
        source
          .map((decade) => decade.trim())
          .filter((decade) => /^(18|19|20)\d0s$/.test(decade))
      )
    ).sort((a, b) => b.localeCompare(a));

    return [{ value: 'all', label: 'Any Decade' }, ...normalized.map((decade) => ({ value: decade, label: decade }))];
  }, [decades]);

  const handleOpen = useCallback((id: string) => {
    setOpenDropdown((current) => (current === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  const handleSelect = useCallback(
    (key: MusicFilterKey, value: string) => {
      onChange(key, value);
    },
    [onChange]
  );

  return (
    <section className={className ? `discography-controls ${className}` : 'discography-controls'}>
      <div className="discography-controls-label">{label}</div>
      <div className="discography-filters">
        <FilterDropdown
          id="genre"
          label="Genre"
          value={filters.genre}
          options={genreDropdownOptions}
          isOpen={openDropdown === 'genre'}
          onOpen={handleOpen}
          onClose={handleClose}
          onSelect={(value) => handleSelect('genre', value)}
        />
        <FilterDropdown
          id="decade"
          label="Decade"
          value={filters.decade}
          options={decadeDropdownOptions}
          isOpen={openDropdown === 'decade'}
          onOpen={handleOpen}
          onClose={handleClose}
          onSelect={(value) => handleSelect('decade', value)}
        />
        <FilterDropdown
          id="rating"
          label="User Rating"
          value={filters.rating}
          options={ratingOptions}
          isOpen={openDropdown === 'rating'}
          onOpen={handleOpen}
          onClose={handleClose}
          onSelect={(value) => handleSelect('rating', value)}
        />
        <FilterDropdown
          id="explicit"
          label="Explicit"
          value={filters.explicit}
          options={explicitOptions}
          isOpen={openDropdown === 'explicit'}
          onOpen={handleOpen}
          onClose={handleClose}
          onSelect={(value) => handleSelect('explicit', value)}
        />
      </div>
    </section>
  );
};

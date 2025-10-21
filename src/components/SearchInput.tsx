import React, { forwardRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    ariaExpanded?: boolean;
    ariaControls?: string;
    ariaDescribedBy?: string;
    disabled?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
    value,
    onChange,
    onSubmit,
    onClear,
    onKeyDown,
    onFocus,
    onBlur,
    placeholder = "Search for albums, artists...",
    ariaExpanded = false,
    ariaControls,
    ariaDescribedBy,
    disabled = false
}, ref) => {
    return (
        <>
            <SearchIcon size={20} className="search-icon" />
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                className="search-input"
                aria-label="Search for albums and artists"
                aria-describedby={ariaDescribedBy}
                aria-expanded={ariaExpanded ? "true" : "false"}
                aria-autocomplete="list"
                aria-controls={ariaControls}
                role="combobox"
                disabled={disabled}
            />

            {value && (
                <button
                    type="button"
                    onClick={onClear}
                    className="clear-button"
                    aria-label="Clear search"
                    disabled={disabled}
                >
                    <X size={16} />
                </button>
            )}

            <button
                type="submit"
                className="search-button"
                disabled={disabled}
                onClick={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                Search
            </button>
        </>
    );
});

SearchInput.displayName = 'SearchInput';
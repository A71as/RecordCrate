import React from 'react';
import { Calendar, TrendingUp, User } from 'lucide-react';
import type { FilterType, FilterOption } from '../types';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filterOptions: FilterOption[] = [
  // New Releases
  { id: 'new-releases-week', label: 'This Week', category: 'releases' },
  { id: 'new-releases-month', label: 'This Month', category: 'releases' },
  { id: 'new-releases-year', label: 'This Year', category: 'releases' },
  
  // Popular
  { id: 'popular-week', label: 'Week', category: 'popular' },
  { id: 'popular-month', label: 'Month', category: 'popular' },
  { id: 'popular-year', label: 'Year', category: 'popular' },
  
  // Personal
  { id: 'personal-week', label: 'Week', category: 'personal' },
  { id: 'personal-6months', label: '6 Months', category: 'personal' },
  { id: 'personal-alltime', label: 'All Time', category: 'personal' },
];

export const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'releases':
        return <Calendar size={16} />;
      case 'popular':
        return <TrendingUp size={16} />;
      case 'personal':
        return <User size={16} />;
      default:
        return null;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'releases':
        return 'New Releases';
      case 'popular':
        return 'Most Popular';
      case 'personal':
        return 'Your Music';
      default:
        return '';
    }
  };

  const groupedFilters = filterOptions.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = [];
    }
    acc[filter.category].push(filter);
    return acc;
  }, {} as Record<string, FilterOption[]>);

  return (
    <div className="filter-tabs">
      {Object.entries(groupedFilters).map(([category, filters]) => (
        <div key={category} className="filter-category">
          <div className="filter-category-header">
            {getCategoryIcon(category)}
            <span>{getCategoryTitle(category)}</span>
          </div>
          <div className="filter-buttons">
            {filters.map((filter) => (
              <button
                key={filter.id}
                className={`filter-button ${
                  activeFilter === filter.id ? 'active' : ''
                }`}
                onClick={() => onFilterChange(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
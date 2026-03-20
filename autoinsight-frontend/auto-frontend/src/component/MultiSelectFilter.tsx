import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FacetOption } from '../services/vehicleDataService';

interface MultiSelectFilterProps {
  label: string;
  icon: LucideIcon;
  options: FacetOption[];
  selected: string[];
  emptyLabel?: string;
  onToggle: (value: string) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  icon: Icon,
  options,
  selected,
  emptyLabel = 'No options available',
  onToggle,
}) => {
  const selectedSet = new Set(selected.map((value) => value.toLowerCase()));

  return (
    <div className="results-filter-group">
      <label>
        <Icon size={14} /> {label}
      </label>
      <div className="multi-filter-box">
        {options.length === 0 ? (
          <div className="multi-filter-empty">{emptyLabel}</div>
        ) : (
          options.map((option) => {
            const active = selectedSet.has(option.value.toLowerCase());
            return (
              <button
                type="button"
                key={option.value}
                className={`multi-filter-option ${active ? 'active' : ''}`}
                onClick={() => onToggle(option.value)}
              >
                <span>{option.value}</span>
                <strong>{option.count}</strong>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MultiSelectFilter;

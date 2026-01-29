
import React from 'react';
import { MascotStyle } from '../types';

interface StyleCardProps {
  style: MascotStyle;
  isSelected: boolean;
  onSelect: (style: MascotStyle) => void;
  description: string;
}

const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onSelect, description }) => {
  return (
    <button
      onClick={() => onSelect(style)}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 text-left w-full h-full flex flex-col justify-between group
        ${isSelected 
          ? 'border-pink-400 bg-pink-50 shadow-md scale-[1.02]' 
          : 'border-slate-100 bg-white hover:border-pink-200 hover:shadow-sm'
        }`}
    >
      <div>
        <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-pink-700' : 'text-slate-800'}`}>
          {style}
        </h3>
        <p className="text-xs text-slate-500 leading-tight">
          {description}
        </p>
      </div>
      
      <div className={`mt-3 flex justify-end transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
        <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default StyleCard;

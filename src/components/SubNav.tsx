import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  return (
    <div className="sticky top-16 z-40 bg-cafe-light/95 backdrop-blur-md border-b border-cafe-latte">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 overflow-x-auto py-3 scrollbar-hide flex-nowrap">
          {loading ? (
            <div className="flex space-x-4 flex-nowrap">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse flex-shrink-0" />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => onCategoryClick('all')}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-200 border flex-shrink-0 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-cafe-accent text-white border-cafe-accent'
                    : 'bg-cafe-light text-gray-700 border-cafe-latte hover:border-cafe-accent hover:bg-cafe-beige'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-200 border flex-shrink-0 whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'bg-cafe-accent text-white border-cafe-accent'
                      : 'bg-cafe-light text-gray-700 border-cafe-latte hover:border-cafe-accent hover:bg-cafe-beige'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubNav;



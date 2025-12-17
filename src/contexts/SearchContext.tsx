import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context
interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

// Create the context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider Component
export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom Hook to use the search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
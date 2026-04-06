import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CharacterStats {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
}

export interface CharacterData {
  name: string;
  concept: string;
  lore: string;
  avatarUrl: string;
  stats: CharacterStats;
}

interface CharacterContextType {
  character: CharacterData;
  updateCharacter: (updates: Partial<CharacterData>) => void;
  updateStat: (stat: keyof CharacterStats, value: number) => void;
}

const defaultCharacter: CharacterData = {
  name: 'Unknown Hero',
  concept: 'A mysterious wanderer',
  lore: 'They came from beyond the mountains, with no memory of their past...',
  avatarUrl: 'https://images.unsplash.com/photo-1542458428-21d1209ccdc8?auto=format&fit=crop&q=80&w=600&h=800',
  stats: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    charisma: 10,
  },
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export const CharacterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [character, setCharacter] = useState<CharacterData>(defaultCharacter);

  const updateCharacter = (updates: Partial<CharacterData>) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  };

  const updateStat = (stat: keyof CharacterStats, value: number) => {
    setCharacter((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: value,
      },
    }));
  };

  return (
    <CharacterContext.Provider value={{ character, updateCharacter, updateStat }}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};

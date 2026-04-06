import React from 'react';
import { CharacterProvider, useCharacter, CharacterStats } from './CharacterContext';
import { useState } from 'react';
import { User, Book, ImageIcon, Shield, Zap, Brain, MessageCircle, Hammer, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

const InputForm = () => {
  const { character, updateCharacter, updateStat } = useCharacter();
  const [isForging, setIsForging] = useState(false);

  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    updateStat(stat, value);
  };

  const handleForge = async () => {
    setIsForging(true);
    try {
      // 1. Call Firebase Cloud Function to generate backstory
      const generateBackstory = httpsCallable(functions, 'generateBackstory');
      const result = await generateBackstory({
        name: character.name,
        concept: character.concept,
        stats: character.stats
      });

      const newLore = (result.data as any).backstory;
      updateCharacter({ lore: newLore });

      // 2. Save to Firestore
      await addDoc(collection(db, 'characters'), {
        name: character.name,
        concept: character.concept,
        lore: newLore,
        stats: character.stats,
        avatarUrl: character.avatarUrl,
        createdAt: new Date()
      });

      alert('Character forged and saved successfully!');
    } catch (error) {
      console.error('Error forging character:', error);
      alert('Failed to forge character. Please try again.');
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col gap-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-amber-500 border-b border-slate-700 pb-2 mb-2 flex items-center gap-2">
        <User size={24} />
        Character Details
      </h2>
      
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            value={character.name}
            onChange={(e) => updateCharacter({ name: e.target.value })}
            placeholder="Character Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Concept</label>
          <input
            type="text"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            value={character.concept}
            onChange={(e) => updateCharacter({ concept: e.target.value })}
            placeholder="e.g. Rogue Scholar, Exiled Knight"
          />
        </div>

        <div className="pt-2 border-t border-slate-700">
          <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center gap-2">
            Attributes
          </h3>
          <div className="space-y-3">
            {(Object.keys(character.stats) as Array<keyof CharacterStats>).map((stat) => (
              <div key={stat}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-400 capitalize">{stat}</label>
                  <span className="text-sm font-bold text-amber-500">{character.stats[stat]}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={character.stats[stat]}
                  onChange={(e) => handleStatChange(stat, parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <ImageIcon size={16} /> Avatar Image URL
          </label>
          <input
            type="url"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            value={character.avatarUrl}
            onChange={(e) => updateCharacter({ avatarUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <Book size={16} /> Background Lore
          </label>
          <textarea
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none h-32"
            value={character.lore}
            onChange={(e) => updateCharacter({ lore: e.target.value })}
            placeholder="Write the character's backstory here..."
          />
        </div>

        <button
          onClick={handleForge}
          disabled={isForging || !character.name || !character.concept}
          className="w-full mt-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
        >
          {isForging ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Forging Destiny...
            </>
          ) : (
            <>
              <Hammer size={20} />
              Forge Character
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className={`bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center gap-4 hover:border-${color}-500/50 transition-colors`}>
    <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400 capitalize">{title}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
    </div>
  </div>
);

const StatsDisplay = () => {
  const { character } = useCharacter();

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col gap-6 overflow-y-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
          {character.name || 'Unnamed'}
        </h1>
        <p className="text-xl text-slate-300 italic mb-6">{character.concept || 'No Concept'}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard title="Strength" value={character.stats.strength} icon={<Shield size={24} />} color="red" />
          <StatCard title="Agility" value={character.stats.agility} icon={<Zap size={24} />} color="green" />
          <StatCard title="Intelligence" value={character.stats.intelligence} icon={<Brain size={24} />} color="blue" />
          <StatCard title="Charisma" value={character.stats.charisma} icon={<MessageCircle size={24} />} color="purple" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
          <Book size={20} className="text-amber-500"/> Epic Lore
        </h3>
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50 h-full min-h-[200px]">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-serif text-lg">
            {character.lore || 'Their story is yet to be written...'}
          </p>
        </div>
      </div>
    </div>
  );
};

const Portrait = () => {
  const { character } = useCharacter();

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col items-center justify-center">
      <div className="relative group w-full aspect-[3/4] max-w-md">
        {/* Frame Outer Decoration */}
        <div className="absolute -inset-4 bg-gradient-to-b from-amber-500 to-amber-700 rounded-lg opacity-20 blur-lg group-hover:opacity-40 transition duration-500"></div>

        {/* Frame Structure */}
        <div className="relative w-full h-full p-3 bg-slate-900 border-4 border-double border-amber-600/80 rounded-lg shadow-2xl overflow-hidden">
          {/* Inner metallic border */}
          <div className="absolute inset-2 border border-amber-400/30 rounded z-10 pointer-events-none"></div>

          {/* The Image */}
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover rounded shadow-inner"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1542458428-21d1209ccdc8?auto=format&fit=crop&q=80&w=600&h=800'; // Fallback
              }}
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded border border-slate-700">
              <User size={64} className="text-slate-600" />
            </div>
          )}

          {/* Decorative Corner Elements */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/80"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/80"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/80"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/80"></div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <h2 className="text-2xl font-serif font-bold text-amber-500 tracking-wider uppercase">
          {character.name || 'Unknown'}
        </h2>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto h-full">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
            <Shield className="text-amber-500" size={32} />
            RPG Character Creator
          </h1>
          <p className="text-slate-400 mt-2">Forge your hero's destiny</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] min-h-[800px]">
          {/* Column 1: Input Form */}
          <div className="col-span-1 h-full">
            <InputForm />
          </div>

          {/* Column 2: Stats and Lore */}
          <div className="col-span-1 h-full">
            <StatsDisplay />
          </div>

          {/* Column 3: Portrait Frame */}
          <div className="col-span-1 h-full">
            <Portrait />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <CharacterProvider>
      <Dashboard />
    </CharacterProvider>
  );
}

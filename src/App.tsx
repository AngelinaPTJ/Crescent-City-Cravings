import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  Store, 
  Users, 
  Coins, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  Minus,
  ArrowRight,
  Music,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  GameState, 
  IngredientType, 
  BakingItem, 
  Customer 
} from './types';
import { 
  INGREDIENTS, 
  RECIPES, 
  CUSTOMER_NAMES, 
  INITIAL_STATE 
} from './constants';

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('ccc_game_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, lastUpdate: Date.now() };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'kitchen' | 'store' | 'counter'>('kitchen');
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);
  const gameLoopRef = useRef<number | null>(null);

  // Save game
  useEffect(() => {
    localStorage.setItem('ccc_game_state', JSON.stringify(state));
  }, [state]);

  const addNotification = useCallback((text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Game Loop
  useEffect(() => {
    const tick = () => {
      setState(prev => {
        const now = Date.now();
        const delta = (now - prev.lastUpdate) / 1000;

        // Update Baking
        const updatedBaking = prev.activeBaking.map(item => {
          if (item.isDone) return item;
          const elapsed = (now - item.startTime) / 1000;
          if (elapsed >= item.duration) {
            return { ...item, isDone: true };
          }
          return item;
        });

        // Update Customers
        const updatedCustomers = prev.customers.map(c => ({
          ...c,
          patience: Math.max(0, c.patience - delta * 2) // Lose 2 patience per second
        })).filter(c => c.patience > 0);

        // New Customer Arrival
        let newCustomers = [...updatedCustomers];
        if (newCustomers.length < 5 && Math.random() < 0.05 * delta) {
          const recipeIds = prev.unlockedRecipes;
          const randomRecipe = recipeIds[Math.floor(Math.random() * recipeIds.length)];
          const newCustomer: Customer = {
            id: Math.random().toString(36).substr(2, 9),
            name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
            orderRecipeId: randomRecipe,
            patience: 100,
            maxPatience: 100,
            arrivalTime: now
          };
          newCustomers.push(newCustomer);
        }

        return {
          ...prev,
          activeBaking: updatedBaking,
          customers: newCustomers,
          lastUpdate: now
        };
      });
    };

    gameLoopRef.current = window.setInterval(tick, 1000);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  // Actions
  const buyIngredient = (type: IngredientType) => {
    const cost = INGREDIENTS[type].cost;
    if (state.money >= cost) {
      setState(prev => ({
        ...prev,
        money: prev.money - cost,
        inventory: {
          ...prev.inventory,
          [type]: prev.inventory[type] + 5
        }
      }));
      addNotification(`Bought 5 ${INGREDIENTS[type].name}`);
    } else {
      addNotification("Not enough money!");
    }
  };

  const startBaking = (recipeId: string) => {
    const recipe = RECIPES[recipeId];
    
    // Check ingredients
    const hasIngredients = Object.entries(recipe.ingredients).every(([type, amount]) => {
      return state.inventory[type as IngredientType] >= amount;
    });

    if (!hasIngredients) {
      addNotification("Missing ingredients!");
      return;
    }

    // Consume ingredients
    const newInventory = { ...state.inventory };
    Object.entries(recipe.ingredients).forEach(([type, amount]) => {
      newInventory[type as IngredientType] -= amount;
    });

    const newItem: BakingItem = {
      id: Math.random().toString(36).substr(2, 9),
      recipeId,
      startTime: Date.now(),
      duration: recipe.bakeTime,
      isDone: false
    };

    setState(prev => ({
      ...prev,
      inventory: newInventory,
      activeBaking: [...prev.activeBaking, newItem]
    }));
  };

  const serveCustomer = (customerId: string, bakingItemId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    const bakingItem = state.activeBaking.find(b => b.id === bakingItemId);

    if (!customer || !bakingItem || !bakingItem.isDone) return;

    const recipe = RECIPES[bakingItem.recipeId];
    const tip = Math.floor(recipe.basePrice * (customer.patience / 100) * 0.5);
    const totalEarned = recipe.basePrice + tip;

    setState(prev => {
      const newExp = prev.experience + 10;
      const newLevel = Math.floor(newExp / 100) + 1;
      
      if (newLevel > prev.level) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#4B0082', '#008000']
        });
        addNotification(`LEVEL UP! You are now level ${newLevel}`);
      }

      // Unlock new recipes based on level
      let newUnlocked = [...prev.unlockedRecipes];
      if (newLevel >= 2 && !newUnlocked.includes('pralines')) newUnlocked.push('pralines');
      if (newLevel >= 3 && !newUnlocked.includes('king_cake')) newUnlocked.push('king_cake');

      return {
        ...prev,
        money: prev.money + totalEarned,
        experience: newExp,
        level: newLevel,
        unlockedRecipes: newUnlocked,
        customers: prev.customers.filter(c => c.id !== customerId),
        activeBaking: prev.activeBaking.filter(b => b.id !== bakingItemId)
      };
    });

    addNotification(`Served ${customer.name}! Earned $${totalEarned}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="p-6 bg-nola-wood/80 border-b border-nola-gold/20 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-nola-gold rounded-full text-nola-wood">
            <ChefHat size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-nola-gold">Crescent City Cravings</h1>
            <p className="text-xs text-nola-gold/60 uppercase tracking-widest font-mono">New Orleans Bakery Sim</p>
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-nola-gold/30">
            <Coins className="text-nola-gold" size={18} />
            <span className="font-mono font-bold text-lg">${state.money}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-nola-purple/30">
            <Award className="text-nola-purple" size={18} />
            <span className="font-mono font-bold">LVL {state.level}</span>
            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-nola-purple transition-all duration-500" 
                style={{ width: `${state.experience % 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Navigation Rail */}
        <nav className="w-full md:w-24 bg-nola-wood/40 border-r border-nola-gold/10 flex md:flex-col justify-around md:justify-center gap-8 p-4">
          <NavButton 
            active={activeTab === 'kitchen'} 
            onClick={() => setActiveTab('kitchen')} 
            icon={<Flame size={24} />} 
            label="Kitchen" 
          />
          <NavButton 
            active={activeTab === 'counter'} 
            onClick={() => setActiveTab('counter')} 
            icon={<Users size={24} />} 
            label="Counter" 
            badge={state.customers.length}
          />
          <NavButton 
            active={activeTab === 'store'} 
            onClick={() => setActiveTab('store')} 
            icon={<Store size={24} />} 
            label="Store" 
          />
        </nav>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'kitchen' && (
              <motion.div 
                key="kitchen"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Recipe List */}
                <section>
                  <h2 className="text-3xl mb-6 flex items-center gap-3">
                    <Music className="text-nola-purple" />
                    Baking Menu
                  </h2>
                  <div className="space-y-4">
                    {state.unlockedRecipes.map(id => {
                      const recipe = RECIPES[id];
                      const canBake = Object.entries(recipe.ingredients).every(([type, amount]) => 
                        state.inventory[type as IngredientType] >= amount
                      );

                      return (
                        <div key={id} className="jazzy-card flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{recipe.icon}</span>
                            <div>
                              <h3 className="text-xl font-bold text-nola-gold">{recipe.name}</h3>
                              <p className="text-sm text-white/60 italic">{recipe.description}</p>
                              <div className="flex gap-3 mt-2">
                                {Object.entries(recipe.ingredients).map(([type, amount]) => amount > 0 && (
                                  <span key={type} className="text-[10px] uppercase font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                                    {amount} {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => startBaking(id)}
                            disabled={!canBake}
                            className="jazzy-button flex items-center gap-2"
                          >
                            <Plus size={18} /> Bake
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Ovens */}
                <section>
                  <h2 className="text-3xl mb-6 flex items-center gap-3">
                    <Flame className="text-orange-500" />
                    The Ovens
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {state.activeBaking.length === 0 ? (
                      <div className="col-span-full py-12 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30">
                        <Clock size={48} className="mb-4 opacity-20" />
                        <p>No treats in the oven right now...</p>
                      </div>
                    ) : (
                      state.activeBaking.map(item => {
                        const recipe = RECIPES[item.recipeId];
                        const progress = item.isDone ? 100 : Math.min(100, ((Date.now() - item.startTime) / (item.duration * 1000)) * 100);
                        
                        return (
                          <motion.div 
                            layout
                            key={item.id} 
                            className={`jazzy-card relative overflow-hidden ${item.isDone ? 'border-nola-green shadow-[0_0_15px_rgba(0,128,0,0.3)]' : ''}`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">{recipe.icon}</span>
                              <span className="font-bold">{recipe.name}</span>
                            </div>
                            
                            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                              <motion.div 
                                className={`h-full ${item.isDone ? 'bg-nola-green' : 'bg-orange-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                            
                            <div className="flex justify-between items-center text-xs font-mono">
                              {item.isDone ? (
                                <span className="text-nola-green flex items-center gap-1">
                                  <CheckCircle2 size={12} /> READY TO SERVE
                                </span>
                              ) : (
                                <span className="text-white/40 flex items-center gap-1">
                                  <Clock size={12} /> BAKING...
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'counter' && (
              <motion.div 
                key="counter"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl mx-auto"
              >
                <h2 className="text-3xl mb-8 flex items-center gap-3">
                  <Users className="text-nola-gold" />
                  Service Counter
                </h2>

                <div className="space-y-6">
                  {state.customers.length === 0 ? (
                    <div className="py-20 text-center text-white/30">
                      <p className="text-xl italic">The shop is quiet... for now.</p>
                    </div>
                  ) : (
                    state.customers.map(customer => {
                      const order = RECIPES[customer.orderRecipeId];
                      const readyItem = state.activeBaking.find(b => b.recipeId === customer.orderRecipeId && b.isDone);

                      return (
                        <motion.div 
                          layout
                          key={customer.id}
                          className="jazzy-card flex flex-col sm:flex-row items-center gap-6 p-6"
                        >
                          <div className="text-center sm:text-left">
                            <div className="w-16 h-16 bg-nola-purple/30 rounded-full flex items-center justify-center text-2xl font-serif mb-2 mx-auto sm:mx-0">
                              {customer.name[0]}
                            </div>
                            <h4 className="font-bold text-nola-gold">{customer.name}</h4>
                          </div>

                          <div className="flex-1 w-full">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-sm uppercase tracking-widest text-white/40">Order</span>
                              <span className="text-nola-gold font-bold">${order.basePrice}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                              <span className="text-3xl">{order.icon}</span>
                              <span className="text-lg">{order.name}</span>
                            </div>
                          </div>

                          <div className="w-full sm:w-48">
                            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Patience</p>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${
                                  customer.patience > 50 ? 'bg-nola-green' : 
                                  customer.patience > 20 ? 'bg-nola-gold' : 'bg-red-500'
                                }`}
                                style={{ width: `${customer.patience}%` }}
                              />
                            </div>
                          </div>

                          <button 
                            disabled={!readyItem}
                            onClick={() => readyItem && serveCustomer(customer.id, readyItem.id)}
                            className={`jazzy-button w-full sm:w-auto flex items-center justify-center gap-2 ${!readyItem ? 'opacity-20 grayscale' : ''}`}
                          >
                            Serve <ArrowRight size={18} />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'store' && (
              <motion.div 
                key="store"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Inventory Display */}
                  <div className="lg:col-span-1">
                    <h2 className="text-3xl mb-6 flex items-center gap-3">
                      <Package className="text-nola-green" />
                      Pantry
                    </h2>
                    <div className="jazzy-card space-y-4">
                      {Object.entries(state.inventory).map(([type, amount]) => (
                        <div key={type} className="flex justify-between items-center p-2 border-b border-white/5 last:border-0">
                          <span className="capitalize text-white/80">{type}</span>
                          <span className="font-mono font-bold text-nola-gold">{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Market */}
                  <div className="lg:col-span-2">
                    <h2 className="text-3xl mb-6 flex items-center gap-3">
                      <Store className="text-nola-gold" />
                      French Market
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.values(INGREDIENTS).map(ing => (
                        <div key={ing.id} className="jazzy-card flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-lg">{ing.name}</h4>
                            <p className="text-nola-gold font-mono text-sm">${ing.cost} for 5 units</p>
                          </div>
                          <button 
                            onClick={() => buyIngredient(ing.id as IngredientType)}
                            className="p-3 bg-nola-green/20 text-nola-green rounded-lg hover:bg-nola-green hover:text-white transition-colors"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Notifications */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-nola-wood border border-nola-gold/50 px-6 py-3 rounded-xl shadow-2xl text-nola-gold font-bold flex items-center gap-3"
            >
              <Music size={18} />
              {n.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4B0082_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#D4AF37_0%,transparent_50%)]" />
        
        {/* Floating Music Notes */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '110%', 
              opacity: 0,
              rotate: 0 
            }}
            animate={{ 
              y: '-10%', 
              opacity: [0, 1, 1, 0],
              rotate: Math.random() * 360 
            }}
            transition={{ 
              duration: 10 + Math.random() * 20, 
              repeat: Infinity, 
              delay: Math.random() * 20,
              ease: "linear"
            }}
            className="absolute text-nola-gold"
          >
            <Music size={24 + Math.random() * 24} />
          </motion.div>
        ))}
      </div>

    </div>
  );
}

function NavButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
        active ? 'bg-nola-gold text-nola-wood shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-nola-wood">
          {badge}
        </span>
      )}
    </button>
  );
}


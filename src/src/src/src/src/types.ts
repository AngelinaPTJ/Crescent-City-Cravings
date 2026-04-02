export type IngredientType = 'flour' | 'sugar' | 'butter' | 'yeast' | 'pecans' | 'cinnamon';

export interface Ingredient {
  id: IngredientType;
  name: string;
  cost: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Record<IngredientType, number>;
  bakeTime: number; // in seconds
  basePrice: number;
  icon: string;
}

export interface BakingItem {
  id: string;
  recipeId: string;
  startTime: number;
  duration: number;
  isDone: boolean;
}

export interface Customer {
  id: string;
  name: string;
  orderRecipeId: string;
  patience: number; // 0 to 100
  maxPatience: number;
  arrivalTime: number;
}

export interface GameState {
  money: number;
  inventory: Record<IngredientType, number>;
  unlockedRecipes: string[];
  activeBaking: BakingItem[];
  customers: Customer[];
  lastUpdate: number;
  experience: number;
  level: number;
}

import { Recipe, Ingredient, IngredientType } from './types';

export const INGREDIENTS: Record<IngredientType, Ingredient> = {
  flour: { id: 'flour', name: 'Flour', cost: 5 },
  sugar: { id: 'sugar', name: 'Sugar', cost: 8 },
  butter: { id: 'butter', name: 'Butter', cost: 12 },
  yeast: { id: 'yeast', name: 'Yeast', cost: 15 },
  pecans: { id: 'pecans', name: 'Pecans', cost: 25 },
  cinnamon: { id: 'cinnamon', name: 'Cinnamon', cost: 10 },
};

export const RECIPES: Record<string, Recipe> = {
  beignets: {
    id: 'beignets',
    name: 'Classic Beignets',
    description: 'Deep-fried dough covered in a mountain of powdered sugar.',
    ingredients: { flour: 2, sugar: 1, yeast: 1, butter: 1, pecans: 0, cinnamon: 0 },
    bakeTime: 10,
    basePrice: 45,
    icon: '🍩',
  },
  pralines: {
    id: 'pralines',
    name: 'Pecan Pralines',
    description: 'Sweet, creamy, and packed with Southern pecans.',
    ingredients: { flour: 0, sugar: 3, butter: 2, pecans: 2, yeast: 0, cinnamon: 0 },
    bakeTime: 15,
    basePrice: 65,
    icon: '🍬',
  },
  king_cake: {
    id: 'king_cake',
    name: 'Mardi Gras King Cake',
    description: 'A colorful New Orleans tradition. Watch out for the baby!',
    ingredients: { flour: 4, sugar: 2, butter: 2, yeast: 1, cinnamon: 2, pecans: 0 },
    bakeTime: 30,
    basePrice: 120,
    icon: '👑',
  },
};

export const CUSTOMER_NAMES = [
  'Louis', 'Ella', 'Miles', 'Duke', 'Billie', 'Thelonious', 'Satchmo', 'Etta', 'Nina', 'Chet'
];

export const INITIAL_STATE = {
  money: 200,
  inventory: {
    flour: 10,
    sugar: 10,
    butter: 5,
    yeast: 5,
    pecans: 0,
    cinnamon: 0,
  },
  unlockedRecipes: ['beignets'],
  activeBaking: [],
  customers: [],
  lastUpdate: Date.now(),
  experience: 0,
  level: 1,
};

import { MenuItem, Burger } from '@/types/order';

export const BURGERS: Burger[] = [
  {
    id: '1',
    name: 'Llokallita',
    price: 13,
    description: 'Hamburguesa económica',
    cookingTime: 8,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '2',
    name: 'Saqpalla',
    price: 17,
    description: 'Hamburguesa clásica',
    cookingTime: 8,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '3',
    name: 'Runtu',
    price: 20,
    description: 'Hamburguesa con huevo',
    cookingTime: 10,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '4',
    name: 'Miski',
    price: 22,
    description: 'Hamburguesa con piña',
    cookingTime: 10,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '5',
    name: 'Soqta',
    price: 30,
    description: 'Hamburguesa con chorizo',
    cookingTime: 12,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '6',
    name: 'Munay',
    price: 30,
    description: 'Hamburguesa con tocino y cebolla crispy',
    cookingTime: 12,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: '7',
    name: 'Sumaq',
    price: 30,
    description: 'Hamburguesa premium',
    cookingTime: 12,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop&crop=center'
  },
  {
    id: 's1',
    name: 'Salchipapa',
    price: 20,
    description: 'Salchicha con papas fritas',
    cookingTime: 8,
    category: 'burger',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop&crop=center'
  }
];

export const SIDES: MenuItem[] = [];

export const DRINKS: MenuItem[] = [
  {
    id: 'd1',
    name: 'Limonada con hierva buena',
    price: 5,
    description: 'Refresco natural',
    category: 'drink'
  },
  {
    id: 'd2',
    name: 'Mocochinchi',
    price: 5,
    description: 'Bebida tradicional',
    category: 'drink'
  },
  {
    id: 'd3',
    name: 'Gaseosas 350ml',
    price: 3,
    description: 'Salvietti o Coca Cola',
    category: 'drink'
  },
  {
    id: 'd4',
    name: 'Cerveza',
    price: 20,
    description: 'Cerveza fría',
    category: 'drink'
  }
];

export const EXTRAS: MenuItem[] = [
  {
    id: 'e1',
    name: 'Tocino',
    price: 7,
    description: 'Porción adicional de tocino',
    category: 'extra'
  },
  {
    id: 'e2',
    name: 'Jamón',
    price: 7,
    description: 'Porción adicional de jamón',
    category: 'extra'
  },
  {
    id: 'e3',
    name: 'Chorizo',
    price: 10,
    description: 'Porción adicional de chorizo',
    category: 'extra'
  },
  {
    id: 'e4',
    name: 'Carne extra',
    price: 10,
    description: 'Porción adicional de carne',
    category: 'extra'
  },
  {
    id: 's2',
    name: 'Porción de papas fritas',
    price: 7,
    description: 'Papas fritas crujientes',
    category: 'extra'
  }
];

export const ALL_MENU_ITEMS: MenuItem[] = [
  ...BURGERS,
  ...SIDES,
  ...DRINKS,
  ...EXTRAS
];
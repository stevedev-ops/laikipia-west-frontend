export const LAIKIPIA_CONSTITUENCIES = {
  'Laikipia East': [
    'Nanyuki',
    'Thingithu',
    'Ngobit',
    'Tigithi',
    'Umande'
  ],
  'Laikipia West': [
    'Ol Moran',
    'Rumuruti Township',
    'Githiga',
    'Marmanet',
    'Igwamiti',
    'Salama'
  ],
  'Laikipia North': [
    'Mukogodo East',
    'Mukogodo West',
    'Segera',
    'Sosian'
  ]
};

export const ALL_LAIKIPIA_WARDS = Object.values(LAIKIPIA_CONSTITUENCIES).flat();

export const FUNCTION_CATEGORIES = [
  { id: 'chama', label: 'Chama / Table Banking', icon: 'Users', color: 'bg-emerald-500' },
  { id: 'church', label: 'Church Service / Harambee', icon: 'Church', color: 'bg-blue-500' },
  { id: 'funeral', label: 'Funeral / Burial', icon: 'Heart', color: 'bg-slate-500' },
  { id: 'youth', label: 'Youth / Sports Tournament', icon: 'Trophy', color: 'bg-amber-500' },
  { id: 'women', label: 'Women Group Baraza', icon: 'Sparkles', color: 'bg-purple-500' },
  { id: 'market', label: 'Market Baraza / Townhall', icon: 'Store', color: 'bg-rose-500' },
  { id: 'rally', label: 'Major Campaign Rally', icon: 'Megaphone', color: 'bg-red-600' },
  { id: 'other', label: 'Community Function', icon: 'Calendar', color: 'bg-indigo-500' },
];

import { Activity, Gift, MessageSquare, Settings, User, Users, BookTextIcon } from 'lucide-react';

// Predefined quick actions to avoid recreation
export const QUICK_ACTIONS = [
  {
    title: 'Community Spaces',
    description: 'See what others are sharing, discuss and collaborate',
    icon: Users,
    color: 'primary' as const,
    url: '/spaces'
  },
  {
    title: 'Library',
    description: 'An endless supply of community generated content',
    icon: BookTextIcon,
    color: 'warning' as const,
    url: '/library'
  },
  {
    title: 'Referrals',
    description: 'Tell more people about the community',
    icon: Gift,
    color: 'destructive' as const,
    url: '/referrals'
  },
  {
    title: 'Questionnaires',
    description: 'Earn credits by filling questionnaires',
    icon: MessageSquare,
    color: 'accent' as const,
    comingSoon: true,
    url: ''
  },
];
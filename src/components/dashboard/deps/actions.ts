import { Book01FreeIcons, Chat01FreeIcons, Chat01Icon, GiftCard02FreeIcons, Home01FreeIcons, User02FreeIcons } from '@hugeicons/core-free-icons';

// Predefined quick actions to avoid recreation
export const QUICK_ACTIONS = [
  {
    title: 'Community Spaces',
    description: 'See what others are sharing, discuss and collaborate',
    icon: Home01FreeIcons,
    color: 'primary' as const,
    url: '/spaces'
  },
  {
    title: 'Library',
    description: 'An endless supply of community generated content',
    icon: Book01FreeIcons,
    color: 'warning' as const,
    url: '/library'
  },
  {
    title: 'Referrals',
    description: 'Tell more people about the community',
    icon: GiftCard02FreeIcons,
    color: 'destructive' as const,
    url: '/referrals'
  },
  {
    title: 'Chats',
    description: 'Keep up with your favorite people',
    icon: Chat01Icon,
    color: 'accent' as const,
    url: '/chats'
  },
];
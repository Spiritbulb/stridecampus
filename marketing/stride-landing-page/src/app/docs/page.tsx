'use client';
import React from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  Coins, 
  Library, 
  Brain, 
  BarChart3, 
  Shield, 
  Smartphone,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  FileText,
  HelpCircle,
  MessageSquare,
  Settings,
  Zap,
  Target,
  Star,
  Globe,
  Lock,
  Upload,
  Download,
  Search,
  Filter,
  Bell,
  Calendar,
  MapPin,
  Camera,
  Video,
  Mic,
  Code,
  Database,
  Cloud,
  Monitor,
  Tablet,
  Wifi,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  PlayCircle,
  PauseCircle,
  Heart,
  Flag,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Palette,
  Plus,
  Minus,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Grid,
  List,
  Layout,
  Sidebar,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer,
  Hand,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  Hash,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Columns,
  Rows,
  PieChart,
  BarChart,
  LineChart,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  DollarSign,
  Percent,
  Calculator,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Timer,
  Stopwatch,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
  CalendarStar,
  CalendarUser,
  CalendarEdit,
  CalendarTrash,
  CalendarClock,
  CalendarSettings,
  CalendarDownload,
  CalendarUpload,
  CalendarShare,
  CalendarCopy,
  CalendarMove,
  CalendarArchive,
  CalendarUnarchive,
  CalendarRestore,
  CalendarRefresh,
  CalendarSync,
  CalendarPause,
  CalendarPlay,
  CalendarStop,
  CalendarSkip,
  CalendarRepeat,
  CalendarShuffle
} from 'lucide-react';

export default function DocsPage() {
  const docCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of Stride Campus',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-blue-500',
      articles: [
        { slug: 'introduction', title: 'Introduction to Stride Campus', description: 'What is Stride Campus and how it works' },
        { slug: 'signing-up', title: 'Signing Up & Verification', description: 'How to create your account and verify your student status' },
        { slug: 'first-steps', title: 'Your First Steps', description: 'Getting started with your campus community' },
        { slug: 'navigation', title: 'Navigation Guide', description: 'How to navigate the platform and find what you need' }
      ]
    },
    {
      id: 'spaces',
      title: 'Campus Spaces',
      description: 'Understanding and using campus communities',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
      articles: [
        { slug: 'main-campus-space', title: 'Main Campus Space', description: 'Your primary campus community hub' },
        { slug: 'course-spaces', title: 'Course Spaces', description: 'Subject-specific communities and study groups' },
        { slug: 'club-spaces', title: 'Club & Organization Spaces', description: 'Connect with campus clubs and activities' },
        { slug: 'creating-spaces', title: 'Creating Custom Spaces', description: 'How to create your own community spaces' },
        { slug: 'space-management', title: 'Managing Spaces', description: 'Admin tools and space moderation' }
      ]
    },
    {
      id: 'credit-system',
      title: 'Credit System',
      description: 'Earning and spending credits',
      icon: <Coins className="w-6 h-6" />,
      color: 'bg-yellow-500',
      articles: [
        { slug: 'earning-credits', title: 'Earning Credits', description: 'How to earn credits through participation' },
        { slug: 'spending-credits', title: 'Spending Credits', description: 'What you can do with your credits' },
        { slug: 'credit-economy', title: 'Credit Economy', description: 'Understanding the credit system balance' },
        { slug: 'boost-features', title: 'Boost Features', description: 'Using credits to boost your content' }
      ]
    },
    {
      id: 'library',
      title: 'Shared Library',
      description: 'Resource sharing and management',
      icon: <Library className="w-6 h-6" />,
      color: 'bg-purple-500',
      articles: [
        { slug: 'browsing-resources', title: 'Browsing Resources', description: 'Finding and accessing study materials' },
        { slug: 'uploading-resources', title: 'Uploading Resources', description: 'How to share your study materials' },
        { slug: 'resource-types', title: 'Resource Types', description: 'Different types of content you can share' },
        { slug: 'search-and-filter', title: 'Search & Filter', description: 'Finding specific resources quickly' },
        { slug: 'resource-management', title: 'Resource Management', description: 'Organizing and managing your uploads' }
      ]
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Using the AI chat feature',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-indigo-500',
      articles: [
        { slug: 'ai-chat-basics', title: 'AI Chat Basics', description: 'Getting started with AI assistance' },
        { slug: 'study-help', title: 'Study Help', description: 'Using AI for academic support' },
        { slug: 'campus-guidance', title: 'Campus Guidance', description: 'Getting help with campus-related questions' },
        { slug: 'ai-best-practices', title: 'Best Practices', description: 'Getting the most out of AI assistance' }
      ]
    },
    {
      id: 'polls-surveys',
      title: 'Polls & Surveys',
      description: 'Creating and participating in polls',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-pink-500',
      articles: [
        { slug: 'creating-polls', title: 'Creating Polls', description: 'How to create effective polls and surveys' },
        { slug: 'poll-types', title: 'Poll Types', description: 'Different types of polls you can create' },
        { slug: 'participating-polls', title: 'Participating in Polls', description: 'How to vote and provide feedback' },
        { slug: 'poll-analytics', title: 'Poll Analytics', description: 'Understanding poll results and data' }
      ]
    },
    {
      id: 'mobile-app',
      title: 'Mobile App',
      description: 'Using Stride Campus on mobile',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'bg-teal-500',
      articles: [
        { slug: 'mobile-features', title: 'Mobile Features', description: 'Features available on mobile devices' },
        { slug: 'push-notifications', title: 'Push Notifications', description: 'Managing notifications on mobile' },
        { slug: 'offline-access', title: 'Offline Access', description: 'Using the app without internet connection' },
        { slug: 'mobile-tips', title: 'Mobile Tips', description: 'Tips for better mobile experience' }
      ]
    },
    {
      id: 'account-settings',
      title: 'Account & Settings',
      description: 'Managing your account and preferences',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-gray-500',
      articles: [
        { slug: 'profile-management', title: 'Profile Management', description: 'Updating your profile and preferences' },
        { slug: 'privacy-settings', title: 'Privacy Settings', description: 'Controlling your privacy and visibility' },
        { slug: 'notification-settings', title: 'Notification Settings', description: 'Managing how you receive notifications' },
        { slug: 'account-security', title: 'Account Security', description: 'Keeping your account secure' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'How to earn credits', href: '/docs/credit-system/earning-credits' },
    { title: 'Creating your first poll', href: '/docs/polls-surveys/creating-polls' },
    { title: 'Uploading resources', href: '/docs/library/uploading-resources' },
    { title: 'Using AI chat', href: '/docs/ai-assistant/ai-chat-basics' },
    { title: 'Mobile app setup', href: '/docs/mobile-app/mobile-features' },
    { title: 'Privacy settings', href: '/docs/account-settings/privacy-settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Documentation <span className="text-[#f23b36]">Center</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about using Stride Campus effectively. From basic setup to advanced features, 
            find comprehensive guides and tutorials to enhance your campus experience.
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="bg-white border-2 border-gray-100 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:border-[#f23b36] group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 group-hover:text-[#f23b36] transition-colors">{link.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#f23b36] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Documentation Categories */}
        <div className="space-y-12">
          {docCategories.map((category, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className={`${category.color} text-white p-3 rounded-lg mr-4`}>
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.articles.map((article, articleIndex) => (
                  <Link
                    key={articleIndex}
                    href={`/docs/${category.id}/${article.slug}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-[#f23b36] group"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#f23b36] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600">{article.description}</p>
                    <div className="flex items-center mt-3 text-sm text-[#f23b36] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Read more</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
            <p className="text-xl mb-8 opacity-90">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/support"
                className="px-8 py-4 bg-white text-[#f23b36] rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                Visit Support Center <ArrowRight className="ml-2" />
              </Link>
              <Link 
                href="/contact"
                className="px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
              >
                Contact Us <MessageSquare className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

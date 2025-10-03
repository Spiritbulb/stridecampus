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
        { slug: 'signing-up', title: 'Signing Up & Account Setup', description: 'How to create your account and verify your student status' },
        { slug: 'first-steps', title: 'Your First Steps', description: 'Getting started with your campus community' }
      ]
    },
    {
      id: 'features',
      title: 'Platform Features',
      description: 'Understanding and using all platform features',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
      articles: [
        { slug: 'using-spaces', title: 'Using Spaces', description: 'Campus communities and how to participate' },
        { slug: 'student-chat', title: 'Student Chat', description: 'Real-time chat with fellow students' },
        { slug: 'ai-assistant', title: 'AI Assistant (Nia)', description: 'Get help from your AI study buddy' },
        { slug: 'resource-library', title: 'Resource Library', description: 'Share and discover study materials' },
        { slug: 'credit-system', title: 'Credit System', description: 'Earning and spending credits' }
      ]
    },
    {
      id: 'help',
      title: 'Help & FAQ',
      description: 'Common questions and troubleshooting',
      icon: <HelpCircle className="w-6 h-6" />,
      color: 'bg-yellow-500',
      articles: [
        { slug: 'faq', title: 'Frequently Asked Questions', description: 'Quick answers to common questions' }
      ]
    }
  ];

  const quickLinks = [
    { title: 'Getting Started', href: '/docs/getting-started/introduction' },
    { title: 'Using Spaces', href: '/docs/features/using-spaces' },
    { title: 'Student Chat', href: '/docs/features/student-chat' },
    { title: 'AI Assistant (Nia)', href: '/docs/features/ai-assistant' },
    { title: 'Resource Library', href: '/docs/features/resource-library' },
    { title: 'Credit System', href: '/docs/features/credit-system' }
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

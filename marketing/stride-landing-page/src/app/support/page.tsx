'use client';
import React from 'react';
import Link from 'next/link';
import { 
  HelpCircle, 
  MessageSquare, 
  AlertTriangle, 
  Shield, 
  Key, 
  User, 
  Lock, 
  CheckCircle, 
  XCircle, 
  Info, 
  Clock, 
  Calendar, 
  Mail, 
  Phone, 
  ChevronRight,
  ArrowRight,
  ExternalLink,
  FileText,
  Settings,
  Bell,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  Cloud,
  Zap,
  Target,
  Star,
  Users,
  BookOpen,
  Coins,
  Library,
  Brain,
  BarChart3,
  Upload,
  Download,
  Search,
  Filter,
  Camera,
  Video,
  Mic,
  Code,
  Globe,
  MapPin,
  Heart,
  Flag,
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

export default function SupportPage() {
  const supportCategories = [
    {
      id: 'getting-help',
      title: 'Getting Help',
      description: 'How to get support and find answers to your questions',
      icon: <HelpCircle className="w-6 h-6" />,
      color: 'bg-blue-500',
      priority: 'medium',
      articles: [
        { slug: 'getting-help', title: 'Getting Help', description: 'All the ways to get support and find answers' }
      ]
    },
    {
      id: 'account-issues',
      title: 'Account Issues',
      description: 'Problems with your account, login, or profile',
      icon: <User className="w-6 h-6" />,
      color: 'bg-red-500',
      priority: 'high',
      articles: [
        { slug: 'account-issues', title: 'Account Issues', description: 'Login problems, profile issues, and account security' }
      ]
    },
    {
      id: 'auth-migration',
      title: 'Authentication Migration',
      description: 'Important information about our login system transition',
      icon: <Key className="w-6 h-6" />,
      color: 'bg-orange-500',
      priority: 'high',
      articles: [
        { slug: 'new-login-system', title: 'New Login System', description: 'How to set up your account with the new system' },
        { slug: 'password-reset', title: 'Password Reset', description: 'How to reset your password during migration' }
      ]
    }
  ];

  const urgentIssues = [
    {
      title: 'Getting Help',
      description: 'Need assistance? Find all the ways to get support and answers.',
      href: '/support/getting-help/getting-help',
      icon: <HelpCircle className="w-5 h-5" />,
      urgent: false
    },
    {
      title: 'Account Issues',
      description: 'Having trouble with your account? We can help you resolve login and profile issues.',
      href: '/support/account-issues/account-issues',
      icon: <User className="w-5 h-5" />,
      urgent: false
    },
    {
      title: 'Authentication Migration',
      description: 'We\'re transitioning to a new login system. You\'ll need to reset your password.',
      href: '/support/auth-migration/new-login-system',
      icon: <AlertTriangle className="w-5 h-5" />,
      urgent: true
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      icon: <Mail className="w-6 h-6" />,
      contact: 'support@stridecampus.com',
      href: 'mailto:support@stridecampus.com'
    },
    {
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      icon: <MessageSquare className="w-6 h-6" />,
      contact: 'Available 9 AM - 6 PM EST',
      href: '/contact'
    },
    {
      title: 'Community Forum',
      description: 'Get help from other students and our community',
      icon: <Users className="w-6 h-6" />,
      contact: 'Join the discussion',
      href: 'https://community.stridecampus.com'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Support <span className="text-[#f23b36]">Center</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get help with Stride Campus. Find answers to common questions, troubleshoot issues, 
            and connect with our support team when you need assistance.
          </p>
        </div>

        {/* Urgent Issues Alert */}
        <div className="mb-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-bold text-red-900">Important: Authentication Migration</h2>
            </div>
            <p className="text-red-800 mb-4">
              We're transitioning to a new login system for enhanced security. All users will need to reset their passwords. 
              This is a one-time process that cannot be avoided due to privacy and security requirements.
            </p>
            <Link
              href="/support/auth-migration/new-login-system"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Learn More About Migration <ArrowRight className="ml-2" />
            </Link>
          </div>
        </div>

        {/* Quick Help */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {urgentIssues.map((issue, index) => (
              <Link
                key={index}
                href={issue.href}
                className={`border-2 rounded-lg p-6 hover:shadow-lg transition-all duration-300 ${
                  issue.urgent 
                    ? 'border-red-200 bg-red-50 hover:border-red-300' 
                    : 'border-gray-200 bg-white hover:border-[#f23b36]'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className={`${issue.urgent ? 'text-red-600' : 'text-gray-600'} mr-3`}>
                    {issue.icon}
                  </div>
                  <h3 className={`font-semibold ${issue.urgent ? 'text-red-900' : 'text-gray-900'}`}>
                    {issue.title}
                  </h3>
                </div>
                <p className={`text-sm ${issue.urgent ? 'text-red-800' : 'text-gray-600'} mb-3`}>
                  {issue.description}
                </p>
                <div className="flex items-center text-sm text-[#f23b36]">
                  <span>Get help</span>
                  <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Support Categories */}
        <div className="space-y-12 mb-16">
          {supportCategories.map((category, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className={`${category.color} text-white p-3 rounded-lg mr-4`}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-gray-900 mr-3">{category.title}</h2>
                    {category.priority === 'high' && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.articles.map((article, articleIndex) => (
                  <Link
                    key={articleIndex}
                    href={`/support/${category.id}/${article.slug}`}
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

        {/* Contact Methods */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-[#f23b36] group text-center"
              >
                <div className="text-[#f23b36] mb-4 flex justify-center">
                  {method.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#f23b36] transition-colors">
                  {method.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <p className="text-sm font-medium text-[#f23b36]">{method.contact}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Documentation Link */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Need More Detailed Help?</h2>
            <p className="text-xl mb-8 opacity-90">
              Check out our comprehensive documentation for step-by-step guides and tutorials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/docs"
                className="px-8 py-4 bg-white text-[#f23b36] rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                Browse Documentation <ArrowRight className="ml-2" />
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

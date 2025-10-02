'use client';
import React, { useState } from 'react';
import { 
  Users, 
  Award, 
  BarChart3, 
  BookOpen, 
  Mail, 
  Shield, 
  TrendingUp, 
  HeartHandshake,
  Calendar,
  GraduationCap,
  FileText,
  Sparkles,
  ChevronRight,
  Play,
  Coins,
  Gift,
  Library,
  Megaphone,
  Star,
  MessageSquare,
  Brain,
  Upload,
  Download,
  Search,
  Filter,
  Bell,
  Settings,
  Globe,
  Lock,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Users2,
  Bookmark,
  Share2,
  ThumbsUp,
  MessageCircle,
  Eye,
  Clock,
  MapPin,
  Camera,
  Video,
  Mic,
  FileImage,
  FileVideo,
  FileAudio,
  FilePdf,
  FileText as FileTextIcon,
  Code,
  Database,
  Cloud,
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  PlayCircle,
  PauseCircle,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Heart,
  Flag,
  AlertTriangle,
  Info,
  HelpCircle,
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
  List as ListIcon,
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
  CalendarShuffle,
  CalendarHeart as CalendarHeartIcon,
  CalendarStar as CalendarStarIcon,
  CalendarUser as CalendarUserIcon,
  CalendarEdit as CalendarEditIcon,
  CalendarTrash as CalendarTrashIcon,
  CalendarClock as CalendarClockIcon,
  CalendarSettings as CalendarSettingsIcon,
  CalendarDownload as CalendarDownloadIcon,
  CalendarUpload as CalendarUploadIcon,
  CalendarShare as CalendarShareIcon,
  CalendarCopy as CalendarCopyIcon,
  CalendarMove as CalendarMoveIcon,
  CalendarArchive as CalendarArchiveIcon,
  CalendarUnarchive as CalendarUnarchiveIcon,
  CalendarRestore as CalendarRestoreIcon,
  CalendarRefresh as CalendarRefreshIcon,
  CalendarSync as CalendarSyncIcon,
  CalendarPause as CalendarPauseIcon,
  CalendarPlay as CalendarPlayIcon,
  CalendarStop as CalendarStopIcon,
  CalendarSkip as CalendarSkipIcon,
  CalendarRepeat as CalendarRepeatIcon,
  CalendarShuffle as CalendarShuffleIcon
} from 'lucide-react';

export default function Features() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Globe className="w-4 h-4" /> },
    { id: 'spaces', label: 'Spaces', icon: <Users className="w-4 h-4" /> },
    { id: 'credits', label: 'Credits', icon: <Coins className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <Library className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Chat', icon: <Brain className="w-4 h-4" /> },
    { id: 'polls', label: 'Polls', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> }
  ];

  const overviewFeatures = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Community",
      description: "Only students with verified school emails can join, ensuring authentic campus interactions.",
      benefits: ["Secure environment", "Real student connections", "No fake profiles"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Campus Spaces",
      description: "Join your main campus Space automatically, then explore clubs, courses, and niche communities.",
      benefits: ["Auto-join campus", "Discover communities", "Create custom spaces"]
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Credit Economy",
      description: "Earn credits through participation, spend them to boost your voice and unlock features.",
      benefits: ["Reward participation", "Boost visibility", "Unlock perks"]
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Shared Resources",
      description: "Access and contribute to a student-built library of notes, guides, and study materials.",
      benefits: ["Study materials", "Peer resources", "Easy sharing"]
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Assistant",
      description: "Get help with studies, campus questions, and academic support through our AI chat.",
      benefits: ["Study help", "Campus guidance", "24/7 support"]
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Interactive Polls",
      description: "Create polls, vote on campus issues, and gather community opinions on important topics.",
      benefits: ["Campus voice", "Quick surveys", "Community decisions"]
    }
  ];

  const spacesFeatures = [
    {
      title: "Main Campus Space",
      description: "Automatically join your university's main community space",
      icon: <GraduationCap className="w-6 h-6" />,
      features: ["Auto-enrollment", "Campus-wide discussions", "Official announcements"]
    },
    {
      title: "Course Spaces",
      description: "Join spaces for specific courses and subjects",
      icon: <BookOpen className="w-6 h-6" />,
      features: ["Subject discussions", "Study groups", "Course materials"]
    },
    {
      title: "Club Spaces",
      description: "Connect with campus clubs and organizations",
      icon: <Users2 className="w-6 h-6" />,
      features: ["Club activities", "Event updates", "Member networking"]
    },
    {
      title: "Custom Spaces",
      description: "Create your own spaces for projects, events, or interests",
      icon: <Plus className="w-6 h-6" />,
      features: ["Project collaboration", "Event planning", "Interest groups"]
    }
  ];

  const creditsFeatures = [
    {
      title: "Earning Credits",
      icon: <TrendingUp className="w-6 h-6" />,
      activities: [
        { action: "Answer polls", credits: "+5", icon: <BarChart3 className="w-4 h-4" /> },
        { action: "Share resources", credits: "+10", icon: <Upload className="w-4 h-4" /> },
        { action: "Create posts", credits: "+3", icon: <FileText className="w-4 h-4" /> },
        { action: "Comment on posts", credits: "+2", icon: <MessageCircle className="w-4 h-4" /> },
        { action: "Daily login", credits: "+1", icon: <Calendar className="w-4 h-4" /> }
      ]
    },
    {
      title: "Spending Credits",
      icon: <Coins className="w-6 h-6" />,
      activities: [
        { action: "Create polls", credits: "-15", icon: <BarChart3 className="w-4 h-4" /> },
        { action: "Boost post", credits: "-20", icon: <Zap className="w-4 h-4" /> },
        { action: "Pin to top", credits: "-25", icon: <Target className="w-4 h-4" /> },
        { action: "Premium features", credits: "-30", icon: <Star className="w-4 h-4" /> },
        { action: "Custom themes", credits: "-10", icon: <Palette className="w-4 h-4" /> }
      ]
    }
  ];

  const libraryFeatures = [
    {
      title: "Resource Types",
      icon: <FileText className="w-6 h-6" />,
      types: [
        { name: "Lecture Notes", icon: <FileTextIcon className="w-4 h-4" />, count: "500+" },
        { name: "Study Guides", icon: <BookOpen className="w-4 h-4" />, count: "300+" },
        { name: "Past Papers", icon: <FileText className="w-4 h-4" />, count: "200+" },
        { name: "Video Tutorials", icon: <FileVideo className="w-4 h-4" />, count: "150+" },
        { name: "Audio Lectures", icon: <FileAudio className="w-4 h-4" />, count: "100+" },
        { name: "Code Examples", icon: <Code className="w-4 h-4" />, count: "80+" }
      ]
    },
    {
      title: "Smart Search",
      icon: <Search className="w-6 h-6" />,
      features: [
        "Search by subject, course, or topic",
        "Filter by resource type and difficulty",
        "Sort by popularity, date, or rating",
        "Advanced search with tags and keywords"
      ]
    },
    {
      title: "Upload & Share",
      icon: <Upload className="w-6 h-6" />,
      features: [
        "Easy drag-and-drop uploads",
        "Automatic file organization",
        "Preview before sharing",
        "Earn credits for contributions"
      ]
    }
  ];

  const aiFeatures = [
    {
      title: "Study Assistant",
      icon: <BookOpen className="w-6 h-6" />,
      capabilities: [
        "Explain complex concepts",
        "Help with homework problems",
        "Generate study guides",
        "Answer course-specific questions"
      ]
    },
    {
      title: "Campus Guide",
      icon: <MapPin className="w-6 h-6" />,
      capabilities: [
        "Campus navigation help",
        "Event information",
        "Club and organization details",
        "Academic calendar assistance"
      ]
    },
    {
      title: "Academic Support",
      icon: <GraduationCap className="w-6 h-6" />,
      capabilities: [
        "Writing assistance",
        "Research guidance",
        "Citation help",
        "Project planning"
      ]
    },
    {
      title: "24/7 Availability",
      icon: <Clock className="w-6 h-6" />,
      capabilities: [
        "Always available",
        "Instant responses",
        "Multiple conversation threads",
        "Context-aware conversations"
      ]
    }
  ];

  const pollsFeatures = [
    {
      title: "Quick Polls",
      icon: <BarChart3 className="w-6 h-6" />,
      description: "Create instant polls for quick campus feedback",
      features: ["Multiple choice", "Yes/No questions", "Rating scales", "Quick results"]
    },
    {
      title: "Detailed Surveys",
      icon: <FileText className="w-6 h-6" />,
      description: "Design comprehensive surveys for in-depth research",
      features: ["Multiple question types", "Conditional logic", "Anonymous responses", "Data export"]
    },
    {
      title: "Campus Decisions",
      icon: <Users className="w-6 h-6" />,
      description: "Let the campus community decide on important issues",
      features: ["Voting campaigns", "Campaign periods", "Result transparency", "Follow-up actions"]
    },
    {
      title: "Event Planning",
      icon: <Calendar className="w-6 h-6" />,
      description: "Gather preferences for events and activities",
      features: ["Date preferences", "Activity selection", "Resource allocation", "Attendance tracking"]
    }
  ];

  const mobileFeatures = [
    {
      title: "Native Mobile App",
      icon: <Smartphone className="w-6 h-6" />,
      description: "Full-featured mobile app for iOS and Android",
      features: ["Push notifications", "Offline access", "Camera integration", "Touch gestures"]
    },
    {
      title: "Responsive Web",
      icon: <Monitor className="w-6 h-6" />,
      description: "Optimized web experience on all devices",
      features: ["Mobile-first design", "Touch-friendly", "Fast loading", "Cross-platform sync"]
    },
    {
      title: "Real-time Updates",
      icon: <Wifi className="w-6 h-6" />,
      description: "Stay connected with live updates",
      features: ["Instant notifications", "Live chat", "Real-time polls", "Activity feeds"]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Features</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Stride Campus brings together all the tools students need for campus life in one unified platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {overviewFeatures.map((feature, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="text-[#f23b36] mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'spaces':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Campus Spaces</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Connect with your campus community through organized, topic-specific spaces.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {spacesFeatures.map((space, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="text-[#f23b36] mr-3">
                      {space.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{space.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{space.description}</p>
                  <ul className="space-y-2">
                    {space.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'credits':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Credit System</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Earn credits through participation and spend them to boost your campus influence.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {creditsFeatures.map((section, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="text-[#f23b36] mr-3">
                      {section.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-xl">{section.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {section.activities.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="text-gray-400 mr-3">
                            {activity.icon}
                          </div>
                          <span className="text-gray-700">{activity.action}</span>
                        </div>
                        <span className={`font-semibold ${activity.credits.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {activity.credits}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Shared Library</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Access and contribute to a comprehensive collection of student-created resources.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {libraryFeatures.map((section, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="text-[#f23b36] mr-3">
                      {section.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{section.title}</h3>
                  </div>
                  {section.types ? (
                    <div className="space-y-3">
                      {section.types.map((type, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="text-gray-400 mr-3">
                              {type.icon}
                            </div>
                            <span className="text-gray-700">{type.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{type.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {section.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Assistant</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Get instant help with studies, campus questions, and academic support through our AI chat.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="text-[#f23b36] mr-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {feature.capabilities.map((capability, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'polls':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Polls & Surveys</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Create polls, gather campus opinions, and make data-driven decisions for your community.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pollsFeatures.map((feature, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="text-[#f23b36] mr-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((feat, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'mobile':
        return (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Mobile Experience</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Access Stride Campus anywhere, anytime with our mobile-optimized experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mobileFeatures.map((feature, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="text-[#f23b36] mr-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((feat, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Features & <span className="text-[#f23b36]">Capabilities</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover all the tools and features that make Stride Campus the ultimate platform for campus life and student collaboration.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#f23b36] text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          {renderTabContent()}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience These Features?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of students already using Stride Campus to enhance their campus experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://stridecampus.com/download"
                className="px-8 py-4 bg-white text-[#f23b36] rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                Download App <ArrowRight className="ml-2" />
              </a>
              <a 
                href="/about"
                className="px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
              >
                Learn More <ChevronRight className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

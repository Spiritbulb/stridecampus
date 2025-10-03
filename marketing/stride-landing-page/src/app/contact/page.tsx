'use client';
import React, { useState } from 'react';
import { 
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  HelpCircle,
  Users,
  Globe,
  Heart,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  Star,
  ThumbsUp,
  Share2,
  Bookmark,
  Bell,
  Settings,
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Search,
  Filter,
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calculator,
  Calendar,
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

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactTypes = [
    { value: 'general', label: 'General Inquiry', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'support', label: 'Technical Support', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'partnership', label: 'Partnership', icon: <Users className="w-4 h-4" /> },
    { value: 'feedback', label: 'Feedback', icon: <ThumbsUp className="w-4 h-4" /> },
    { value: 'bug', label: 'Bug Report', icon: <AlertCircle className="w-4 h-4" /> }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      description: "Send us an email anytime",
      value: "support@stridecampus.com",
      action: "mailto:support@stridecampus.com"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      value: "Available 24/7",
      action: "#"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Call Us",
      description: "Speak with our team",
      value: "+254 700 000 000",
      action: "tel:+254700000000"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Visit Us",
      description: "Come say hello",
      value: "Nairobi, Kenya",
      action: "#"
    }
  ];

  const faqs = [
    {
      question: "How do I verify my school email?",
      answer: "When you sign up, we'll send a verification link to your school email. Click the link to verify your account and gain access to your campus community."
    },
    {
      question: "What if my university isn't listed?",
      answer: "If your university isn't listed, you can request to add it by contacting our support team. We're constantly adding new universities and colleges."
    },
    {
      question: "How do I earn credits?",
      answer: "You can earn credits by participating in polls, sharing resources in the Library, creating posts, commenting, and daily logins. The more you participate, the more credits you earn!"
    },
    {
      question: "Is Stride Campus really free?",
      answer: "Yes! Stride Campus is completely free for all students. We believe in providing equal access to campus communities without any financial barriers."
    },
    {
      question: "How do I create a Space?",
      answer: "Go to the Spaces section and click 'Create Space'. You can create spaces for courses, clubs, projects, or any topic you're interested in. You'll need some credits to create a space."
    },
    {
      question: "Can I use Stride Campus on my phone?",
      answer: "Absolutely! Stride Campus is available as a mobile app for iOS and Android, and also works great in your mobile browser. All your data syncs across devices."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Get in <span className="text-[#f23b36]">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions, feedback, or need help? We're here to help you make the most of your Stride Campus experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                        placeholder="your.email@university.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                    >
                      {contactTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f23b36] focus:border-transparent"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-[#f23b36] text-white rounded-lg font-semibold hover:bg-[#d32f2f] transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info & FAQ */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.action}
                    className="flex items-start p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-[#f23b36] mr-4 mt-1">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{info.title}</h4>
                      <p className="text-gray-600 text-sm mb-1">{info.description}</p>
                      <p className="text-[#f23b36] font-medium">{info.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <Info className="w-4 h-4 inline mr-1" />
                  Live chat is available 24/7 for urgent technical issues.
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a href="/features" className="flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View Features
                </a>
                <a href="/about" className="flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  About Us
                </a>
                <a href="/donate" className="flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Support Us
                </a>
                <a href="https://stridecampus.com/download" className="flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Download App
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Stride Campus
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-white/90 text-lg mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@stridecampus.com">
                <button className="px-8 py-4 bg-white text-[#f23b36] rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center">
                  <Mail className="mr-2" />
                  Email Support
                </button>
              </a>
              <a href="https://stridecampus.com/download">
                <button className="px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center">
                  <ExternalLink className="mr-2" />
                  Get Started
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




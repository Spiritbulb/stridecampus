'use client';
import React from 'react';
import { 
  Users, 
  Award, 
  BarChart3, 
  BookOpen, 
  Mail, 
  Shield, 
  TrendingUp, 
  Calendar,
  GraduationCap,
  FileText,
  Sparkles,
  ChevronRight,
  Play,
  Coins,
  Library,
  Megaphone,
  Star,
  Brain,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Monitor,
  Heart
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Credit System",
      description: "Earn credits by participating in polls and sharing resources. Spend them to create polls, boost your voice, or unlock community perks.",
      benefits: ["Reward participation", "Boost visibility", "Unlock premium features"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Community",
      description: "Verified by your school email, you join your campus Space instantly, keeping the community authentic and trustworthy.",
      benefits: ["Secure environment", "Real student connections", "No fake profiles"]
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Shared Library",
      description: "Access a student-built resource hub with notes, guides, and references, all powered by community contribution.",
      benefits: ["Study materials", "Peer resources", "Easy sharing"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Visibility & Clout",
      description: "The more you contribute, the more weight your voice carries across campus communities.",
      benefits: ["Build reputation", "Increase influence", "Gain recognition"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Niche Spaces",
      description: "Join your campus feed by default, then explore clubs, events, and niche course Spaces.",
      benefits: ["Auto-join campus", "Discover communities", "Create custom spaces"]
    },
    {
      icon: <Megaphone className="w-8 h-8" />,
      title: "Admin Features",
      description: "Schools and clubs can get verified profiles for official posts and polls.",
      benefits: ["Official announcements", "Verified content", "Institutional presence"]
    }
  ];

  const howItWorks = [
    {
      step: "1",
      icon: <Mail className="w-6 h-6" />,
      title: "Sign Up with School Email",
      description: "Verify your identity using your university email and get starter credits."
    },
    {
      step: "2",
      icon: <Users className="w-6 h-6" />,
      title: "Join Your Spaces",
      description: "Access your campus Space instantly, then explore clubs, courses, and niche communities."
    },
    {
      step: "3",
      icon: <Award className="w-6 h-6" />,
      title: "Earn Credits",
      description: "Answer polls, share resources, and contribute to the Library to earn credits."
    },
    {
      step: "4",
      icon: <Coins className="w-6 h-6" />,
      title: "Spend Credits",
      description: "Create your own polls, boost your voice, or unlock community perks."
    }
  ];

  const testimonials = [
    {
      text: "The credit system actually makes me want to participate more. I've earned enough to run three polls for my club!",
      author: "Alex R., UT Austin",
      role: "Computer Science Major",
      avatar: "👨‍💻"
    },
    {
      text: "Our study group lives in our course Space. The shared Library has saved us so much time finding quality resources.",
      author: "Maya P., University of Michigan",
      role: "Biology Student",
      avatar: "👩‍🔬"
    },
    {
      text: "As club president, having a verified admin profile helps our members know which posts are actually from us.",
      author: "Daniel T., NYU",
      role: "Debate Club President",
      avatar: "👨‍🎓"
    },
    {
      text: "The AI chat feature is incredible! It helped me understand complex calculus concepts when I was stuck.",
      author: "Sarah K., Stanford",
      role: "Mathematics Major",
      avatar: "👩‍🎓"
    },
    {
      text: "I love how easy it is to find study materials. The Library has everything I need for my courses.",
      author: "James L., MIT",
      role: "Engineering Student",
      avatar: "👨‍🔧"
    },
    {
      text: "Creating polls for campus events has never been easier. The engagement is amazing!",
      author: "Emma W., Harvard",
      role: "Event Coordinator",
      avatar: "👩‍💼"
    }
  ];

  const stats = [
    { number: "10K+", label: "Active Students", icon: <Users className="w-6 h-6" /> },
    { number: "50+", label: "Universities", icon: <GraduationCap className="w-6 h-6" /> },
    { number: "1M+", label: "Resources Shared", icon: <Library className="w-6 h-6" /> },
    { number: "100K+", label: "Polls Created", icon: <BarChart3 className="w-6 h-6" /> }
  ];

  const platforms = [
    { name: "iOS", icon: <Smartphone className="w-8 h-8" />, status: "Unvailable" },
    { name: "Android", icon: <Smartphone className="w-8 h-8" />, status: "Available" },
    { name: "Web", icon: <Monitor className="w-8 h-8" />, status: "Available" },
    { name: "Desktop", icon: <Monitor className="w-8 h-8" />, status: "Coming Soon" }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Hero Section */}
      <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 animate-in slide-in-from-left-4 duration-700">
          <div className="inline-flex items-center px-4 py-2 bg-[#f23b36]/10 rounded-full text-[#f23b36] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Available on Android and Web
          </div>
          <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">
            Where student life meets <span className="text-[#f23b36]">collaboration</span>
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8 leading-relaxed">
            Stride Campus is where verified students join their campus Space, earn credits by participating, 
            and spend them to boost their voice across the community. Connect, collaborate, and thrive together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://stridecampus.com/download">
              <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer">
                Get Started Free <ChevronRight className="ml-2" />
              </button>
            </a>
            <a href="https://stridecampus.com/donate">
            <button className="px-8 py-4 bg-white text-[#f23b36] border-2 border-[#f23b36] rounded-2xl font-semibold hover:bg-[#f23b36] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
              <Heart className="mr-2" />
              Support Us
            </button>
            </a>
          </div>
          <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            <span>Free for students</span>
          </div>
        </div>
        <div className="flex-1 animate-in slide-in-from-right-4 duration-700">
          <img 
            src="/undraw_group-project_kow1.svg" 
            alt="University students collaborating on a group project"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Stats Section 
      <section className="py-16 bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl mb-16 animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Trusted by Students</h2>
          <p className="text-white/90 text-lg">Join students already using Stride Campus</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center text-white">
              <div className="flex justify-center mb-2">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-1">{stat.number}</div>
              <div className="text-white/80 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>*/}

      {/* How It Works */}
      <section className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How Stride Campus Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join your campus community, participate, and make your voice heard in 4 simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {howItWorks.map((item, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-[#f23b36] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                {item.step}
              </div>
              <div className="text-[#f23b36] mb-4 flex justify-center">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mb-16 animate-in slide-in-from-left-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What makes Stride Campus unique</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We've designed every feature to make student communities more active, useful, and rewarding.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
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
      </section>

      {/* Testimonials 
      <section className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Students Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how students are using StrideCampus to enhance their campus experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">{testimonial.avatar}</div>
                <div className="flex items-center text-yellow-400">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.author}</p>
                <p className="text-gray-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>*/}

      {/* Platforms */}
      <section className="mb-16 animate-in slide-in-from-left-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">We'll be available everywhere</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access Stride Campus on all your devices with seamless synchronization.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {platforms.map((platform, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
              <div className="text-[#f23b36] mb-4 flex justify-center">
                {platform.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{platform.name}</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                platform.status === 'Available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {platform.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to join your campus community?</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Connect with your campus, earn credits, and make your voice heard. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://stridecampus.com/download">
              <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer">
                Get Started Free <ChevronRight className="ml-2" />
              </button>
            </a>
            <a href="/features">
              <button className="px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 flex items-center justify-center cursor-pointer">
                Explore Features <ArrowRight className="ml-2" />
              </button>
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-6">
            Free for students • School email verification required • No credit card needed
          </p>
        </div>
      </section>
    </div>
  );
}
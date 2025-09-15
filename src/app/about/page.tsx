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
  HeartHandshake,
  Calendar,
  GraduationCap,
  FileText,
  Sparkles,
  Library,
  Coins,
  Megaphone
} from 'lucide-react';

export default function About() {
  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Credit System",
      description: "Earn credits by participating in polls and sharing resources. Spend them to create polls, boost your voice, or unlock community perks."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Community",
      description: "Exclusive to students with verified school emails, ensuring a trusted campus environment for authentic interactions."
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Shared Library",
      description: "Access a student-built resource hub with notes, guides, and references contributed by your campus community."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Visibility & Clout",
      description: "The more you contribute, the more weight your voice carries across campus communities."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Niche Spaces",
      description: "Join your campus feed by default, then explore clubs, events, and niche course Spaces."
    },
    {
      icon: <Megaphone className="w-8 h-8" />,
      title: "Admin Features",
      description: "Schools and clubs can get verified profiles for official posts and announcements."
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          About <span className="text-[#f23b36]">Stride Campus</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Where student life meets collaboration. A campus community platform that makes it easy for students to connect, 
          share resources, and engage with their campus through a verified, credit-based system.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/70 rounded-2xl p-8 text-white mb-16 animate-in slide-in-from-left-4 duration-700">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed">
            To create vibrant campus communities where students don't just consume content—they actively participate, 
            share resources, and build meaningful connections. We're building a platform where your campus voice matters 
            and your contributions are rewarded.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Stride Campus Works</h2>
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
      </div>

      {/* Features Grid */}
      <div className="mb-16 animate-in slide-in-from-left-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Here's what makes us different</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="text-[#f23b36] mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Value */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16 animate-in slide-in-from-right-4 duration-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Campus Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">For Students</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Connect with your campus community through verified Spaces</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Access shared resources and study materials from peers</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Gain visibility and influence through the credit system</span>
                </li>
              </ul>
            </div>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">For Educators & Clubs</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Create official Spaces for courses, departments, or organizations</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Share verified announcements and updates with students</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-[#f23b36] rounded-full flex items-center justify-center mt-1 mr-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span>Gather feedback through polls and discussions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center animate-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Join Your Campus Community</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Be part of a verified campus platform where your participation matters and your voice is heard.
        </p>
        <div className="flex justify-center">
          <button 
            className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
            onClick={() => window.location.href = '/'}
          >
            Join Now
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          Sign up with your school email and get bonus credits to start with!
        </p>
      </div>
    </div>
  );
}
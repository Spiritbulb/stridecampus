'use client';
import React from 'react';
import { 
  Users, 
  Award, 
  BarChart3, 
  BookOpen, 
  Shield, 
  HeartHandshake,
  GraduationCap,
  FileText,
  Sparkles,
  ChevronRight,
  Clock,
  Library,
  Target,
  CheckCircle,
  Bookmark,
  Calendar,
  PieChart,
  Mail,
  Megaphone,
  Coins
} from 'lucide-react';

export default function ForEducators() {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Campus Community Building",
      description: "Create and moderate Spaces for your courses, departments, or campus initiatives to foster student engagement."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Student Access",
      description: "All participants are verified students through school emails, ensuring a safe and authentic campus environment."
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Shared Resource Library",
      description: "Contribute to and organize educational resources that students can access through the community Library."
    }
  ];

  const useCases = [
    {
      title: "Course Communities",
      description: "Create dedicated Spaces for your courses where students can share resources, ask questions, and participate in course-related polls.",
      icon: <GraduationCap className="w-6 h-6 text-[#f23b36]" />
    },
    {
      title: "Department Initiatives",
      description: "Launch department-wide polls to gather student feedback on curriculum, events, or new program developments.",
      icon: <Target className="w-6 h-6 text-[#f23b36]" />
    },
    {
      title: "Student Engagement",
      description: "Use the credit system to incentivize participation in campus activities, discussions, and resource sharing.",
      icon: <Bookmark className="w-6 h-6 text-[#f23b36]" />
    },
    {
      title: "Campus Announcements",
      description: "Share official updates through verified admin profiles that students recognize as authoritative sources.",
      icon: <Megaphone className="w-6 h-6 text-[#f23b36]" />
    }
  ];

  const benefits = [
    {
      title: "Student Participation",
      description: "Increase engagement through the credit system that rewards students for contributing to campus communities.",
      stat: "2.8x higher"
    },
    {
      title: "Resource Sharing",
      description: "Expand access to educational materials through student-contributed resources in the shared Library.",
      stat: "40% more"
    },
    {
      title: "Feedback Response",
      description: "Receive more authentic student feedback through polls and discussions in course-specific Spaces.",
      stat: "3.2x faster"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Stride Campus <span className="text-[#f23b36]">for Educators</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Enhance campus engagement, create vibrant course communities, and connect with students through our verified campus platform.
        </p>
        <div className="mt-10">
          <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300">
            Get Verified Admin Access
          </button>
        </div>
      </div>

      {/* Institutional Value */}
      <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/70 rounded-2xl p-8 text-white mb-16 animate-in slide-in-from-left-4 duration-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Building Connected Campus Communities</h2>
          <p className="text-xl leading-relaxed text-center mb-8">
            Stride Campus provides educators with tools to create engaging Spaces, share resources, 
            and communicate with students through a verified platform designed for academic environments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Student Engagement</h3>
              <p>Foster participation through course Spaces and the credit incentive system</p>
            </div>
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Verified Communication</h3>
              <p>Share official announcements through authenticated admin profiles</p>
            </div>
            <div className="text-center">
              <Library className="w-12 h-12 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Resource Sharing</h3>
              <p>Contribute to and organize educational materials in the shared Library</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Campus Community Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* Use Cases */}
      <div className="mb-16 animate-in slide-in-from-left-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Educators Use StrideCampus</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start mb-4">
                {useCase.icon}
                <h3 className="font-semibold text-gray-900 text-lg ml-3">{useCase.title}</h3>
              </div>
              <p className="text-gray-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16 animate-in slide-in-from-right-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Campus Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-[#f23b36] mb-4">{benefit.stat}</div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Section */}
      <div className="mb-16 animate-in slide-in-from-left-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Campus Integration</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform integrates with your campus systems to provide a seamless experience for faculty, staff, and students.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <span className="text-gray-700">School email verification for all users</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <span className="text-gray-700">Admin verification for faculty and staff profiles</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <span className="text-gray-700">Course roster integration for automatic Space enrollment</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <span className="text-gray-700">Customizable Spaces for departments, courses, and campus organizations</span>
              </li>
            </ul>
          </div>
          <div>
            <img 
              src="/undraw_teaching_58yg.svg" 
              alt="Educator reviewing data analytics"
              className=""
            />
          </div>
        </div>
      </div>

      {/* Testimonials 
      <div className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Educators Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
            <div className="flex items-center mb-4 text-yellow-400">
              {"★".repeat(5)}
            </div>
            <p className="text-gray-600 italic mb-4">"StrideCampus transformed how I engage with my students outside the classroom. Our course Space has become a vibrant community where students share resources and help each other learn."</p>
            <div>
              <p className="font-semibold text-gray-900">Dr. Elena Rodriguez</p>
              <p className="text-gray-500 text-sm">Associate Professor of Sociology, University of Michigan</p>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
            <div className="flex items-center mb-4 text-yellow-400">
              {"★".repeat(5)}
            </div>
            <p className="text-gray-600 italic mb-4">"The verified admin profile gives our department an authoritative voice on campus. Students know our announcements are legitimate, and the polling feature helps us make data-informed decisions."</p>
            <div>
              <p className="font-semibold text-gray-900">Dr. Michael Chen</p>
              <p className="text-gray-500 text-sm">Department Chair, Stanford University</p>
            </div>
          </div>
        </div>
      </div>*/}

      {/* CTA Section */}
      <div className="text-center animate-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Enhance Campus Engagement?</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Join educators across campuses using Stride Campus to build stronger academic communities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300">
            Get Verified Access
          </button>
          <button className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300">
            Download Educator Guide
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          Free for educators • School verification required
        </p>
      </div>
    </div>
  );
}
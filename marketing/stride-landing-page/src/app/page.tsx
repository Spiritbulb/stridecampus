'use client';
import React from 'react';
import { 
  School,
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
  Star
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Credit System",
      description: "Earn credits by participating in polls and sharing resources. Spend them to create polls, boost your voice, or unlock community perks."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Community",
      description: "Verified by your school email, you join your campus Space instantly, keeping the community authentic and trustworthy."
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Shared Library",
      description: "Access a student-built resource hub with notes, guides, and references, all powered by community contribution."
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
      description: "Schools and clubs can get verified profiles for official posts and polls."
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
      role: "Computer Science Major"
    },
    {
      text: "Our study group lives in our course Space. The shared Library has saved us so much time finding quality resources.",
      author: "Maya P., University of Michigan",
      role: "Biology Student"
    },
    {
      text: "As club president, having a verified admin profile helps our members know which posts are actually from us.",
      author: "Daniel T., NYU",
      role: "Debate Club President"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Hero Section */}
      <section className="py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 animate-in slide-in-from-left-4 duration-700">
          <h1 className="text-5xl font-bold text-center text-gray-900 mb-6">
            Where student life meets <span className="text-[#f23b36]">collaboration</span>
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8 leading-relaxed">
            Stride Campus is where verified students join their campus Space, earn credits by participating, and spend them to boost their voice across the community.
          </p>
          <div className="flex justify-center">
              <a href="https://stridecampus.com/download">
            <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer">
              Claim free credits <ChevronRight className="ml-2" />
            </button>
            </a>
          </div>
        </div>
        <div className="flex-1 animate-in slide-in-from-right-4 duration-700">
          <img 
            src="/undraw_group-project_kow1.svg" 
            alt="University students collaborating on a group project"
            className=""
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How Stride Campus works</h2>
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
      </section>

      {/* Testimonials 
      <section className="mb-16 animate-in slide-in-from-right-4 duration-700">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Campus voices</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how students are using StrideCampus to enhance their campus experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4 text-yellow-400">
                {"★".repeat(5)}
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

      {/* Final CTA */}
      <section className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to join your campus community?</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Connect with your campus, earn credits, and make your voice heard.
        </p>
        <div className="flex justify-center">
              <a href="https://stridecampus.com/download">
            <button className="px-8 py-4 bg-[#f23b36] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer">
              Claim free credits <ChevronRight className="ml-2" />
            </button>
            </a>
        </div>
        <p className="text-gray-500 text-sm mt-6">
          Free for students • School email verification required
        </p>
      </section>
    </div>
  );
}
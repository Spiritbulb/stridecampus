'use client';
import React, { useState } from 'react';
import { 
  HeartHandshake,
  Copy,
  Check,
  Smartphone,
  CreditCard,
  Gift,
  Users,
  Star,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function Donate() {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const tillNumber = '4202518';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tillNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const suggestedAmounts = [50, 100, 200, 500, 1000, 2000];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-[#f23b36] hover:text-[#d32f2f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#f23b36] rounded-full mb-6">
            <HeartHandshake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Support <span className="text-[#f23b36]">Stride Campus</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Help us build the future of campus communities. Your support helps us maintain the platform, 
            add new features, and keep Stride Campus free for all students.
          </p>
        </div>

        {/* Why Support Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Support Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f23b36]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#f23b36]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Free for Students</h3>
              <p className="text-gray-600 text-sm">
                We keep Stride Campus completely free for all students, ensuring equal access to campus communities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f23b36]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#f23b36]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Continuous Innovation</h3>
              <p className="text-gray-600 text-sm">
                Your support helps us develop new features, improve user experience, and expand to more campuses.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f23b36]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-[#f23b36]" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Student-First</h3>
              <p className="text-gray-600 text-sm">
                We're built by students, for students. Every feature is designed with campus life in mind.
              </p>
            </div>
          </div>
        </div>

        {/* Donation Section */}
        <div className="bg-gradient-to-r from-[#f23b36] to-[#f23b36]/80 rounded-2xl p-8 mb-12 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Make a Donation</h2>
            <p className="text-xl mb-8 opacity-90">
              Support Stride Campus development through MPesa
            </p>

            {/* MPesa Till Number */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 mr-3" />
                <span className="text-lg font-semibold">MPesa Till Number</span>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-white text-[#f23b36] px-6 py-3 rounded-lg font-mono text-2xl font-bold">
                  {tillNumber}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggested Amounts */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Suggested Amounts</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {suggestedAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                      selectedAmount === amount
                        ? 'bg-white text-[#f23b36]'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    KSh {amount.toLocaleString()}
                  </button>
                ))}
              </div>
              
              {/* Custom Amount */}
              <div className="mt-4">
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">How to Donate</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-bold">1</span>
                  </div>
                  <p>Open your MPesa app on your phone</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-bold">2</span>
                  </div>
                  <p>Select "Lipa na M-Pesa" → "Buy Goods and Services"</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-bold">3</span>
                  </div>
                  <p>Enter Till Number: <span className="font-mono font-bold">{tillNumber}</span></p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <p>Enter the amount you'd like to donate</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-bold">5</span>
                  </div>
                  <p>Enter your MPesa PIN to complete the transaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What Your Donation Supports</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#f23b36] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Server maintenance and hosting costs</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#f23b36] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">New feature development and improvements</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#f23b36] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Security updates and data protection</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#f23b36] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Expansion to more universities and colleges</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-[#f23b36] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">Student support and community building</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recognition</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Supporter Badge</h4>
                  <p className="text-gray-600 text-sm">
                    Donors receive a special supporter badge on their profile to show their contribution to the community.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Early Access</h4>
                  <p className="text-gray-600 text-sm">
                    Get early access to new features and beta testing opportunities.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Community Impact</h4>
                  <p className="text-gray-600 text-sm">
                    Your contribution directly helps thousands of students connect and collaborate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Support */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other Ways to Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Users className="w-12 h-12 text-[#f23b36] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Share with Friends</h3>
              <p className="text-gray-600 text-sm mb-4">
                Help us grow by sharing Stride Campus with your campus community.
              </p>
              <button className="px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#d32f2f] transition-colors">
                Share Now
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Star className="w-12 h-12 text-[#f23b36] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Leave Feedback</h3>
              <p className="text-gray-600 text-sm mb-4">
                Help us improve by sharing your thoughts and suggestions.
              </p>
              <button className="px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#d32f2f] transition-colors">
                Give Feedback
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12 p-6 bg-gray-50 rounded-xl">
          <p className="text-gray-600">
            Thank you for supporting Stride Campus! Every contribution, no matter the size, 
            helps us build a better platform for students everywhere.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Questions about donations? Contact us at{' '}
            <a href="mailto:support@stridecampus.com" className="text-[#f23b36] hover:underline">
              support@stridecampus.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}



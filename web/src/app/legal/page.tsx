'use client';
import React from 'react';
import Link from 'next/link';
import { Scale, FileText, Shield, Cookie, Copyright, ExternalLink } from 'lucide-react';

export default function LegalPage() {
  const legalDocuments = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using Stride Campus, including user responsibilities, credit system, and platform rules.',
      icon: <FileText className="w-8 h-8" />,
      href: '/legal/terms',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information, including data security and your privacy rights.',
      icon: <Shield className="w-8 h-8" />,
      href: '/legal/privacy',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Cookie Policy',
      description: 'Information about how we use cookies and similar technologies to enhance your experience on our platform.',
      icon: <Cookie className="w-8 h-8" />,
      href: '/legal/cookies',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'DMCA & Copyright Policy',
      description: 'Our policies for handling copyright infringement claims and protecting intellectual property rights.',
      icon: <Copyright className="w-8 h-8" />,
      href: '/legal/dmca',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Scale className="w-12 h-12 text-[#f23b36]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Information
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Important legal documents and policies that govern your use of Stride Campus. 
            Please review these documents to understand your rights and responsibilities.
          </p>
        </div>

        {/* Legal Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {legalDocuments.map((doc, index) => (
            <Link
              key={index}
              href={doc.href}
              className="group block"
            >
              <div className={`${doc.bgColor} ${doc.borderColor} border rounded-lg p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105`}>
                <div className="flex items-start space-x-4">
                  <div className={`${doc.color} flex-shrink-0`}>
                    {doc.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#f23b36] transition-colors">
                        {doc.title}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#f23b36] transition-colors" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Scale className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Important Legal Notice
              </h3>
              <p className="text-yellow-700 mb-3">
                By using Stride Campus, you agree to be bound by our Terms of Service and Privacy Policy. 
                These documents contain important information about your rights and responsibilities as a user.
              </p>
              <ul className="list-disc pl-6 text-yellow-700 space-y-1">
                <li>Please read all legal documents carefully</li>
                <li>Contact us if you have any questions</li>
                <li>These policies may be updated from time to time</li>
                <li>Continued use constitutes acceptance of changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">General Legal Inquiries</h4>
              <p className="text-gray-600 text-sm mb-1">
                <strong>Email:</strong> legal@stridecampus.com
              </p>
              <p className="text-gray-600 text-sm mb-1">
                <strong>Website:</strong> https://stridecampus.com
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Address:</strong> Stride Campus Legal Department, Nairobi, Kenya
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Specific Legal Matters</h4>
              <p className="text-gray-600 text-sm mb-1">
                <strong>Privacy Questions:</strong> privacy@stridecampus.com
              </p>
              <p className="text-gray-600 text-sm mb-1">
                <strong>Copyright Issues:</strong> dmca@stridecampus.com
              </p>
              <p className="text-gray-600 text-sm">
                <strong>Cookie Questions:</strong> cookies@stridecampus.com
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Legal documents last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>
      </div>
    </div>
  );
}

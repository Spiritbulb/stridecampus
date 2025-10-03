'use client';
import React from 'react';
import { Shield, Users, FileText, AlertTriangle, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white mb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Scale className="w-12 h-12 text-[#f23b36]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Notice</h3>
                <p className="text-blue-700">
                  By using Stride Campus, you agree to these Terms of Service. Please read them carefully. 
                  If you do not agree to these terms, please do not use our service.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-[#f23b36]" />
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              Welcome to Stride Campus ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of 
              our campus community platform, including our website, mobile application, and related services 
              (collectively, the "Service").
            </p>
            <p className="text-gray-700 mb-4">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any 
              part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="w-6 h-6 mr-3 text-[#f23b36]" />
              2. Description of Service
            </h2>
            <p className="text-gray-700 mb-4">
              Stride Campus is a verified campus community platform that enables students to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Connect with verified campus communities</li>
              <li>Participate in polls and discussions</li>
              <li>Share and access educational resources</li>
              <li>Earn credits through participation</li>
              <li>Create and join campus spaces</li>
              <li>Receive notifications about campus activities</li>
            </ul>
            <p className="text-gray-700">
              Our Service is designed exclusively for verified students with valid school email addresses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-[#f23b36]" />
              3. User Eligibility and Verification
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Requirements</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You must be at least 13 years old</li>
                <li>You must be a current student at a recognized educational institution</li>
                <li>You must have a valid school email address</li>
                <li>You must provide accurate and complete information during registration</li>
              </ul>
            </div>
            <p className="text-gray-700 mb-4">
              We reserve the right to verify your student status and may request additional documentation 
              to confirm your eligibility. Providing false information may result in immediate account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts and Registration</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Account Creation:</strong> You must create an account to use our Service. You are responsible 
                for maintaining the confidentiality of your account credentials and for all activities that occur 
                under your account.
              </p>
              <p>
                <strong>Account Security:</strong> You agree to notify us immediately of any unauthorized use of 
                your account or any other breach of security.
              </p>
              <p>
                <strong>Account Termination:</strong> We reserve the right to suspend or terminate your account 
                at any time for violation of these Terms or for any other reason at our sole discretion.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Credit System</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Virtual Credits</h3>
              <p className="text-yellow-700">
                Our Service includes a virtual credit system. Credits have no monetary value and cannot be 
                exchanged for real currency or goods outside of our platform.
              </p>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Earning Credits:</strong> You can earn credits by participating in polls, sharing resources, 
                and engaging with the community in accordance with our guidelines.
              </p>
              <p>
                <strong>Spending Credits:</strong> Credits can be used to create polls, boost content visibility, 
                or unlock community features as described in the Service.
              </p>
              <p>
                <strong>Credit Policy:</strong> We reserve the right to adjust credit values, earning rates, 
                and spending options at any time. Credits may expire or be forfeited for violations of these Terms.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct and Content Policy</h2>
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Prohibited Activities</h3>
              <p className="text-red-700 mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 text-red-700 space-y-1">
                <li>Post inappropriate, offensive, or harmful content</li>
                <li>Harass, bully, or intimidate other users</li>
                <li>Share false or misleading information</li>
                <li>Violate any laws or regulations</li>
                <li>Attempt to hack or compromise our systems</li>
                <li>Create multiple accounts or impersonate others</li>
                <li>Share copyrighted material without permission</li>
                <li>Use the Service for commercial purposes without authorization</li>
              </ul>
            </div>
            <p className="text-gray-700">
              We reserve the right to remove content and suspend accounts that violate these guidelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Our Content:</strong> The Service and its original content, features, and functionality 
                are owned by Stride Campus and are protected by international copyright, trademark, patent, 
                trade secret, and other intellectual property laws.
              </p>
              <p>
                <strong>Your Content:</strong> You retain ownership of content you post to our Service. 
                By posting content, you grant us a non-exclusive, royalty-free license to use, display, 
                and distribute your content in connection with the Service.
              </p>
              <p>
                <strong>Resource Sharing:</strong> When you share educational resources, you represent that 
                you have the right to share such content and that it does not infringe on third-party rights.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by 
              our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your personal information, but no method 
              of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                <strong>Service Availability:</strong> We strive to provide continuous service availability, 
                but we do not guarantee uninterrupted access to the Service.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Content Accuracy:</strong> We do not guarantee the accuracy, completeness, or reliability 
                of any content posted by users.
              </p>
              <p className="text-gray-700">
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Stride Campus 
                shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the Service.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of significant 
              changes through the Service or by email. Your continued use of the Service after such modifications 
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Termination by You:</strong> You may terminate your account at any time by contacting 
                us or using the account deletion feature in your settings.
              </p>
              <p>
                <strong>Termination by Us:</strong> We may terminate or suspend your account immediately, 
                without prior notice, for any reason, including violation of these Terms.
              </p>
              <p>
                <strong>Effect of Termination:</strong> Upon termination, your right to use the Service 
                will cease immediately, and we may delete your account and data.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Disputes</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Kenya, without 
              regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700">
              Any disputes arising from these Terms or your use of the Service shall be resolved through 
              binding arbitration in accordance with the rules of the Arbitration Act of Kenya.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> legal@stridecampus.com<br />
                <strong>Website:</strong> https://stridecampus.com<br />
                <strong>Address:</strong> Stride Campus Legal Department, Nairobi, Kenya
              </p>
            </div>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              These Terms of Service were last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




'use client';
import React from 'react';
import { Shield, Eye, Database, Lock, Users, Bell, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white mb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-[#f23b36]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8">
            <div className="flex items-start">
              <Shield className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Your Privacy Matters</h3>
                <p className="text-green-700">
                  At Stride Campus, we are committed to protecting your privacy and ensuring the security of your personal information. 
                  This Privacy Policy explains how we collect, use, and protect your data.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="w-6 h-6 mr-3 text-[#f23b36]" />
              1. Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Account Information:</strong> Name, username, email address, school affiliation</li>
                  <li><strong>Profile Information:</strong> Bio, profile picture, academic interests</li>
                  <li><strong>Verification Data:</strong> School email verification, student status confirmation</li>
                  <li><strong>Contact Information:</strong> Email address for notifications and support</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Activity Data:</strong> Posts, comments, polls participation, resource sharing</li>
                  <li><strong>Engagement Metrics:</strong> Likes, shares, follows, credit transactions</li>
                  <li><strong>Device Information:</strong> Device type, operating system, browser information</li>
                  <li><strong>Location Data:</strong> General location (country/region) for campus verification</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Log Data:</strong> IP address, access times, pages visited, referring URLs</li>
                  <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics data</li>
                  <li><strong>Push Notification Tokens:</strong> Device tokens for mobile notifications</li>
                  <li><strong>Error Reports:</strong> Crash logs and performance data</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-[#f23b36]" />
              2. How We Use Your Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Service Provision</h3>
                <ul className="list-disc pl-6 text-blue-800 space-y-1">
                  <li>Create and maintain your account</li>
                  <li>Verify student status</li>
                  <li>Enable campus community features</li>
                  <li>Process credit transactions</li>
                  <li>Provide customer support</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Communication</h3>
                <ul className="list-disc pl-6 text-purple-800 space-y-1">
                  <li>Send important service updates</li>
                  <li>Deliver notifications and alerts</li>
                  <li>Respond to your inquiries</li>
                  <li>Send marketing communications (with consent)</li>
                  <li>Provide educational content</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Platform Improvement</h3>
                <ul className="list-disc pl-6 text-green-800 space-y-1">
                  <li>Analyze usage patterns</li>
                  <li>Improve user experience</li>
                  <li>Develop new features</li>
                  <li>Conduct research and analytics</li>
                  <li>Ensure platform security</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Safety & Security</h3>
                <ul className="list-disc pl-6 text-orange-800 space-y-1">
                  <li>Prevent fraud and abuse</li>
                  <li>Enforce community guidelines</li>
                  <li>Protect user safety</li>
                  <li>Comply with legal obligations</li>
                  <li>Monitor platform integrity</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="w-6 h-6 mr-3 text-[#f23b36]" />
              3. Information Sharing and Disclosure
            </h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">We Do NOT Sell Your Data</h3>
              <p className="text-yellow-700">
                We do not sell, rent, or trade your personal information to third parties for commercial purposes.
              </p>
            </div>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Limited Sharing Scenarios</h3>
                <p className="mb-3">We may share your information only in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
                  <li><strong>Service Providers:</strong> Trusted third parties who help us operate our service (hosting, analytics, email delivery)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>Emergency Situations:</strong> To protect the safety of users or the public</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Public Information</h3>
                <p className="text-gray-700 mb-3">
                  The following information may be visible to other users based on your privacy settings:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Your username and profile information</li>
                  <li>Posts and comments you make public</li>
                  <li>Resources you share in public spaces</li>
                  <li>Your participation in public polls</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="w-6 h-6 mr-3 text-[#f23b36]" />
              4. Data Security and Protection
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We implement industry-standard security measures to protect your personal information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>SSL/TLS encryption for data transmission</li>
                    <li>Encrypted data storage</li>
                    <li>Regular security audits</li>
                    <li>Access controls and authentication</li>
                    <li>Secure cloud infrastructure</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Administrative Safeguards</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Employee training on data protection</li>
                    <li>Limited access to personal data</li>
                    <li>Regular policy reviews</li>
                    <li>Incident response procedures</li>
                    <li>Third-party security assessments</li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Data Breach Notification</h3>
                <p className="text-red-700">
                  In the unlikely event of a data breach that affects your personal information, 
                  we will notify you and relevant authorities within 72 hours as required by law.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Bell className="w-6 h-6 mr-3 text-[#f23b36]" />
              5. Push Notifications and Communications
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We may send you various types of communications:
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Types of Communications</h3>
                <ul className="list-disc pl-6 text-blue-800 space-y-2">
                  <li><strong>Essential Notifications:</strong> Account updates, security alerts, service changes</li>
                  <li><strong>Activity Notifications:</strong> Messages, comments, poll results, new followers</li>
                  <li><strong>Campus Updates:</strong> Announcements from your school or campus spaces</li>
                  <li><strong>Marketing Communications:</strong> New features, events, educational content (opt-in)</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Your Control</h3>
                <p className="text-green-700 mb-3">
                  You can control your communication preferences in your account settings:
                </p>
                <ul className="list-disc pl-6 text-green-800 space-y-1">
                  <li>Enable/disable push notifications</li>
                  <li>Set quiet hours for notifications</li>
                  <li>Choose notification types</li>
                  <li>Unsubscribe from marketing emails</li>
                  <li>Update your email preferences</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Globe className="w-6 h-6 mr-3 text-[#f23b36]" />
              6. Cookies and Tracking Technologies
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We use cookies and similar technologies to enhance your experience and analyze usage:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Required for basic functionality, authentication, and security
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Preference Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Remember your settings and preferences
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Help us understand how you use our service
                  </p>
                </div>
              </div>

              <p>
                You can control cookie settings through your browser preferences. 
                Note that disabling certain cookies may affect service functionality.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                You have the following rights regarding your personal information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Access and Control</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>View and update your profile information</li>
                    <li>Download your data</li>
                    <li>Delete your account</li>
                    <li>Control privacy settings</li>
                    <li>Manage notification preferences</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Rights</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Request data correction</li>
                    <li>Request data deletion</li>
                    <li>Object to data processing</li>
                    <li>Request data portability</li>
                    <li>Withdraw consent</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Exercise Your Rights</h3>
                <p className="text-blue-700">
                  To exercise any of these rights, contact us at privacy@stridecampus.com or use the 
                  settings in your account. We will respond to your request within 30 days.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this Privacy Policy:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Retention Periods</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Data:</strong> Retained while your account is active and for 2 years after deletion</li>
                  <li><strong>Usage Data:</strong> Retained for 3 years for analytics and service improvement</li>
                  <li><strong>Communication Records:</strong> Retained for 1 year for customer support purposes</li>
                  <li><strong>Legal Compliance:</strong> Some data may be retained longer to comply with legal obligations</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for international transfers:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard contractual clauses approved by relevant authorities</li>
                  <li>Adequacy decisions for countries with equivalent data protection laws</li>
                  <li>Certification schemes and codes of conduct</li>
                  <li>Consent for specific transfers where appropriate</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Age Requirements</h3>
              <p className="text-yellow-700 mb-3">
                Our Service is designed for students aged 13 and above. We do not knowingly collect 
                personal information from children under 13.
              </p>
              <p className="text-yellow-700">
                If we become aware that we have collected personal information from a child under 13, 
                we will take steps to delete such information promptly.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or legal requirements. We will notify you of significant changes by:
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a notice in our mobile application</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
              </ul>
              
              <p>
                Your continued use of our Service after changes become effective constitutes acceptance 
                of the updated Privacy Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@stridecampus.com</p>
                <p><strong>Website:</strong> https://stridecampus.com</p>
                <p><strong>Address:</strong> Stride Campus Privacy Team, Nairobi, Kenya</p>
                <p><strong>Data Protection Officer:</strong> dpo@stridecampus.com</p>
              </div>
            </div>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

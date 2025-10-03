'use client';
import React from 'react';
import { Cookie, Settings, Shield, BarChart3, Eye } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white mb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Cookie className="w-12 h-12 text-[#f23b36]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cookie Policy
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <div className="flex items-start">
              <Cookie className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">What Are Cookies?</h3>
                <p className="text-blue-700">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better experience and understand how you use our service.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-[#f23b36]" />
              1. How We Use Cookies
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Stride Campus uses cookies and similar technologies to enhance your experience, 
                analyze usage patterns, and improve our service. We use cookies for the following purposes:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Essential Functions</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Keep you logged in</li>
                    <li>Remember your preferences</li>
                    <li>Maintain security</li>
                    <li>Enable core features</li>
                    <li>Prevent fraud</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics & Improvement</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Understand user behavior</li>
                    <li>Improve user experience</li>
                    <li>Track feature usage</li>
                    <li>Identify technical issues</li>
                    <li>Optimize performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-[#f23b36]" />
              2. Types of Cookies We Use
            </h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Essential Cookies</h3>
                <p className="text-green-700 mb-3">
                  These cookies are necessary for the website to function properly and cannot be disabled.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Authentication Cookies</h4>
                    <ul className="list-disc pl-6 text-green-700 text-sm space-y-1">
                      <li>Session management</li>
                      <li>User login status</li>
                      <li>Security tokens</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Functional Cookies</h4>
                    <ul className="list-disc pl-6 text-green-700 text-sm space-y-1">
                      <li>Language preferences</li>
                      <li>Theme settings</li>
                      <li>Form data</li>
                    </ul>
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-3">
                  <strong>Duration:</strong> Session or up to 30 days
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Preference Cookies</h3>
                <p className="text-blue-700 mb-3">
                  These cookies remember your choices and preferences to provide a personalized experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">User Preferences</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li>Notification settings</li>
                      <li>Privacy preferences</li>
                      <li>Display options</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Customization</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li>Dashboard layout</li>
                      <li>Content filters</li>
                      <li>Accessibility settings</li>
                    </ul>
                  </div>
                </div>
                <p className="text-blue-600 text-sm mt-3">
                  <strong>Duration:</strong> Up to 1 year
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Analytics Cookies</h3>
                <p className="text-purple-700 mb-3">
                  These cookies help us understand how you use our service so we can improve it.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Usage Analytics</h4>
                    <ul className="list-disc pl-6 text-purple-700 text-sm space-y-1">
                      <li>Page views and visits</li>
                      <li>Feature usage</li>
                      <li>User interactions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-2">Performance</h4>
                    <ul className="list-disc pl-6 text-purple-700 text-sm space-y-1">
                      <li>Load times</li>
                      <li>Error tracking</li>
                      <li>Device information</li>
                    </ul>
                  </div>
                </div>
                <p className="text-purple-600 text-sm mt-3">
                  <strong>Duration:</strong> Up to 2 years
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">Marketing Cookies</h3>
                <p className="text-orange-700 mb-3">
                  These cookies are used to deliver relevant advertisements and measure their effectiveness.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-2">Advertising</h4>
                    <ul className="list-disc pl-6 text-orange-700 text-sm space-y-1">
                      <li>Ad targeting</li>
                      <li>Campaign tracking</li>
                      <li>Conversion measurement</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 mb-2">Social Media</h4>
                    <ul className="list-disc pl-6 text-orange-700 text-sm space-y-1">
                      <li>Social sharing</li>
                      <li>Social login</li>
                      <li>Social widgets</li>
                    </ul>
                  </div>
                </div>
                <p className="text-orange-600 text-sm mt-3">
                  <strong>Duration:</strong> Up to 1 year
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-[#f23b36]" />
              3. Third-Party Cookies
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We may use third-party services that set their own cookies. These services help us 
                provide better functionality and analyze our service:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Third-Party Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Analytics Services</h4>
                    <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                      <li>Google Analytics - Website analytics</li>
                      <li>Mixpanel - User behavior tracking</li>
                      <li>Hotjar - User experience analysis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Functional Services</h4>
                    <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                      <li>Supabase - Authentication and database</li>
                      <li>Cloudflare - Security and performance</li>
                      <li>Expo - Mobile app services</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Note</h3>
                <p className="text-yellow-700">
                  Third-party cookies are subject to the privacy policies of those third parties. 
                  We do not control these cookies, and you should review the privacy policies of 
                  these services for more information.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-[#f23b36]" />
              4. Your Cookie Choices
            </h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Cookie Consent Management</h3>
                <p className="text-green-700 mb-4">
                  You have several options for managing cookies:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Browser Settings</h4>
                    <ul className="list-disc pl-6 text-green-700 text-sm space-y-1">
                      <li>Block all cookies</li>
                      <li>Block third-party cookies</li>
                      <li>Delete existing cookies</li>
                      <li>Set cookie preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">Our Cookie Banner</h4>
                    <ul className="list-disc pl-6 text-green-700 text-sm space-y-1">
                      <li>Accept all cookies</li>
                      <li>Reject non-essential cookies</li>
                      <li>Customize preferences</li>
                      <li>Change settings anytime</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Browser-Specific Instructions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Desktop Browsers</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                      <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                      <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                      <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Mobile Browsers</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li><strong>iOS Safari:</strong> Settings → Safari → Privacy</li>
                      <li><strong>Android Chrome:</strong> Settings → Site settings → Cookies</li>
                      <li><strong>Firefox Mobile:</strong> Settings → Privacy → Cookies</li>
                      <li><strong>Samsung Internet:</strong> Settings → Privacy → Cookies</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Considerations</h3>
                <ul className="list-disc pl-6 text-red-700 space-y-2">
                  <li>Disabling essential cookies may prevent the website from functioning properly</li>
                  <li>Some features may not work if you block certain cookies</li>
                  <li>Your preferences will be reset if you clear cookies</li>
                  <li>Third-party cookies are controlled by their respective services</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookie Retention Periods</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Different types of cookies are stored for different periods:
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Cookies</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Deleted when you close your browser</li>
                      <li>Used for temporary data</li>
                      <li>Essential for basic functionality</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Persistent Cookies</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Remain on your device for a set period</li>
                      <li>Remember your preferences</li>
                      <li>Used for analytics and marketing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Automatic Deletion</h3>
                <p className="text-blue-700">
                  Cookies automatically expire after their set duration. You can also manually delete 
                  cookies at any time through your browser settings.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Updates to This Cookie Policy</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or legal requirements. When we make significant changes, we will:
              </p>
              
              <ul className="list-disc pl-6 space-y-2">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify you through our website or mobile app</li>
                <li>Send an email notification to registered users</li>
                <li>Display a prominent notice on our service</li>
              </ul>
              
              <p>
                Your continued use of our Service after changes become effective constitutes acceptance 
                of the updated Cookie Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@stridecampus.com</p>
                <p><strong>Website:</strong> https://stridecampus.com</p>
                <p><strong>Address:</strong> Stride Campus Privacy Team, Nairobi, Kenya</p>
                <p><strong>Cookie Questions:</strong> cookies@stridecampus.com</p>
              </div>
            </div>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              This Cookie Policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




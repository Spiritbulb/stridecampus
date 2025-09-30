'use client';
import React from 'react';
import { Copyright, AlertTriangle, FileText, Shield, Mail, Clock } from 'lucide-react';

export default function DMCA() {
  return (
    <div className="min-h-screen bg-white mb-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Copyright className="w-12 h-12 text-[#f23b36]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DMCA & Copyright Policy
          </h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Copyright Protection</h3>
                <p className="text-red-700">
                  Stride Campus respects intellectual property rights and expects our users to do the same. 
                  We have implemented a policy to address copyright infringement in accordance with applicable laws.
                </p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-3 text-[#f23b36]" />
              1. Copyright Policy Overview
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Stride Campus is committed to protecting intellectual property rights and complying with 
                copyright laws. This policy outlines our procedures for handling copyright infringement 
                claims and protecting the rights of content creators.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Commitment</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respect intellectual property rights</li>
                  <li>Respond promptly to valid copyright claims</li>
                  <li>Provide a fair process for all parties</li>
                  <li>Educate users about copyright compliance</li>
                  <li>Maintain a safe environment for original content</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-[#f23b36]" />
              2. User Responsibilities
            </h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">What You Must Do</h3>
                <ul className="list-disc pl-6 text-yellow-700 space-y-2">
                  <li>Only share content you own or have permission to share</li>
                  <li>Respect copyright and intellectual property rights</li>
                  <li>Give proper attribution when required</li>
                  <li>Report copyright violations you encounter</li>
                  <li>Follow fair use guidelines for educational content</li>
                </ul>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Prohibited Activities</h3>
                <ul className="list-disc pl-6 text-red-700 space-y-2">
                  <li>Upload copyrighted material without permission</li>
                  <li>Share pirated textbooks or course materials</li>
                  <li>Reproduce copyrighted content without attribution</li>
                  <li>Use copyrighted images without proper licensing</li>
                  <li>Distribute copyrighted software or media</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Safe Content Sharing</h3>
                <ul className="list-disc pl-6 text-green-700 space-y-2">
                  <li>Share your own original notes and summaries</li>
                  <li>Use content under Creative Commons licenses</li>
                  <li>Share public domain materials</li>
                  <li>Reference copyrighted works with proper citations</li>
                  <li>Create transformative educational content</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="w-6 h-6 mr-3 text-[#f23b36]" />
              3. Reporting Copyright Infringement
            </h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How to File a DMCA Notice</h3>
                <p className="text-blue-700 mb-4">
                  If you believe your copyrighted work has been used without permission, you may submit 
                  a DMCA takedown notice. Your notice must include:
                </p>
                
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-3">Required Information:</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                    <li><strong>Identification:</strong> Description of the copyrighted work claimed to be infringed</li>
                    <li><strong>Location:</strong> Specific URL or location of the infringing material</li>
                    <li><strong>Contact Information:</strong> Your name, address, phone number, and email</li>
                    <li><strong>Good Faith Statement:</strong> Statement that you believe the use is not authorized</li>
                    <li><strong>Accuracy Statement:</strong> Statement that the information is accurate</li>
                    <li><strong>Signature:</strong> Physical or electronic signature of the copyright owner</li>
                  </ol>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Where to Send Your Notice</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> dmca@stridecampus.com</p>
                  <p><strong>Subject Line:</strong> DMCA Takedown Notice</p>
                  <p><strong>Mail:</strong> Stride Campus DMCA Agent, Nairobi, Kenya</p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="list-disc pl-6 text-yellow-700 space-y-2">
                  <li>False claims may result in legal liability</li>
                  <li>Include all required information for faster processing</li>
                  <li>We will respond within 24-48 hours</li>
                  <li>Keep a copy of your notice for your records</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-[#f23b36]" />
              4. Our Response Process
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Takedown Process</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#f23b36] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Receive Notice</h4>
                      <p className="text-gray-700 text-sm">We receive and review your DMCA notice within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#f23b36] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Verify Claim</h4>
                      <p className="text-gray-700 text-sm">We verify the notice meets legal requirements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#f23b36] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Remove Content</h4>
                      <p className="text-gray-700 text-sm">We remove or disable access to the infringing material</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-[#f23b36] text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">4</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Notify Parties</h4>
                      <p className="text-gray-700 text-sm">We notify the user and provide counter-notice information</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Timeline</h3>
                <ul className="list-disc pl-6 text-blue-700 space-y-2">
                  <li><strong>Initial Response:</strong> Within 24-48 hours</li>
                  <li><strong>Content Removal:</strong> Within 48-72 hours for valid claims</li>
                  <li><strong>User Notification:</strong> Within 24 hours of removal</li>
                  <li><strong>Counter-Notice Period:</strong> 10-14 business days</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Counter-Notice Process</h2>
            
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">If You Receive a DMCA Notice</h3>
                <p className="text-green-700 mb-4">
                  If you believe your content was removed in error, you may file a counter-notice. 
                  This is a serious legal action that should only be taken if you have a good faith 
                  belief that the material was removed by mistake.
                </p>
                
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold text-gray-900 mb-3">Counter-Notice Requirements:</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                    <li>Your name, address, phone number, and email</li>
                    <li>Identification of the removed material and its location</li>
                    <li>Statement under penalty of perjury that you believe the material was removed by mistake</li>
                    <li>Consent to jurisdiction of federal court</li>
                    <li>Your physical or electronic signature</li>
                  </ol>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Warning</h3>
                <p className="text-yellow-700">
                  Filing a false counter-notice may result in legal liability. Only file a counter-notice 
                  if you have a good faith belief that the material was removed by mistake or misidentification.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Repeat Infringer Policy</h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Stride Campus maintains a strict policy against repeat copyright infringers:
              </p>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Consequences for Repeat Infringers</h3>
                <ul className="list-disc pl-6 text-red-700 space-y-2">
                  <li><strong>First Offense:</strong> Warning and content removal</li>
                  <li><strong>Second Offense:</strong> Temporary account suspension (7-30 days)</li>
                  <li><strong>Third Offense:</strong> Extended suspension (30-90 days)</li>
                  <li><strong>Multiple Offenses:</strong> Permanent account termination</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Appeal Process</h3>
                <p className="text-gray-700 mb-3">
                  Users may appeal account actions by contacting our support team with:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Explanation of the circumstances</li>
                  <li>Evidence of permission or fair use</li>
                  <li>Steps taken to prevent future violations</li>
                  <li>Request for account restoration</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Educational Use and Fair Use</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Fair Use Guidelines</h3>
                <p className="text-blue-700 mb-4">
                  Educational use may qualify as fair use under certain circumstances. Consider these factors:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Permitted Uses</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li>Quoting small portions for commentary</li>
                      <li>Creating study guides and summaries</li>
                      <li>Sharing public domain materials</li>
                      <li>Using content with proper attribution</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Restricted Uses</h4>
                    <ul className="list-disc pl-6 text-blue-700 text-sm space-y-1">
                      <li>Sharing entire copyrighted works</li>
                      <li>Distributing commercial materials</li>
                      <li>Posting copyrighted images without permission</li>
                      <li>Sharing copyrighted software or media</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-400 p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Best Practices for Students</h3>
                <ul className="list-disc pl-6 text-green-700 space-y-2">
                  <li>Create your own original notes and summaries</li>
                  <li>Use open educational resources when possible</li>
                  <li>Always provide proper citations and attribution</li>
                  <li>Respect the intellectual property of others</li>
                  <li>When in doubt, ask for permission or use alternatives</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                For copyright-related inquiries, please contact our DMCA agent:
              </p>
              
              <div className="space-y-2 text-gray-700">
                <p><strong>DMCA Agent Email:</strong> dmca@stridecampus.com</p>
                <p><strong>General Copyright Questions:</strong> copyright@stridecampus.com</p>
                <p><strong>Legal Department:</strong> legal@stridecampus.com</p>
                <p><strong>Website:</strong> https://stridecampus.com</p>
                <p><strong>Address:</strong> Stride Campus Legal Department, Nairobi, Kenya</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Legal Disclaimer</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                This policy is provided for informational purposes only and does not constitute legal advice. 
                Copyright law is complex and varies by jurisdiction. For specific legal questions, please 
                consult with a qualified attorney.
              </p>
              
              <p className="text-gray-700">
                Stride Campus reserves the right to modify this policy at any time. Users are responsible 
                for staying informed of any changes to this policy.
              </p>
            </div>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-sm text-gray-500 text-center">
              This DMCA & Copyright Policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

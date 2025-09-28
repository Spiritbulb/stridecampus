'use client';
import React from 'react';
import { Heart, Phone, Instagram, Twitter, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DonationSectionProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export default function DonationSection({ variant = 'full', className = '' }: DonationSectionProps) {
  const copyTillNumber = () => {
    navigator.clipboard.writeText('4203518');
    // You could add a toast notification here
  };

  const openSocialLink = (platform: 'instagram' | 'twitter' | 'tiktok') => {
    const urls = {
      instagram: 'https://instagram.com/stridecampus',
      twitter: 'https://twitter.com/stridecampus',
      tiktok: 'https://tiktok.com/@stridecampus'
    };
    window.open(urls[platform], '_blank');
  };

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="text-red-500" size={18} />
            <h3 className="font-semibold text-sm">Support Stride Campus</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Help keep our platform free for all students
          </p>
        </div>

        {/* MPesa Donation */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-lg border border-red-200">
          <div className="text-center">
            <Phone className="mx-auto text-[#f23b36] mb-2" size={20} />
            <p className="text-xs text-gray-600 mb-1">MPesa Till Number</p>
            <p className="text-lg font-bold text-[#f23b36] mb-2">4203518</p>
            <Button 
              onClick={copyTillNumber}
              variant="outline" 
              size="sm"
              className="w-full text-xs h-8"
            >
              Copy Till Number
            </Button>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <p className="text-xs text-gray-600 text-center mb-2">Follow us for updates</p>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => openSocialLink('instagram')}
            >
              <Instagram size={14} className="text-pink-500" />
              <span className="text-xs">Instagram</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => openSocialLink('twitter')}
            >
              <Twitter size={14} className="text-blue-500" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => openSocialLink('tiktok')}
            >
              <div className="w-3.5 h-3.5 bg-black rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <span className="text-xs">TikTok</span>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Every contribution helps! 🎓
          </p>
        </div>
      </div>
    );
  }

  // Full variant for settings page
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="text-red-500" size={24} />
            Support Stride Campus
          </CardTitle>
          <CardDescription>
            Help us keep Stride Campus free and accessible for all students!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
            <h3 className="font-semibold text-lg mb-2">Why Your Support Matters</h3>
            <p className="text-gray-700 mb-4">
              Stride Campus is built by students, for students. Your contributions help us:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#f23b36] rounded-full"></div>
                Keep the platform completely free for all students
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#f23b36] rounded-full"></div>
                Add new features and improve existing ones
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#f23b36] rounded-full"></div>
                Maintain our servers and infrastructure
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#f23b36] rounded-full"></div>
                Support student communities across Kenya
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-[#f23b36] border-2">
              <CardHeader className="text-center">
                <Phone className="mx-auto text-[#f23b36] mb-2" size={32} />
                <CardTitle className="text-lg">MPesa Donation</CardTitle>
                <CardDescription>Send any amount via MPesa</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Till Number</p>
                  <p className="text-2xl font-bold text-[#f23b36]">4203518</p>
                </div>
                <Button 
                  onClick={copyTillNumber}
                  variant="outline" 
                  className="w-full"
                >
                  Copy Till Number
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center gap-2 mb-2">
                  <Instagram className="text-pink-500" size={24} />
                  <Twitter className="text-blue-500" size={24} />
                </div>
                <CardTitle className="text-lg">Follow Us</CardTitle>
                <CardDescription>Stay updated with our latest news</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => openSocialLink('instagram')}
                >
                  <Instagram size={16} />
                  @stridecampus
                  <ExternalLink size={12} />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => openSocialLink('twitter')}
                >
                  <Twitter size={16} />
                  @stridecampus
                  <ExternalLink size={12} />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={() => openSocialLink('tiktok')}
                >
                  <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  @stridecampus
                  <ExternalLink size={12} />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-700">
              <strong>Thank you!</strong> Every contribution, no matter the size, helps us build a better platform for students everywhere. 🎓
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

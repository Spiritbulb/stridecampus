// app/referrals/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabaseClient';
import { Copy, Check, Users, CreditCard, Clock, X, Award } from 'lucide-react';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  bonus_awarded: boolean;
  created_at: string;
  completed_at: string | null;
  referred_user?: {
    email: string;
    full_name: string;
    created_at: string;
  };
}

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    earned: 0
  });

  useEffect(() => {
    if (user) {
      fetchReferrals();
      fetchStats();
    }
  }, [user]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:users!referred_id (
            email,
            full_name,
            created_at
          )
        `)
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('status, bonus_awarded')
        .eq('referrer_id', user?.id);

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const earned = data?.filter(r => r.bonus_awarded).length * 50; // Assuming 50 credits per referral

      setStats({ total, completed, pending, earned });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/arena?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
        <div className='flex min-h-screen items-center justify-center'>
            <LoadingSpinner size='large'/>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 mb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stride is better with friends</h1>
          <p className="text-gray-600">
            Invite your friends and earn credits when they join Stride Campus!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Earned</p>
                <p className="text-2xl font-bold text-purple-600">{stats.earned}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <code className="text-sm text-gray-800 break-all">
                {`${window.location.origin}/arena?ref=${user?.referral_code}`}
              </code>
            </div>
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-[#f23b36] text-white rounded-lg hover:bg-[#f23b36]/60 transition-colors flex items-center space-x-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Share this link with friends. You'll earn 50 credits when they sign up and complete their profile.
          </p>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Referral History</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No referrals yet. Share your link to start earning!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Friend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referred_user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.referred_user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                          {getStatusIcon(referral.status)}
                          <span className="ml-1 capitalize">{referral.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.bonus_awarded ? (
                          <span className="text-green-600">+50 credits</span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f23b36] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Copy your unique referral link and share it with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f23b36] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">They Sign Up</h3>
              <p className="text-sm text-gray-600">
                Your friends sign up using your referral link
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#f23b36] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-white">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Earn Credits</h3>
              <p className="text-sm text-gray-600">
                Get 50 credits when they complete their profile
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { User } from '@/utils/supabaseClient';
import { Plus, ShoppingBag, User as UserIcon, CheckCircle, XCircle } from 'lucide-react';

interface MarketplaceListing {
  id: number;
  user_id: string;
  space_id: string;
  title: string;
  description: string;
  price: number;
  created_at: string;
  virtual_contract_signatures: string[];
  contract_applications: string[];
  author?: User;
}

interface MarketplaceTabProps {
  listings: MarketplaceListing[];
  user: User | null;
  canCreateListing: boolean;
  isLoading: boolean;
  onCreateListing: () => void;
  onApplyToListing: (listingId: number) => void;
  onAcceptApplication: (listingId: number, applicantId: string) => void;
  onRejectApplication: (listingId: number, applicantId: string) => void;
  getUserById: (userId: string) => Promise<User | null>;
}

const MarketplaceTab = memo(function MarketplaceTab({ 
  listings, 
  user, 
  canCreateListing,
  isLoading,
  onCreateListing,
  onApplyToListing,
  onAcceptApplication,
  onRejectApplication,
  getUserById
}: MarketplaceTabProps) {
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  const handleToggleApplications = useCallback((listing: MarketplaceListing) => {
    setSelectedListing(selectedListing?.id === listing.id ? null : listing);
  }, [selectedListing]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23b36] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Marketplace</h2>
        {canCreateListing && (
          <button 
            onClick={onCreateListing}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-[#f23b36]" />
          </button>
        )}
      </div>

      {listings.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {listings.map((listing) => (
            <div key={listing.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{listing.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{listing.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      KSH {listing.price}
                    </span>
                    <span>By {listing.author?.full_name || 'Unknown'}</span>
                    <span>{listing.virtual_contract_signatures.length} signed</span>
                    <span>{listing.contract_applications.length} applied</span>
                  </div>
                </div>
              </div>

              {user && listing.user_id !== user.id && !listing.virtual_contract_signatures.includes(user.id) && !listing.contract_applications.includes(user.id) && (
                <button
                  onClick={() => onApplyToListing(listing.id)}
                  className="mt-2 px-4 py-1.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
                >
                  Apply
                </button>
              )}

              {user && listing.user_id === user.id && (
                <button
                  onClick={() => handleToggleApplications(listing)}
                  className="mt-2 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  {selectedListing?.id === listing.id ? 'Hide' : 'View'} Applications ({listing.contract_applications.length})
                </button>
              )}

              {selectedListing?.id === listing.id && (
                <ApplicationsList
                  applications={listing.contract_applications}
                  signatures={listing.virtual_contract_signatures}
                  listingId={listing.id}
                  onAccept={onAcceptApplication}
                  onReject={onRejectApplication}
                  getUserById={getUserById}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No marketplace listings yet.</p>
          {canCreateListing && (
            <button 
              onClick={onCreateListing}
              className="px-6 py-2.5 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
            >
              Create First Listing
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// Applications List Component
function ApplicationsList({ 
  applications, 
  signatures, 
  listingId, 
  onAccept, 
  onReject, 
  getUserById 
}: { 
  applications: string[];
  signatures: string[];
  listingId: number;
  onAccept: (listingId: number, userId: string) => void;
  onReject: (listingId: number, userId: string) => void;
  getUserById: (userId: string) => Promise<User | null>;
}) {
  const [users, setUsers] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const allUserIds = [...applications, ...signatures];
      const userMap: { [key: string]: User } = {};
      
      await Promise.all(
        allUserIds.map(async (userId) => {
          const user = await getUserById(userId);
          if (user) {
            userMap[userId] = user;
          }
        })
      );
      
      setUsers(userMap);
    };

    fetchUsers();
  }, [applications, signatures, getUserById]);

  return (
    <div className="mt-3 space-y-3">
      {signatures.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Signed Contracts ({signatures.length})</h4>
          <div className="space-y-2">
            {signatures.map(userId => (
              <div key={userId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {users[userId]?.avatar_url ? (
                    <img src={users[userId].avatar_url} alt={users[userId].full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{users[userId]?.full_name || 'Loading...'}</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {applications.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Pending Applications ({applications.length})</h4>
          <div className="space-y-2">
            {applications.map(userId => (
              <div key={userId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {users[userId]?.avatar_url ? (
                    <img src={users[userId].avatar_url} alt={users[userId].full_name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{users[userId]?.full_name || 'Loading...'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(listingId, userId)}
                    className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReject(listingId, userId)}
                    className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplaceTab;

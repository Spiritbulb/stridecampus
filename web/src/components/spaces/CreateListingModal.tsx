'use client';

import { memo, useState } from 'react';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (listing: { title: string; description: string; price: string }) => void;
}

const CreateListingModal = memo(function CreateListingModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: CreateListingModalProps) {
  const [newListing, setNewListing] = useState({ title: '', description: '', price: '' });

  const handleCreate = () => {
    onCreate(newListing);
    setNewListing({ title: '', description: '', price: '' });
  };

  const handleCancel = () => {
    setNewListing({ title: '', description: '', price: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <h3 className="font-semibold text-gray-900 mb-3">Create Listing</h3>
      <input
        type="text"
        placeholder="Title"
        value={newListing.title}
        onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
      />
      <textarea
        placeholder="Description"
        value={newListing.description}
        onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
        rows={3}
      />
      <input
        type="number"
        placeholder="Price (KSH)"
        value={newListing.price}
        onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f23b36]"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          className="flex-1 px-4 py-2 bg-[#f23b36] text-white rounded-full hover:bg-[#d93531] transition-colors text-sm font-semibold"
        >
          Create
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

export default CreateListingModal;

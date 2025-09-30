// hooks/useCreateModal.ts
'use client';
import { useState, useCallback } from 'react';
import { Space } from '@/utils/supabaseClient';

interface CreateModalState {
  isOpen: boolean;
  type: 'post' | 'space';
  initialSpaceId?: string;
}

export function useCreateModal() {
  const [modalState, setModalState] = useState<CreateModalState>({
    isOpen: false,
    type: 'post'
  });

  const openModal = useCallback((type: 'post' | 'space' = 'post', initialSpaceId?: string) => {
    setModalState({
      isOpen: true,
      type,
      initialSpaceId
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const openPostModal = useCallback((initialSpaceId?: string) => {
    openModal('post', initialSpaceId);
  }, [openModal]);

  const openSpaceModal = useCallback(() => {
    openModal('space');
  }, [openModal]);

  return {
    ...modalState,
    openModal,
    closeModal,
    openPostModal,
    openSpaceModal
  };
}
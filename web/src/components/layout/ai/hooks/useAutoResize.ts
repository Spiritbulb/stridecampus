import { useRef, useEffect } from 'react';

export const useAutoResize = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, []);

  return { textareaRef, resizeTextarea };
};
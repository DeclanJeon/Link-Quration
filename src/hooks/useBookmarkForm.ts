// src/hooks/useBookmarkForm.ts
'use client';

import { useState, useCallback } from 'react';
import { BookmarkFormData, Bookmark } from '@/types/bookmark';

const INITIAL_FORM_DATA: BookmarkFormData = {
  url: '',
  title: '',
  description: '',
  category: '',
  isPublic: true,
  tags: [],
};

export const useBookmarkForm = () => {
  const [formData, setFormData] = useState<BookmarkFormData>(INITIAL_FORM_DATA);
  const [newTag, setNewTag] = useState<string>('');

  const handleInputChange = useCallback(
    (field: keyof BookmarkFormData, value: string | boolean | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setNewTag('');
  }, []);

  const updateFormFromExtraction = useCallback((extractionResult: any) => {
    if (extractionResult) {
      setFormData((prev) => ({
        ...prev,
        title: extractionResult.title || prev.title,
        description: extractionResult.excerpt || prev.description,
      }));
    }
  }, []);

  return {
    formData,
    newTag,
    setNewTag,
    handleInputChange,
    addTag,
    removeTag,
    resetForm,
    updateFormFromExtraction,
  };
};

// src/hooks/useBookmarkForm.ts
'use client';

import { useState, useCallback } from 'react';
import { BookmarkFormData } from '@/types/bookmark';

const INITIAL_FORM_DATA: BookmarkFormData = {
  url: '',
  title: '',
  description: '',
  category: '',
  isPublic: true,
  tags: [],
  image: '',
};

export const useBookmarkForm = () => {
  const [formData, setFormData] = useState<BookmarkFormData>(INITIAL_FORM_DATA);
  const [newTag, setNewTag] = useState<string>('');

  const handleInputChange = useCallback(
    (field: keyof BookmarkFormData, value: string | boolean | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
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

  const updateFormFromExtraction = useCallback(
    (extractionResult: any) => {
      if (extractionResult) {
        setFormData((prev) => {
          // 이미지 URL 우선순위: leadImageUrl > favicon > 이전 이미지
          const imageUrl = extractionResult.leadImageUrl || extractionResult.favicon || prev.image;

          return {
            ...prev,
            title: extractionResult.title || prev.title,
            description: extractionResult.excerpt || prev.description,
            image: imageUrl,
          };
        });

        // 카테고리가 없으면 도메인 기반으로 추천
        if (!formData.category && extractionResult.domain) {
          const domain = extractionResult.domain.toLowerCase();
          let suggestedCategory = '기타';

          if (
            domain.includes('github') ||
            domain.includes('gitlab') ||
            domain.includes('bitbucket')
          ) {
            suggestedCategory = '개발';
          } else if (
            domain.includes('medium') ||
            domain.includes('tistory') ||
            domain.includes('velog')
          ) {
            suggestedCategory = '블로그';
          } else if (
            domain.includes('youtube') ||
            domain.includes('vimeo') ||
            domain.includes('twitch')
          ) {
            suggestedCategory = '미디어';
          } else if (
            domain.includes('news') ||
            domain.includes('press') ||
            domain.includes('hani')
          ) {
            suggestedCategory = '뉴스';
          } else if (
            domain.includes('academy') ||
            domain.includes('tutorial') ||
            domain.includes('inflearn')
          ) {
            suggestedCategory = '교육';
          }

          setFormData((prev) => ({
            ...prev,
            category: suggestedCategory,
          }));
        }
      }
    },
    [formData.category],
  );

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

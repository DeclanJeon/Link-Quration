/**
 * 미디어 URL인지 확인하는 함수
 * @param url 확인할 URL
 * @returns 미디어 URL 여부와 유형
 */
export const detectMediaType = (url: string): { isMedia: boolean; type?: 'video' | 'audio' | 'image' } => {
  if (!url) return { isMedia: false };

  // 비디오 URL 패턴 (YouTube, Vimeo, 직접 비디오 링크 등)
  const videoPatterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^&]+)/i,
    /vimeo\.com\/([0-9]+)/i,
    /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i
  ];

  // 오디오 URL 패턴
  const audioPatterns = [
    /soundcloud\.com\/[^/]+\/[^/]+/i,
    /spotify\.com\/track\/([^?]+)/i,
    /\.(mp3|wav|ogg|m4a|flac|aac)$/i
  ];

  // 이미지 URL 패턴
  const imagePatterns = [
    /\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff?)(\?.*)?$/i
  ];

  if (videoPatterns.some(pattern => pattern.test(url))) {
    return { isMedia: true, type: 'video' };
  }

  if (audioPatterns.some(pattern => pattern.test(url))) {
    return { isMedia: true, type: 'audio' };
  }

  if (imagePatterns.some(pattern => pattern.test(url))) {
    return { isMedia: true, type: 'image' };
  }

  return { isMedia: false };
};

/**
 * URL에서 미디어 ID 추출 (YouTube, Vimeo 등)
 */
export const extractMediaId = (url: string, type: 'youtube' | 'vimeo'): string | null => {
  if (!url) return null;

  switch (type) {
    case 'youtube':
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/i);
      return youtubeMatch ? youtubeMatch[1] : null;
    
    case 'vimeo':
      const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/i);
      return vimeoMatch ? vimeoMatch[1] : null;
    
    default:
      return null;
  }
};

import { useState, useEffect } from 'react';

/**
 * 디바운스 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간(밀리초)
 * @returns 디바운스된 값
 */
function useDebounce<T>(value: T, delay: number): T {
  // 상태와 setter를 저장
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delay 후에 debouncedValue를 업데이트하는 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 클린업 함수: 다음 effect가 실행되기 전에 타이머를 클리어
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // 값이나 딜레이가 바뀔 때마다 effect 재실행

  return debouncedValue;
}

export default useDebounce;

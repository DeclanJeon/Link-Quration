import { NextRequest, NextResponse } from 'next/server';
import { sampleBookmarks } from '@/mock/bookmark';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookmark = sampleBookmarks.find(b => b.id === parseInt(params.id));
    
    if (!bookmark) {
      return NextResponse.json(
        { error: '북마크를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조회수 증가 (실제 구현에서는 DB 업데이트 필요)
    // await prisma.bookmark.update({
    //   where: { id: parseInt(params.id) },
    //   data: { viewCount: { increment: 1 } },
    // });


    // 관련 콘텐츠 찾기 (카테고리 기반)
    const relatedBookmarks = sampleBookmarks
      .filter(b => 
        b.id !== bookmark.id && 
        (b.category === bookmark.category || 
         b.tags.some(tag => bookmark.tags.includes(tag)))
      )
      .slice(0, 4);

    return NextResponse.json({
      ...bookmark,
      relatedBookmarks
    });
  } catch (error) {
    console.error('북마크 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '북마크를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

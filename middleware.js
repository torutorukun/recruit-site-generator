import { NextResponse } from 'next/server';

export async function middleware(request) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // ジェネレーター本体のドメインはスルー
  if (
    hostname === 'recruit-site-generator.vercel.app' ||
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app')
  ) {
    return NextResponse.next();
  }

  // カスタムドメインの場合はview-siteに転送
  const url = request.nextUrl.clone();
  url.pathname = '/api/view-site';
  url.searchParams.set('host', hostname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

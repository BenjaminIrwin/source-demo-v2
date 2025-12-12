import { NextResponse } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'demo2025';

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body;

  if (password === SITE_PASSWORD) {
    const response = NextResponse.json({ success: true });
    
    // Set auth cookie - expires in 7 days
    response.cookies.set('site-auth', SITE_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}


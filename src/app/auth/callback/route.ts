import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const errorDescription = searchParams.get('error_description') || searchParams.get('error');

  if (errorDescription) {
    console.error('OAuth provider error:', errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`);
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data?.session) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else if (error) {
        console.error('Supabase exchangeCodeForSession error:', error.message, error);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
      }
    } catch (err: any) {
      console.error('Unexpected callback error:', err);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err.message || 'auth_exception')}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=no_auth_code`);
}

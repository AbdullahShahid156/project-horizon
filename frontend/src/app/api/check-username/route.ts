import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false, error: 'Username must be at least 3 characters' });
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return NextResponse.json({ available: false, error: 'Username can only contain lowercase letters, numbers, dots, hyphens, and underscores' });
  }

  try {
    const { data } = await supabase
      .from('User')
      .select('id')
      .eq('username', username)
      .limit(1);
    return NextResponse.json({ available: !data || data.length === 0 });
  } catch {
    return NextResponse.json({ available: true });
  }
}

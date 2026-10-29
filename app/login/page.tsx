'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Google login error:', error.message)
      alert('Google 로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <button
        onClick={handleGoogleLogin}
        className="rounded-lg border px-6 py-3"
      >
        Google로 계속하기
      </button>
    </main>
  )
}
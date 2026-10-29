import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MyPostsSection from '@/components/MyPostsSection'
import {
  updateUsername,
  updateProfileImage,
} from './actions'


type Props = {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

export default async function MyProfilePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
 
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, profile_image_path, role')
    .eq('id', user.id)
    .single()

  const { data: privateProfile } = await supabase
    .from('user_private_profiles')
    .select('email')
    .eq('user_id', user.id)
    .single()

  let profileImageUrl: string | null = null

  if (profile?.profile_image_path) {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.profile_image_path)

    profileImageUrl = data.publicUrl
  }

  let message = ''

  if (params.success === 'username') {
    message = '사용자명이 변경되었습니다.'
  }

  if (params.success === 'image') {
    message = '프로필 이미지가 변경되었습니다.'
  }

  if (params.error === 'username_length') {
    message = '사용자명은 3~30자로 입력해주세요.'
  }

  if (params.error === 'username_format') {
    message = '사용자명은 영문 소문자, 숫자, ., _ 만 사용할 수 있습니다.'
  }

  if (params.error === 'username_duplicate') {
    message = '이미 사용 중인 사용자명입니다.'
  }

  if (params.error === 'image_required') {
    message = '이미지를 선택해주세요.'
  }

  if (params.error === 'image_type') {
    message = 'JPG, PNG, WEBP 이미지만 사용할 수 있습니다.'
  }

  if (params.error === 'image_size') {
    message = '이미지는 5MB 이하만 업로드할 수 있습니다.'
  }

  if (params.error === 'image_upload') {
    message = '이미지 업로드 중 오류가 발생했습니다.'
  }

  if (params.error === 'image_db') {
    message = '프로필 이미지 저장 중 오류가 발생했습니다.'
  }

  if (params.error === 'unknown') {
    message = '사용자명 변경 중 오류가 발생했습니다.'
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">마이 프로필</h1>

      {message && (
        <p className="mt-4 rounded-lg border p-3">
          {message}
        </p>
      )}

      <div className="mt-6 space-y-6">
        {/* 사용자명 */}
        <form action={updateUsername}>
          <label
            htmlFor="username"
            className="block font-semibold"
          >
            사용자명
          </label>

          <input
            id="username"
            name="username"
            type="text"
            defaultValue={profile?.username ?? ''}
            minLength={3}
            maxLength={30}
            required
            className="mt-2 w-full max-w-md rounded-lg border px-4 py-3"
          />

          <p className="mt-2 text-sm">
            영문 소문자, 숫자, ., _ 사용 가능
          </p>

          <button
            type="submit"
            className="mt-3 rounded-lg border px-5 py-3"
          >
            사용자명 저장
          </button>
        </form>

        {/* 이메일 */}
        <div>
          <strong>이메일</strong>
          <p>{privateProfile?.email ?? user.email ?? '-'}</p>
        </div>

        {/* 권한 */}
        <div>
          <strong>권한</strong>
          <p>{profile?.role ?? '-'}</p>
        </div>

        {/* 프로필 이미지 */}
        <div>
          <strong>프로필 이미지</strong>

          <div className="mt-3">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="프로필 이미지"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border">
                기본
              </div>
            )}
          </div>

          <form
            action={updateProfileImage}
            className="mt-4"
          >
            <input
              type="file"
              name="profileImage"
              accept="image/jpeg,image/png,image/webp"
              required
            />

            <button
              type="submit"
              className="mt-3 block rounded-lg border px-5 py-3"
            >
              프로필 이미지 저장
            </button>
          </form>
        </div>
      </div>

      {/* 로그아웃 */}
      <form
        action="/auth/signout"
        method="post"
        className="mt-8"
      >
        <button
          type="submit"
          className="rounded-lg border px-5 py-3"
        >
          로그아웃
        </button>
      </form>
      <MyPostsSection />
    </main>
  )
}
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// 사용자명 수정
export async function updateUsername(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const username = String(formData.get('username') ?? '')
    .trim()
    .toLowerCase()

  if (username.length < 3 || username.length > 30) {
    redirect('/me/profile?error=username_length')
  }

  if (!/^[a-z0-9._]+$/.test(username)) {
    redirect('/me/profile?error=username_format')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      redirect('/me/profile?error=username_duplicate')
    }

    console.error(error)
    redirect('/me/profile?error=unknown')
  }

  revalidatePath('/me/profile')
  redirect('/me/profile?success=username')
}


// 프로필 이미지 수정
export async function updateProfileImage(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const file = formData.get('profileImage') as File | null

  if (!file || file.size === 0) {
    redirect('/me/profile?error=image_required')
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    redirect('/me/profile?error=image_type')
  }

  const maxSize = 5 * 1024 * 1024

  if (file.size > maxSize) {
    redirect('/me/profile?error=image_size')
  }

  const extension =
    file.name.split('.').pop()?.toLowerCase() ?? 'jpg'

  const filePath = `${user.id}/avatar.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('Profile image upload error:', uploadError)
    redirect('/me/profile?error=image_upload')
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      profile_image_path: filePath,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Profile image DB update error:', updateError)
    redirect('/me/profile?error=image_db')
  }

  revalidatePath('/me/profile')
  redirect('/me/profile?success=image')
}
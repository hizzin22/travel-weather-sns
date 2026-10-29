'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  postId: string
  userId: string | null
  initialLiked: boolean
  initialCount: number
}

export default function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
}: Props) {
  const router = useRouter()

  const [liked, setLiked] =
    useState(initialLiked)

  const [count, setCount] =
    useState(initialCount)

  const [loading, setLoading] =
    useState(false)

  const handleLike = async () => {
    if (!userId) {
      router.push('/login')
      return
    }


  if (loading) {
    return
  }

  setLoading(true)

  const supabase =
    createClient()

    try {
      if (liked) {
        // 좋아요 취소
        const { error } =
          await supabase
            .from('likes')
            .delete()
            .eq(
              'post_id',
              postId
            )
            .eq(
              'user_id',
              userId
            )

        if (error) {
          console.error(
            'Like delete error:',
            error
          )
          return
        }

        setLiked(false)

        setCount(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        )
      } else {
        // 좋아요 추가
        const { error } =
          await supabase
            .from('likes')
            .insert({
              post_id:
                postId,
              user_id:
                userId,
            })

        if (error) {
          console.error(
            'Like insert error:',
            error
          )
          return
        }

        setLiked(true)

        setCount(
          (current) =>
            current + 1
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading}
      className="flex items-center gap-2 disabled:opacity-50"
      aria-label={
        liked
          ? 'Unlike'
          : 'Like'
      }
    >
      <svg
	  xmlns="http://www.w3.org/2000/svg"
	  viewBox="0 0 24 24"
	  fill={
	    liked
	      ? 'currentColor'
	      : 'none'
	  }
	  stroke="currentColor"
	  strokeWidth="1.8"
	  className={`h-4 w-4 ${
	    liked
	      ? 'text-red-500'
	      : 'text-gray-500'
	  }`}
	>
	  <path
	    strokeLinecap="round"
	    strokeLinejoin="round"
	    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
	  />
	</svg>

      <span className="text-sm">
        {count}
      </span>
    </button>
  )
}
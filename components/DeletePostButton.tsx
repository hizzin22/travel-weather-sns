'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

type Props = {
  postId: string
  currentUserId: string
  postUserId: string
  locale: string
}

export default function DeletePostButton({
  postId,
  currentUserId,
  postUserId,
  locale,
}: Props) {
  const router = useRouter()

  const [deleting, setDeleting] =
    useState(false)

  const handleDelete = async () => {
    // 본인 게시물만 삭제 가능
    if (currentUserId !== postUserId) {
      return
    }

    const confirmed =
      window.confirm(
        locale === 'ko'
          ? '게시물을 삭제하시겠습니까?'
          : 'Delete this post?'
      )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const supabase =
      createClient()

    try {
      // =========================
      // 1. 게시물 미디어 경로 조회
      // =========================

      const {
        data: mediaRows,
        error: mediaReadError,
      } =
        await supabase
          .from('post_media')
          .select(
            'storage_path, thumbnail_path'
          )
          .eq(
            'post_id',
            postId
          )

      if (mediaReadError) {
        console.error(
          'Delete media read error:',
          mediaReadError
        )

        throw new Error(
          '미디어 조회 실패'
        )
      }

      // =========================
      // 2. Storage 실제 파일 삭제
      // =========================

      const storagePaths =
        (mediaRows ?? [])
          .flatMap(
            (item) => [
              item.storage_path,
              item.thumbnail_path,
            ]
          )
          .filter(
            (path): path is string =>
              Boolean(path)
          )

      if (
        storagePaths.length > 0
      ) {
        const {
          error:
            storageDeleteError,
        } =
          await supabase.storage
            .from(
              'post-media'
            )
            .remove(
              storagePaths
            )

        if (
          storageDeleteError
        ) {
          console.error(
            'Storage delete error:',
            storageDeleteError
          )

          throw new Error(
            'Storage 파일 삭제 실패'
          )
        }
      }

      // =========================
      // 3. post_media 삭제
      // =========================

      const {
        error:
          mediaDeleteError,
      } =
        await supabase
          .from(
            'post_media'
          )
          .delete()
          .eq(
            'post_id',
            postId
          )

      if (
        mediaDeleteError
      ) {
        console.error(
          'Post media delete error:',
          mediaDeleteError
        )

        throw new Error(
          '미디어 정보 삭제 실패'
        )
      }

      // =========================
      // 4. 옷차림 태그 연결 삭제
      // =========================

      const {
        error:
          outfitDeleteError,
      } =
        await supabase
          .from(
            'post_outfit_tags'
          )
          .delete()
          .eq(
            'post_id',
            postId
          )

      if (
        outfitDeleteError
      ) {
        console.error(
          'Outfit delete error:',
          outfitDeleteError
        )

        throw new Error(
          '옷차림 태그 삭제 실패'
        )
      }

      // =========================
      // 5. 좋아요 삭제
      // =========================

      const {
        error:
          likesDeleteError,
      } =
        await supabase
          .from('likes')
          .delete()
          .eq(
            'post_id',
            postId
          )

      if (
        likesDeleteError
      ) {
        console.error(
          'Likes delete error:',
          likesDeleteError
        )

        throw new Error(
          '좋아요 삭제 실패'
        )
      }

      // =========================
      // 6. private location 삭제
      // =========================

      const {
        error:
          locationDeleteError,
      } =
        await supabase
          .from(
            'post_private_locations'
          )
          .delete()
          .eq(
            'post_id',
            postId
          )

      if (
        locationDeleteError
      ) {
        console.error(
          'Private location delete error:',
          locationDeleteError
        )

        throw new Error(
          '위치 정보 삭제 실패'
        )
      }

      // =========================
      // 7. 마지막으로 posts 삭제
      // =========================

      const {
        error:
          postDeleteError,
      } =
        await supabase
          .from('posts')
          .delete()
          .eq(
            'id',
            postId
          )
          .eq(
            'user_id',
            currentUserId
          )

      if (
        postDeleteError
      ) {
        console.error(
          'Post delete error:',
          postDeleteError
        )

        throw new Error(
          '게시물 삭제 실패'
        )
      }

      // 피드 새로고침
      router.refresh()
    } catch (error) {
      console.error(
        'Delete post error:',
        error
      )

      alert(
        locale === 'ko'
          ? '게시물을 삭제하지 못했습니다.'
          : 'Failed to delete the post.'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (
    currentUserId !==
    postUserId
  ) {
    return null
  }

  return (
    <button
      type="button"
      onClick={
        handleDelete
      }
      disabled={
        deleting
      }
      className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-50"
    >
      {deleting
        ? locale === 'ko'
          ? '삭제 중...'
          : 'Deleting...'
        : locale === 'ko'
          ? '삭제'
          : 'Delete'}
    </button>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  display_city: string | null
  display_country: string | null
  display_weather_condition: string | null
  display_temperature: number | null
  content: string | null
  created_at: string
}

type PostMedia = {
  id: string
  post_id: string
  media_type: 'image' | 'video'
  storage_path: string
  sort_order: number
}

export default function MyPostsSection() {
  const locale = useLocale()

  const [posts, setPosts] =
    useState<Post[]>([])

  const [media, setMedia] =
    useState<PostMedia[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    const loadMyPosts = async () => {
      const supabase =
        createClient()

      try {
        // 1. 현재 로그인 사용자 확인
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          return
        }

        // 2. 내가 작성한 게시물 조회
        const {
          data: postData,
          error: postError,
        } =
          await supabase
            .from('posts')
            .select(
              `
              id,
              display_city,
              display_country,
              display_weather_condition,
              display_temperature,
              content,
              created_at
              `
            )
            .eq(
              'user_id',
              user.id
            )
            .order(
              'created_at',
              {
                ascending: false,
              }
            )

        if (postError) {
          console.error(
            'My posts error:',
            postError
          )

          return
        }

        const myPosts =
          (postData ??
            []) as Post[]

        setPosts(
          myPosts
        )

        // 게시물이 없으면 종료
        if (
          myPosts.length ===
          0
        ) {
          setMedia([])
          return
        }

        // 3. 게시물 미디어 조회
        const postIds =
          myPosts.map(
            (post) =>
              post.id
          )

        const {
          data: mediaData,
          error: mediaError,
        } =
          await supabase
            .from(
              'post_media'
            )
            .select(
              `
              id,
              post_id,
              media_type,
              storage_path,
              sort_order
              `
            )
            .in(
              'post_id',
              postIds
            )
            .order(
              'sort_order',
              {
                ascending: true,
              }
            )

        if (
          mediaError
        ) {
          console.error(
            'My posts media error:',
            mediaError
          )

          return
        }

        setMedia(
          (mediaData ??
            []) as PostMedia[]
        )
      } finally {
        setLoading(false)
      }
    }

    loadMyPosts()
  }, [])

  const getWeatherLabel = (
    value: string | null
  ) => {
    const labels = {
      clear: {
        ko: '맑음',
        en: 'Clear',
      },
      partly_cloudy: {
        ko: '흐림',
        en: 'Cloudy',
      },
      cloudy: {
        ko: '흐림',
        en: 'Cloudy',
      },
      rain: {
        ko: '비',
        en: 'Rain',
      },
      drizzle: {
        ko: '이슬비',
        en: 'Drizzle',
      },
      snow: {
        ko: '눈',
        en: 'Snow',
      },
      thunderstorm: {
        ko: '뇌우',
        en: 'Thunderstorm',
      },
      fog: {
        ko: '안개',
        en: 'Fog',
      },
      etc: {
        ko: '기타',
        en: 'Other',
      },
    } as const

    if (
      !value ||
      !(value in labels)
    ) {
      return value ?? ''
    }

    const key =
      value as keyof typeof labels

    return locale === 'ko'
      ? labels[key].ko
      : labels[key].en
  }

  if (loading) {
    return (
      <section className="mt-10">
        <p>
          {locale === 'ko'
            ? '내 게시물을 불러오는 중...'
            : 'Loading your posts...'}
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-xl">
      {/* 제목 + 게시물 수 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {locale === 'ko'
            ? '내 게시물'
            : 'My posts'}
        </h2>

        <span className="text-sm">
          {locale === 'ko'
            ? `${posts.length}개`
            : `${posts.length} posts`}
        </span>
      </div>

      {/* 게시물이 없는 경우 */}
      {posts.length ===
        0 && (
        <div className="mt-6 rounded-lg border p-6 text-center">
          <p>
            {locale === 'ko'
              ? '아직 작성한 게시물이 없습니다.'
              : 'You have not created any posts yet.'}
          </p>

          <Link
            href="/post/new"
            className="mt-4 inline-block text-sm font-semibold"
          >
            {locale === 'ko'
              ? '첫 게시물 작성하기'
              : 'Create your first post'}
          </Link>
        </div>
      )}

      {/* 내 게시물 목록 */}
      {posts.length >
        0 && (
        <div className="mt-6 space-y-6">
          {posts.map(
            (post) => {
              const postMedia =
                media.filter(
                  (item) =>
                    item.post_id ===
                    post.id
                )

              const firstMedia =
                postMedia[0]

              let mediaUrl:
                | string
                | null = null

              if (
                firstMedia
              ) {
                const supabase =
                  createClient()

                const {
                  data,
                } =
                  supabase.storage
                    .from(
                      'post-media'
                    )
                    .getPublicUrl(
                      firstMedia.storage_path
                    )

                mediaUrl =
                  data.publicUrl
              }

              return (
                <article
                  key={
                    post.id
                  }
                  className="overflow-hidden rounded-xl border"
                >
                  {/* 대표 사진 / 영상 */}
                  {firstMedia &&
                    mediaUrl && (
                      <div className="bg-black">
                        {firstMedia.media_type ===
                        'image' ? (
                          <img
                            src={
                              mediaUrl
                            }
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <video
                            src={
                              mediaUrl
                            }
                            controls
                            className="w-full"
                          />
                        )}
                      </div>
                    )}

                  <div className="p-4">
                    {/* 위치 */}
                    <p className="text-sm font-semibold">
                      📍{' '}
                      {
                        post.display_city
                      }
                      {post.display_country
                        ? `, ${post.display_country}`
                        : ''}
                    </p>

                    {/* 날씨 */}
                    <p className="mt-2 text-sm">
                      {getWeatherLabel(
                        post.display_weather_condition
                      )}

                      {post.display_temperature !==
                        null &&
                        ` · ${post.display_temperature}℃`}
                    </p>

                    {/* 내용 */}
                    {post.content && (
                      <p className="mt-3 line-clamp-3 whitespace-pre-wrap">
                        {
                          post.content
                        }
                      </p>
                    )}

                    {/* 수정 */}
                    <div className="mt-4">
                      <Link
                        href={`/post/${post.id}/edit`}
                        className="text-sm font-semibold"
                      >
                        {locale ===
                        'ko'
                          ? '수정'
                          : 'Edit'}
                      </Link>
                    </div>

                    {/* 작성일 */}
                    <p className="mt-3 text-xs">
                      {new Date(
                        post.created_at
                      ).toLocaleDateString(
                        locale ===
                          'ko'
                          ? 'ko-KR'
                          : 'en-US'
                      )}
                    </p>
                  </div>
                </article>
              )
            }
          )}
        </div>
      )}
    </section>
  )
}
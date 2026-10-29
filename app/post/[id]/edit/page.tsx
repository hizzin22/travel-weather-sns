'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  useParams,
  useRouter,
} from 'next/navigation'
import {
  useLocale,
  useTranslations,
} from 'next-intl'

import { createClient } from '@/lib/supabase/client'

type WeatherFeeling =
  | 'very_cold'
  | 'cold'
  | 'comfortable'
  | 'hot'
  | 'very_hot'

type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'fog'
  | 'etc'

type OutfitTag = {
  id: string
  category: string
  name_ko: string
  name_en: string
}

type ExistingMedia = {
  id: string
  media_type: 'image' | 'video'
  storage_path: string
  thumbnail_path: string | null
  sort_order: number
  public_url: string
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()

  const locale = useLocale()
  const t = useTranslations('post')

  const postId =
    typeof params.id === 'string'
      ? params.id
      : ''

  // =========================
  // 게시물 기본 정보
  // =========================

  const [
    displayCity,
    setDisplayCity,
  ] = useState('')

  const [
    displayCountry,
    setDisplayCountry,
  ] = useState('')

  const [
    displayTemperature,
    setDisplayTemperature,
  ] = useState('')

  const [
    displayWeatherCondition,
    setDisplayWeatherCondition,
  ] =
    useState<WeatherCondition>(
      'etc'
    )

  const [content, setContent] =
    useState('')

  const [
    weatherFeeling,
    setWeatherFeeling,
  ] =
    useState<WeatherFeeling | null>(
      null
    )

  // =========================
  // 옷차림 태그
  // =========================

  const [
    outfitTags,
    setOutfitTags,
  ] =
    useState<OutfitTag[]>([])

  const [
    selectedOutfitTags,
    setSelectedOutfitTags,
  ] = useState<string[]>([])

  // =========================
  // 기존 미디어
  // =========================

  const [
    existingMedia,
    setExistingMedia,
  ] =
    useState<ExistingMedia[]>([])

  const [
    removedMedia,
    setRemovedMedia,
  ] =
    useState<ExistingMedia[]>([])

  // =========================
  // 새로 추가한 미디어
  // =========================

  const [
    newMediaType,
    setNewMediaType,
  ] =
    useState<
      'image' | 'video' | null
    >(null)

  const [
    newMediaFiles,
    setNewMediaFiles,
  ] =
    useState<File[]>([])

  const [
    newMediaPreviews,
    setNewMediaPreviews,
  ] =
    useState<string[]>([])

  const [
    mediaMessage,
    setMediaMessage,
  ] = useState('')

  const previewUrlsRef =
    useRef<string[]>([])

  // =========================
  // 화면 상태
  // =========================

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  // =========================
  // preview URL 정리
  // =========================

  useEffect(() => {
    previewUrlsRef.current =
      newMediaPreviews
  }, [newMediaPreviews])

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url)
        }
      )
    }
  }, [])

  // =========================
  // 기존 게시물 불러오기
  // =========================

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        return
      }

      const supabase =
        createClient()

      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser()

        if (
          userError ||
          !user
        ) {
          router.replace('/login')
          return
        }

        // =========================
        // 1. 게시물 조회
        // =========================

        const {
          data: post,
          error: postError,
        } =
          await supabase
            .from('posts')
            .select(
              `
              id,
              user_id,
              display_city,
              display_country,
              display_temperature,
              display_weather_condition,
              content,
              weather_feeling
              `
            )
            .eq(
              'id',
              postId
            )
            .single()

        if (
          postError ||
          !post
        ) {
          console.error(
            'Edit post load error:',
            postError
          )

          setMessage(
            locale === 'ko'
              ? '게시물을 찾을 수 없습니다.'
              : 'Post not found.'
          )

          return
        }

        // 본인 게시물인지 확인
        if (
          post.user_id !==
          user.id
        ) {
          setMessage(
            locale === 'ko'
              ? '수정할 수 없는 게시물입니다.'
              : 'You cannot edit this post.'
          )

          return
        }

        setDisplayCity(
          post.display_city ?? ''
        )

        setDisplayCountry(
          post.display_country ?? ''
        )

        setDisplayTemperature(
          post.display_temperature !==
            null &&
            post.display_temperature !==
              undefined
            ? String(
                post.display_temperature
              )
            : ''
        )

        setDisplayWeatherCondition(
          (
            post.display_weather_condition ??
            'etc'
          ) as WeatherCondition
        )

        setContent(
          post.content ?? ''
        )

        setWeatherFeeling(
          post.weather_feeling as WeatherFeeling
        )

        // =========================
        // 2. 전체 옷차림 태그 조회
        // =========================

        const {
          data: tags,
          error: tagsError,
        } =
          await supabase
            .from(
              'outfit_tags'
            )
            .select(
              'id, category, name_ko, name_en'
            )

        if (tagsError) {
          console.error(
            'Edit outfit tags load error:',
            tagsError
          )
        }

        setOutfitTags(
          (tags ?? []) as OutfitTag[]
        )

        // =========================
        // 3. 기존 선택 태그 조회
        // =========================

        const {
          data:
            selectedTags,
          error:
            selectedTagsError,
        } =
          await supabase
            .from(
              'post_outfit_tags'
            )
            .select(
              'outfit_tag_id'
            )
            .eq(
              'post_id',
              postId
            )

        if (
          selectedTagsError
        ) {
          console.error(
            'Edit selected tags load error:',
            selectedTagsError
          )
        }

        setSelectedOutfitTags(
          (
            selectedTags ??
            []
          ).map(
            (item) =>
              item.outfit_tag_id
          )
        )

        // =========================
        // 4. 기존 미디어 조회
        // =========================

        const {
          data: mediaRows,
          error: mediaError,
        } =
          await supabase
            .from('post_media')
            .select(
              `
              id,
              media_type,
              storage_path,
              thumbnail_path,
              sort_order
              `
            )
            .eq(
              'post_id',
              postId
            )
            .order(
              'sort_order',
              {
                ascending: true,
              }
            )

        if (mediaError) {
          console.error(
            'Edit media load error:',
            mediaError
          )
        } else {
          const mediaWithUrls =
            (
              mediaRows ?? []
            ).map(
              (item) => {
                const {
                  data:
                    publicUrlData,
                } =
                  supabase.storage
                    .from(
                      'post-media'
                    )
                    .getPublicUrl(
                      item.storage_path
                    )

                return {
                  id: item.id,
                  media_type:
                    item.media_type,
                  storage_path:
                    item.storage_path,
                  thumbnail_path:
                    item.thumbnail_path,
                  sort_order:
                    item.sort_order,
                  public_url:
                    publicUrlData.publicUrl,
                }
              }
            ) as ExistingMedia[]

          setExistingMedia(
            mediaWithUrls
          )
        }
      } catch (error) {
        console.error(
          'Edit page load error:',
          error
        )

        setMessage(
          locale === 'ko'
            ? '게시물을 불러오지 못했습니다.'
            : 'Failed to load the post.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [
    postId,
    router,
    locale,
  ])

  // =========================
  // 옷차림 태그 선택
  // =========================

  const handleOutfitTagToggle = (
    tagId: string
  ) => {
    setSelectedOutfitTags(
      (current) => {
        if (
          current.includes(
            tagId
          )
        ) {
          return current.filter(
            (id) =>
              id !== tagId
          )
        }

        return [
          ...current,
          tagId,
        ]
      }
    )
  }

  // =========================
  // 기존 미디어 삭제 예약
  // 실제 삭제는 저장할 때 진행
  // =========================

  const handleRemoveExistingMedia = (
    media: ExistingMedia
  ) => {
    setExistingMedia(
      (current) =>
        current.filter(
          (item) =>
            item.id !== media.id
        )
    )

    setRemovedMedia(
      (current) => [
        ...current,
        media,
      ]
    )

    setMediaMessage('')
  }

  // =========================
  // 새 이미지 선택
  // =========================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ?? []
      )

    setMediaMessage('')

    if (files.length === 0) {
      return
    }

    const allImages =
      files.every(
        (file) =>
          file.type.startsWith(
            'image/'
          )
      )

    if (!allImages) {
      setMediaMessage(
        locale === 'ko'
          ? '이미지 파일만 선택해주세요.'
          : 'Please select image files only.'
      )

      event.target.value = ''
      return
    }

    const remainingVideo =
      existingMedia.some(
        (item) =>
          item.media_type ===
          'video'
      )

    if (
      remainingVideo ||
      newMediaType === 'video'
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '사진과 동영상은 함께 등록할 수 없습니다.'
          : 'Photos and videos cannot be used together.'
      )

      event.target.value = ''
      return
    }

    const existingImageCount =
      existingMedia.filter(
        (item) =>
          item.media_type ===
          'image'
      ).length

    const totalCount =
      existingImageCount +
      newMediaFiles.length +
      files.length

    if (totalCount > 5) {
      setMediaMessage(
        locale === 'ko'
          ? `사진은 최대 5장까지 등록할 수 있습니다. 현재 ${existingImageCount + newMediaFiles.length}장이 있습니다.`
          : `You can have up to 5 photos. ${existingImageCount + newMediaFiles.length} are currently selected.`
      )

      event.target.value = ''
      return
    }

    const previewUrls =
      files.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      )

    setNewMediaType(
      'image'
    )

    setNewMediaFiles(
      (current) => [
        ...current,
        ...files,
      ]
    )

    setNewMediaPreviews(
      (current) => [
        ...current,
        ...previewUrls,
      ]
    )

    event.target.value = ''
  }

  // =========================
  // 새 동영상 선택
  // =========================

  const handleVideoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]

    setMediaMessage('')

    if (!file) {
      return
    }

    if (
      !file.type.startsWith(
        'video/'
      )
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '동영상 파일을 선택해주세요.'
          : 'Please select a video file.'
      )

      event.target.value = ''
      return
    }

    const remainingImages =
      existingMedia.some(
        (item) =>
          item.media_type ===
          'image'
      )

    if (
      remainingImages ||
      newMediaType === 'image'
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '사진과 동영상은 함께 등록할 수 없습니다.'
          : 'Photos and videos cannot be used together.'
      )

      event.target.value = ''
      return
    }

    const remainingVideo =
      existingMedia.some(
        (item) =>
          item.media_type ===
          'video'
      )

    if (
      remainingVideo ||
      newMediaFiles.length > 0
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '동영상은 1개만 등록할 수 있습니다.'
          : 'Only one video can be added.'
      )

      event.target.value = ''
      return
    }

    const previewUrl =
      URL.createObjectURL(
        file
      )

    setNewMediaType(
      'video'
    )

    setNewMediaFiles([
      file,
    ])

    setNewMediaPreviews([
      previewUrl,
    ])

    event.target.value = ''
  }

  // =========================
  // 새 이미지 개별 삭제
  // =========================

  const handleRemoveNewMedia = (
    indexToRemove: number
  ) => {
    setNewMediaFiles(
      (current) => {
        const next =
          current.filter(
            (_, index) =>
              index !==
              indexToRemove
          )

        if (
          next.length === 0
        ) {
          setNewMediaType(
            null
          )
        }

        return next
      }
    )

    setNewMediaPreviews(
      (current) => {
        const removedUrl =
          current[
            indexToRemove
          ]

        if (removedUrl) {
          URL.revokeObjectURL(
            removedUrl
          )
        }

        return current.filter(
          (_, index) =>
            index !==
            indexToRemove
        )
      }
    )

    setMediaMessage('')
  }

  // =========================
  // 저장
  // =========================

  const handleSave = async () => {
    setMessage('')
    setMediaMessage('')

    if (
      !displayCity.trim()
    ) {
      setMessage(
        locale === 'ko'
          ? '도시를 입력해주세요.'
          : 'Please enter a city.'
      )

      return
    }

    if (
      !displayCountry.trim()
    ) {
      setMessage(
        locale === 'ko'
          ? '국가를 입력해주세요.'
          : 'Please enter a country.'
      )

      return
    }

    const temperatureNumber =
	  displayTemperature.trim() === ''
	    ? null
	    : Number(displayTemperature)
	
	if (
	  displayTemperature.trim() !== '' &&
	  Number.isNaN(
	    temperatureNumber
	  )
	) {
	  setMessage(
	    locale === 'ko'
	      ? '기온은 숫자로 입력해주세요.'
	      : 'Please enter a valid temperature.'
	  )

	  return
	}

    if (!content.trim()) {
      setMessage(
        locale === 'ko'
          ? '게시물 내용을 입력해주세요.'
          : 'Please enter some content.'
      )

      return
    }

   
    // 미디어 최종 상태 검사

    const finalImages =
      existingMedia.filter(
        (item) =>
          item.media_type ===
          'image'
      ).length +
      (
        newMediaType ===
        'image'
          ? newMediaFiles.length
          : 0
      )

    const finalVideos =
      existingMedia.filter(
        (item) =>
          item.media_type ===
          'video'
      ).length +
      (
        newMediaType ===
        'video'
          ? newMediaFiles.length
          : 0
      )

    if (
      finalImages > 0 &&
      finalVideos > 0
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '사진과 동영상은 함께 등록할 수 없습니다.'
          : 'Photos and videos cannot be used together.'
      )

      return
    }

    if (
      finalImages > 5
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '사진은 최대 5장까지 등록할 수 있습니다.'
          : 'You can have up to 5 photos.'
      )

      return
    }

    if (
      finalVideos > 1
    ) {
      setMediaMessage(
        locale === 'ko'
          ? '동영상은 1개만 등록할 수 있습니다.'
          : 'Only one video can be added.'
      )

      return
    }

    setSaving(true)

    const supabase =
      createClient()

    try {
      // =========================
      // 1. 사용자 확인
      // =========================

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
	  userError ||
	  !user
	) {
	  router.push('/login')
	  return
	}

      // =========================
      // 2. posts 수정
      // =========================

      const {
        error:
          postUpdateError,
      } =
        await supabase
          .from('posts')
          .update({
            display_city:
              displayCity.trim(),

            display_country:
              displayCountry.trim(),

	    location_overridden:
	      true,

            display_temperature:
              temperatureNumber,

            display_weather_condition:
              displayWeatherCondition,

            content:
              content.trim(),

            weather_feeling:
		weatherFeeling || null,
          })
          .eq(
            'id',
            postId
          )
          .eq(
            'user_id',
            user.id
          )

      if (
        postUpdateError
      ) {
        console.error(
          'Post update error detail:',
          JSON.stringify(
            postUpdateError,
            null,
            2
          )
        )

        throw new Error(
          postUpdateError.message
        )
      }

      // =========================
      // 3. 기존 태그 삭제
      // =========================

      const {
        error:
          tagDeleteError,
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
        tagDeleteError
      ) {
        console.error(
          'Edit tag delete error:',
          tagDeleteError
        )

        throw new Error(
          '기존 태그 삭제 실패'
        )
      }

      // =========================
      // 4. 새 태그 저장
      // =========================

      if (
        selectedOutfitTags.length >
        0
      ) {
        const rows =
          selectedOutfitTags.map(
            (
              outfitTagId
            ) => ({
              post_id:
                postId,

              outfit_tag_id:
                outfitTagId,
            })
          )

        const {
          error:
            tagInsertError,
        } =
          await supabase
            .from(
              'post_outfit_tags'
            )
            .insert(rows)

        if (
          tagInsertError
        ) {
          console.error(
            'Edit tag insert error:',
            tagInsertError
          )

          throw new Error(
            '새 태그 저장 실패'
          )
        }
      }

      // =========================
      // 5. 삭제 예약된 Storage 파일 삭제
      // =========================

      if (
        removedMedia.length >
        0
      ) {
        const pathsToDelete =
          removedMedia
            .flatMap(
              (item) => [
                item.storage_path,
                item.thumbnail_path,
              ]
            )
            .filter(
              (
                path
              ): path is string =>
                Boolean(path)
            )

        if (
          pathsToDelete.length >
          0
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
                pathsToDelete
              )

          if (
            storageDeleteError
          ) {
            console.error(
              'Edit storage delete error:',
              storageDeleteError
            )

            throw new Error(
              '기존 미디어 파일 삭제 실패'
            )
          }
        }

        // =========================
        // 6. post_media 행 삭제
        // =========================

        const mediaIds =
          removedMedia.map(
            (item) =>
              item.id
          )

        const {
          error:
            mediaDeleteError,
        } =
          await supabase
            .from(
              'post_media'
            )
            .delete()
            .in(
              'id',
              mediaIds
            )

        if (
          mediaDeleteError
        ) {
          console.error(
            'Edit media row delete error:',
            mediaDeleteError
          )

          throw new Error(
            '기존 미디어 정보 삭제 실패'
          )
        }
      }

      // =========================
      // 7. 새 미디어 Storage 업로드
      // =========================

      if (
        newMediaType &&
        newMediaFiles.length >
          0
      ) {
        const existingSortOrders =
          existingMedia.map(
            (item) =>
              item.sort_order
          )

        const maxSortOrder =
          existingSortOrders.length >
          0
            ? Math.max(
                ...existingSortOrders
              )
            : 0

        const newMediaRows = []

        for (
          let index = 0;
          index <
          newMediaFiles.length;
          index++
        ) {
          const file =
            newMediaFiles[
              index
            ]

          const extension =
            file.name
              .split('.')
              .pop()
              ?.toLowerCase() ??
            (
              newMediaType ===
              'image'
                ? 'jpg'
                : 'mp4'
            )

          const storagePath =
            `${user.id}/${postId}/edit-${Date.now()}-${index}.${extension}`

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                'post-media'
              )
              .upload(
                storagePath,
                file,
                {
                  contentType:
                    file.type,
                  upsert:
                    false,
                }
              )

          if (
            uploadError
          ) {
            console.error(
              'Edit media upload error:',
              uploadError
            )

            throw new Error(
              '새 미디어 업로드 실패'
            )
          }

          newMediaRows.push({
            post_id:
              postId,

            media_type:
              newMediaType,

            storage_path:
              storagePath,

            thumbnail_path:
              null,

            sort_order:
              maxSortOrder +
              index +
              1,
          })
        }

        // =========================
        // 8. post_media 등록
        // =========================

        const {
          error:
            mediaInsertError,
        } =
          await supabase
            .from(
              'post_media'
            )
            .insert(
              newMediaRows
            )

        if (
          mediaInsertError
        ) {
          console.error(
            'Edit media insert error:',
            mediaInsertError
          )

          throw new Error(
            '새 미디어 정보 저장 실패'
          )
        }
      }

      // =========================
      // 9. 완료
      // =========================

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error(
        'Edit post save error:',
        error
      )

      setMessage(
        locale === 'ko'
          ? '게시물을 수정하지 못했습니다.'
          : 'Failed to update the post.'
      )
    } finally {
      setSaving(false)
    }
  }

  const weatherFeelingOptions: WeatherFeeling[] =
    [
      'very_cold',
      'cold',
      'comfortable',
      'hot',
      'very_hot',
    ]

  const weatherConditionOptions: WeatherCondition[] =
    [
      'clear',
      'partly_cloudy',
      'cloudy',
      'rain',
      'snow',
      'thunderstorm',
      'fog',
      'etc',
    ]

  // =========================
  // 로딩
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <p>
          {locale === 'ko'
            ? '게시물을 불러오는 중...'
            : 'Loading post...'}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">
        {locale === 'ko'
          ? '게시물 수정'
          : 'Edit post'}
      </h1>

      {message && (
        <p className="mt-4 rounded-lg border p-3">
          {message}
        </p>
      )}

      {/* =========================
          기존 / 새 미디어
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
          {locale === 'ko'
            ? '사진 / 동영상'
            : 'Photos / Video'}
        </h2>

        {/* 기존 미디어 */}

        {existingMedia.length >
          0 && (
          <div className="mt-6 space-y-6">
            {existingMedia.map(
              (media) => (
                <div
                  key={
                    media.id
                  }
                  className="relative overflow-hidden rounded-lg border"
                >
                  {media.media_type ===
                  'image' ? (
                    <img
                      src={
                        media.public_url
                      }
                      alt=""
                      className="aspect-square w-full object-cover"
                      draggable={
                        false
                      }
                    />
                  ) : (
                    <video
                      src={
                        media.public_url
                      }
                      controls
                      className="w-full"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveExistingMedia(
                        media
                      )
                    }
                    className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-white"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* 새 미디어 미리보기 */}

        {newMediaPreviews.length >
          0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {newMediaPreviews.map(
              (
                preview,
                index
              ) => (
                <div
                  key={
                    preview
                  }
                  className="relative overflow-hidden rounded-lg border"
                >
                  {newMediaType ===
                  'image' ? (
                    <img
                      src={
                        preview
                      }
                      alt=""
                      className="aspect-square w-full object-cover"
                      draggable={
                        false
                      }
                    />
                  ) : (
                    <video
                      src={
                        preview
                      }
                      controls
                      className="w-full"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveNewMedia(
                        index
                      )
                    }
                    className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-white"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* 추가 버튼 */}

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-lg border px-4 py-2">
            {locale === 'ko'
              ? '사진 추가'
              : 'Add photos'}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleImageChange
              }
              className="hidden"
            />
          </label>

          <label className="cursor-pointer rounded-lg border px-4 py-2">
            {locale === 'ko'
              ? '동영상 추가'
              : 'Add video'}

            <input
              type="file"
              accept="video/*"
              onChange={
                handleVideoChange
              }
              className="hidden"
            />
          </label>
        </div>

        {mediaMessage && (
          <p className="mt-3 text-sm">
            {mediaMessage}
          </p>
        )}

        <p className="mt-3 text-sm">
          {locale === 'ko'
            ? '사진은 최대 5장 또는 동영상 1개만 등록할 수 있습니다.'
            : 'You can use up to 5 photos or 1 video.'}
        </p>
      </section>

      {/* =========================
          표시 위치
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
          {locale === 'ko'
            ? '표시 위치'
            : 'Display location'}
        </h2>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm">
              {locale === 'ko'
                ? '도시'
                : 'City'}
            </label>

            <input
              type="text"
              value={
                displayCity
              }
              onChange={(
                event
              ) =>
                setDisplayCity(
                  event.target
                    .value
                )
              }
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="text-sm">
              {locale === 'ko'
                ? '국가'
                : 'Country'}
            </label>

            <input
              type="text"
              value={
                displayCountry
              }
              onChange={(
                event
              ) =>
                setDisplayCountry(
                  event.target
                    .value
                )
              }
              className="mt-1 w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      {/* =========================
          표시 날씨
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
          {locale === 'ko'
            ? '표시 날씨'
            : 'Display weather'}
        </h2>

        <div className="mt-3">
          <label className="text-sm">
            {locale === 'ko'
              ? '기온'
              : 'Temperature'}
          </label>

          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={
                displayTemperature
              }
              onChange={(
                event
              ) =>
                setDisplayTemperature(
                  event.target
                    .value
                )
              }
              className="w-full rounded-lg border p-3"
            />

            <span>℃</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm">
            {locale === 'ko'
              ? '날씨 상태'
              : 'Weather condition'}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {weatherConditionOptions.map(
              (
                condition
              ) => (
                <button
                  key={
                    condition
                  }
                  type="button"
                  onClick={() =>
                    setDisplayWeatherCondition(
                      condition
                    )
                  }
                  className={`rounded-full border px-4 py-2 ${
                    displayWeatherCondition ===
                    condition
                      ? 'font-bold ring-2'
                      : ''
                  }`}
                >
                 {t(
		  `weather.${
		    condition === 'partly_cloudy'
		      ? 'cloudy'
		      : condition
		  }`
		)}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          내용
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
          {t('content')}
        </h2>

        <textarea
          value={content}
          onChange={(
            event
          ) =>
            setContent(
              event.target
                .value
            )
          }
          maxLength={1000}
          rows={5}
          className="mt-3 w-full rounded-lg border p-4"
        />

        <p className="mt-2 text-sm">
          {content.length} / 1000
        </p>
      </section>

      {/* =========================
          체감 날씨
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
	  {t('weatherFeeling')}
	  <span className="ml-1 text-sm font-normal text-gray-400">
	    {locale === 'ko'
	      ? '(선택)'
	      : '(Optional)'}
	  </span>
	</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {weatherFeelingOptions.map(
            (option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setWeatherFeeling(
                    option
                  )
                }
                className={`rounded-full border px-4 py-2 ${
                  weatherFeeling ===
                  option
                    ? 'font-bold ring-2'
                    : ''
                }`}
              >
                {t(
                  `weatherFeelingOptions.${option}`
                )}
              </button>
            )
          )}
        </div>
      </section>

      {/* =========================
          옷차림 태그
         ========================= */}

      <section className="mt-8">
        <h2 className="font-semibold">
	  {t('outfit')}
	  <span className="ml-1 text-sm font-normal text-gray-400">
	    {locale === 'ko'
	      ? '(선택)'
	      : '(Optional)'}
	  </span>
	</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {outfitTags.map(
            (tag) => {
              const selected =
                selectedOutfitTags.includes(
                  tag.id
                )

              return (
                <button
                  key={
                    tag.id
                  }
                  type="button"
                  onClick={() =>
                    handleOutfitTagToggle(
                      tag.id
                    )
                  }
                  className={`rounded-full border px-4 py-2 ${
                    selected
                      ? 'font-bold ring-2'
                      : ''
                  }`}
                >
                  {locale ===
                  'ko'
                    ? tag.name_ko
                    : tag.name_en}
                </button>
              )
            }
          )}
        </div>
      </section>

      {/* =========================
          저장 / 취소
         ========================= */}

      <section className="mt-10 flex gap-3">
        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            saving
          }
          className="rounded-lg border px-6 py-3 text-gray-600 disabled:opacity-50"
	>
          {locale === 'ko'
            ? '취소'
            : 'Cancel'}
        </button>

	<button
          type="button"
          onClick={() =>
            router.push('/')
          }
          disabled={
            saving
          }
          className="rounded-lg border px-6 py-3 font-semibold disabled:opacity-50"
        
        >
          {saving
            ? locale === 'ko'
              ? '저장 중...'
              : 'Saving...'
            : locale === 'ko'
              ? '저장'
              : 'Save'}
        </button>
        
      </section>
    </main>
  )
}
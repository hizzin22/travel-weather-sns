'use client'

import { useEffect, useState } from 'react'
import {
  useLocale,
  useTranslations,
} from 'next-intl'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import { createClient } from '@/lib/supabase/client'

import { useRouter } from 'next/navigation'

import {
  getCurrentLocation,
  type CurrentLocation,
} from '@/lib/location/getCurrentLocation'

// =========================
// 타입 정의
// =========================

type LocationInfo = {
  city: {
    ko: string
    en: string
  }
  countryCode: string
  state: string
}

type WeatherInfo = {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  precipitation: number
  weatherCondition: string
  observedAt: string
}

type WeatherFeeling =
  | 'very_cold'
  | 'cold'
  | 'comfortable'
  | 'hot'
  | 'very_hot'

type OutfitTag = {
  id: string
  category: string
  name_ko: string
  name_en: string
}

type MediaType =
  | 'image'
  | 'video'

// 국가 코드 → 현재 언어 국가명
function getCountryName(
  countryCode: string,
  locale: string
) {
  const regionNames =
    new Intl.DisplayNames(
      [locale],
      {
        type: 'region',
      }
    )

  return (
    regionNames.of(countryCode) ??
    countryCode
  )
}

// 파일명에서 확장자 가져오기
function getFileExtension(
  file: File
) {
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()

  if (extension) {
    return extension
  }

  if (
    file.type ===
    'image/jpeg'
  ) {
    return 'jpg'
  }

  if (
    file.type ===
    'image/png'
  ) {
    return 'png'
  }

  if (
    file.type ===
    'image/webp'
  ) {
    return 'webp'
  }

  if (
    file.type ===
    'video/mp4'
  ) {
    return 'mp4'
  }

  return 'file'
}

export default function NewPostPage() {
  const router = useRouter()
  const t =
    useTranslations('post')

  const locale =
    useLocale()

  // =========================
  // 위치 / 날씨
  // =========================

  const [
    location,
    setLocation,
  ] =
    useState<CurrentLocation | null>(
      null
    )

  const [
    locationMessage,
    setLocationMessage,
  ] = useState('')

  const [
    locationInfo,
    setLocationInfo,
  ] =
    useState<LocationInfo | null>(
      null
    )

  const [
    weatherInfo,
    setWeatherInfo,
  ] =
    useState<WeatherInfo | null>(
      null
    )

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

   const [displayCity, setDisplayCity] =
     useState('')

   const [displayCountry, setDisplayCountry] =
     useState('')

   const [
     locationOverridden,
     setLocationOverridden,
   ] = useState(false)

  // =========================
  // 게시물 입력
  // =========================

  const [
    content,
    setContent,
  ] = useState('')

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
  ] =
    useState<string[]>([])

  const [
    outfitTagsLoading,
    setOutfitTagsLoading,
  ] = useState(true)

  // =========================
  // 미디어
  // =========================

  const [
    mediaFiles,
    setMediaFiles,
  ] =
    useState<File[]>([])

  const [
    mediaType,
    setMediaType,
  ] =
    useState<MediaType | null>(
      null
    )

  const [
    mediaPreviews,
    setMediaPreviews,
  ] =
    useState<string[]>([])

  const [
    mediaMessage,
    setMediaMessage,
  ] = useState('')

  // =========================
  // 게시물 저장
  // =========================

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saveMessage,
    setSaveMessage,
  ] = useState('')

  // =========================
  // 옷차림 태그 조회
  // =========================

  useEffect(() => {
    const loadOutfitTags =
      async () => {
        const supabase =
          createClient()

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'outfit_tags'
            )
            .select(
              'id, category, name_ko, name_en'
            )

        if (error) {
          console.error(
            'Outfit tags load error:',
            error
          )

          setOutfitTagsLoading(
            false
          )

          return
        }

        setOutfitTags(
          data ?? []
        )

        setOutfitTagsLoading(
          false
        )
      }

    loadOutfitTags()
  }, [])

  // =========================
  // preview URL 정리
  // =========================



  // =========================
  // 태그 선택
  // =========================

  const handleOutfitTagToggle =
    (
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
  // 사진 선택
  // =========================

  const handleImageChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const newFiles = Array.from(
    event.target.files ?? []
  )

  setMediaMessage('')

  if (newFiles.length === 0) {
    return
  }

  // 이미지 파일인지 확인
  const allImages = newFiles.every(
    (file) =>
      file.type.startsWith('image/')
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

  // 기존 사진 + 새로 선택한 사진
  const combinedFiles = [
    ...mediaFiles,
    ...newFiles,
  ]

  // 최대 5장 제한
  if (combinedFiles.length > 5) {
    setMediaMessage(
      locale === 'ko'
        ? `사진은 최대 5장까지 선택할 수 있습니다. 현재 ${mediaFiles.length}장이 선택되어 있습니다.`
        : `You can select up to 5 images. ${mediaFiles.length} are already selected.`
    )

    event.target.value = ''
    return
  }

  // 새로 추가한 사진만 preview 생성
  const newPreviews = newFiles.map(
    (file) =>
      URL.createObjectURL(file)
  )

  setMediaType('image')

  setMediaFiles((current) => [
    ...current,
    ...newFiles,
  ])

  setMediaPreviews((current) => [
    ...current,
    ...newPreviews,
  ])

  // 같은 파일을 다시 선택할 수 있도록 초기화
  event.target.value = ''
}
   // 개별 사진 삭제
const handleRemoveImage = (
  indexToRemove: number
) => {
  setMediaFiles((current) => {
    const next = current.filter(
      (_, index) =>
        index !== indexToRemove
    )

    if (next.length === 0) {
      setMediaType(null)
    }

    return next
  })

  setMediaPreviews((current) => {
    const removedUrl =
      current[indexToRemove]

    if (removedUrl) {
      URL.revokeObjectURL(
        removedUrl
      )
    }

    return current.filter(
      (_, index) =>
        index !== indexToRemove
    )
  })
}
  // =========================
  // 동영상 선택
  // =========================

  const handleVideoChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
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
          ? '동영상 파일만 선택해주세요.'
          : 'Please select a video file.'
      )

      event.target.value =
        ''

      return
    }

    mediaPreviews.forEach(
      (url) =>
        URL.revokeObjectURL(
          url
        )
    )

    const preview =
      URL.createObjectURL(
        file
      )

    setMediaType('video')
    setMediaFiles([file])
    setMediaPreviews([
      preview,
    ])
  }

  // =========================
  // 미디어 선택 초기화
  // =========================

  const clearMedia = () => {
    mediaPreviews.forEach(
      (url) =>
        URL.revokeObjectURL(
          url
        )
    )

    setMediaFiles([])
    setMediaType(null)
    setMediaPreviews([])
    setMediaMessage('')
  }

  // =========================
  // 현재 위치 + 날씨
  // =========================

      const handleGetLocation = async () => {
	  setLocationMessage('')
	  setLoading(true)

	  try {
	    if ('permissions' in navigator) {
	      const permission =
	        await navigator.permissions.query({
	          name: 'geolocation',
	        })

	      if (permission.state === 'denied') {
	        setLocationMessage(
	          locale === 'ko'
	            ? '위치 권한이 차단되어 있어요. 브라우저 위치 권한을 허용하거나 직접 입력할 수 있어요.'
	            : 'Location access is blocked. You can allow location access in your browser or enter the location manually.'
	        )

	        return
	      }
	    }

	    const currentLocation =
	      await getCurrentLocation()

	    setLocation(
	      currentLocation
	    )

	    const locationResponse =
	      await fetch(
	        `/api/location/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}`
	      )

	    if (!locationResponse.ok) {
	      throw new Error(
	        '지역 정보 조회 실패'
	      )
	    }

	    const locationResult =
	      await locationResponse.json()

	    setLocationInfo(
	      locationResult
	    )

	    setDisplayCity(
	      locale === 'ko'
	        ? locationResult.city.ko
	        : locationResult.city.en
	    )

	    setDisplayCountry(
	      getCountryName(
	        locationResult.countryCode,
	        locale
	      )
	    )

	    setLocationOverridden(false)

	    const weatherResponse =
	      await fetch(
	        `/api/weather/current?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}`
	      )

	    if (!weatherResponse.ok) {
	      throw new Error(
	        '날씨 정보 조회 실패'
	      )
	    }

	    const weatherResult =
	      await weatherResponse.json()
	
	    setWeatherInfo(
	      weatherResult
	    )

	    setMessage(
	      t('locationSuccess')
	    )
	  } catch (error) {
	    console.error(
	      'Location error:',
	      error instanceof GeolocationPositionError
	        ? {
	            code: error.code,
	            message: error.message,
	          }
	        : error
	    )

	    if (
	      error instanceof GeolocationPositionError
	    ) {
	      if (error.code === 1) {
	        setLocationMessage(
	          locale === 'ko'
	            ? '위치 권한이 차단되어 있어요. 브라우저 위치 권한을 허용하거나 직접 입력할 수 있어요.'
	            : 'Location access is blocked. You can allow location access in your browser or enter the location manually.'
	        )

	        return
	      }

      if (error.code === 2) {
        setLocationMessage(
          locale === 'ko'
            ? '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.'
            : 'Your current location is unavailable. Please try again.'
        )

        return
      }

      if (error.code === 3) {
        setLocationMessage(
          locale === 'ko'
            ? '위치 확인 시간이 초과되었습니다. 다시 시도해주세요.'
            : 'Location request timed out. Please try again.'
        )

        return
      }
    }

    setLocationMessage(
      locale === 'ko'
        ? '현재 위치를 가져오지 못했습니다. 다시 시도해주세요.'
        : 'Failed to get your current location. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}

    // 페이지 진입 시 위치/날씨 자동 조회
	useEffect(() => {
  	handleGetLocation()
     }, [])

  // =========================
  // 게시물 저장
  // =========================

  const handleSubmitPost =
    async () => {
      setSaveMessage('')

      if (
	  !displayCity.trim() ||
	  !displayCountry.trim()
	) {
	  setMessage(
	    locale === 'ko'
	      ? '도시와 국가를 입력해주세요.'
	      : 'Please enter a city and country.'
	  )

	  return
	}

      if (!content.trim()) {
        setSaveMessage(
          locale === 'ko'
            ? '게시물 내용을 입력해주세요.'
            : 'Please enter some content.'
        )

        return
      }

      setSaving(true)

      const supabase =
        createClient()

      try {
        // 1. 로그인 사용자
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

       
	      
        // 2. posts 생성
        const {
          data: post,
          error: postError,
        } =
          await supabase
            .from('posts')
            .insert({
  		user_id:
    			user.id,

 	 // 다국어 위치 데이터
	city_ko:
	  locationInfo?.city?.ko ?? displayCity,

	city_en:
	  locationInfo?.city?.en ?? displayCity,

	country_code:
	  locationInfo?.countryCode ?? null,

	// 화면 표시 위치
	display_city:
	  displayCity.trim(),

	display_country:
	  displayCountry.trim(),

	location_overridden:
	  locationOverridden,

	
              api_weather_condition:
		  weatherInfo?.weatherCondition ?? null,

		api_temperature:
		  weatherInfo?.temperature ?? null,

		api_feels_like_temperature:
		  weatherInfo?.feelsLike ?? null,

		api_humidity:
		  weatherInfo?.humidity ?? null,

		api_wind_speed:
		  weatherInfo?.windSpeed ?? null,

		api_precipitation:
		  weatherInfo?.precipitation ?? null,

		display_weather_condition:
		  weatherInfo?.weatherCondition ?? null,

		display_temperature:
		  weatherInfo?.temperature ?? null,

              weather_feeling: weatherFeeling || null,

              content:
                content.trim(),

              weather_observed_at:
		  weatherInfo
		    ? new Date().toISOString()
		    : null,
            })

            .select('id')
		.single()

	
        if (
          postError ||
          !post
        ) {
          console.error(
            'Post insert error detail:',
            {
              message:
                postError?.message,
              details:
                postError?.details,
              hint:
                postError?.hint,
              code:
                postError?.code,
              post,
            }
          )

          throw new Error(
            '게시물 저장 실패'
          )
        }

        // 3. 실제 감지 위치
	if (
	  locationInfo &&
	  location
	) {
	  const {
	    error:
	      locationError,
	  } =
	    await supabase
	      .from(
	        'post_private_locations'
	      )
	      .insert({
	        post_id:
	          post.id,

	        detected_city:
	          locationInfo.city.en,

	        detected_country:
	          locationInfo.countryCode,

	        detected_latitude:
	          location.latitude,

	        detected_longitude:
	          location.longitude,
	      })

	  if (
	    locationError
	  ) {
	    console.error(
	      'Private location insert error:',
	      locationError
	    )

	    throw new Error(
	      '위치 정보 저장 실패'
	    )
	  }
	}

        // 4. 옷차림 태그
        if (
          selectedOutfitTags.length >
          0
        ) {
          const outfitRows =
            selectedOutfitTags.map(
              (
                outfitTagId
              ) => ({
                post_id:
                  post.id,

                outfit_tag_id:
                  outfitTagId,
              })
            )

          const {
            error:
              outfitError,
          } =
            await supabase
              .from(
                'post_outfit_tags'
              )
              .insert(
                outfitRows
              )

          if (
            outfitError
          ) {
            console.error(
              'Outfit tags insert error:',
              outfitError
            )

            throw new Error(
              '옷차림 태그 저장 실패'
            )
          }
        }

        // =========================
        // 5. 사진 / 동영상 Storage 업로드
        // =========================

        if (
          mediaFiles.length >
            0 &&
          mediaType
        ) {
          const mediaRows: {
            post_id: string
            media_type: MediaType
            storage_path: string
            thumbnail_path: null
            sort_order: number
          }[] = []

          for (
            let index = 0;
            index <
            mediaFiles.length;
            index++
          ) {
            const file =
              mediaFiles[index]

            const extension =
              getFileExtension(
                file
              )

            // 같은 게시물 안에서도 파일명이 겹치지 않게 구성
            const fileName =
              `${index}-${Date.now()}.${extension}`

            const storagePath =
              `${user.id}/${post.id}/${fileName}`

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

		
	 // 새 게시물 파일이므로 덮어쓰기 사용 안 함
                    upsert:
                      false,
                  }
                )

            if (
              uploadError
            ) {
              console.error(
                'Media upload error:',
                {
                  message:
                    uploadError.message,
                  file:
                    file.name,
                  storagePath,
                }
              )

	  setMessage(
	    locale === 'ko'
	      ? '사진 또는 동영상 업로드에 실패했습니다. 파일을 확인한 후 다시 시도해주세요.'
	      : 'Failed to upload the photo or video. Please check the file and try again.'
	  )
	
	  return
	}

                 
          mediaRows.push({
              post_id:
                post.id,

              media_type:
                mediaType,

              storage_path:
                storagePath,

              thumbnail_path:
                null,

              sort_order:
  		index + 1,
            })
          }

          // =========================
          // 6. post_media 저장
          // =========================

          const {
            error:
              mediaDbError,
          } =
            await supabase
              .from(
                'post_media'
              )
              .insert(
                mediaRows
              )

         if (mediaDbError) {
  		console.error(
    			'Post media error code:',
    		mediaDbError.code
  	)

  		console.error(
    			'Post media error message:',
    			mediaDbError.message
 	 )

  		console.error(
    			'Post media error details:',
    			mediaDbError.details
 	 )

  		console.error(
    			'Post media error hint:',
    			mediaDbError.hint
  	)

  		console.error(
    			'Post media rows:',
    			JSON.stringify(mediaRows)
  	)

  		throw new Error(
    			'미디어 정보 저장 실패'
  	)
}
        }

        // =========================
        // 저장 성공
        // =========================

        setSaveMessage(
          locale === 'ko'
            ? '게시물이 저장되었습니다.'
            : 'Post saved successfully.'
        )

        setContent('')
        setWeatherFeeling(
          null
        )
        setSelectedOutfitTags(
          []
        )

	router.push('/')
	router.refresh()

        clearMedia()
      } catch (error) {
        console.error(
          'Post save error:',
          error
        )

        setSaveMessage(
          locale === 'ko'
            ? '게시물을 저장하지 못했습니다.'
            : 'Failed to save the post.'
        )
      } finally {
        setSaving(false)
      }
    }

  // =========================
  // 체감 날씨 옵션
  // =========================

  const weatherFeelingOptions: WeatherFeeling[] =
    [
      'very_cold',
      'cold',
      'comfortable',
      'hot',
      'very_hot',
    ]

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 sm:px-6">
      {/* 언어 선택 */}
      <LanguageSwitcher />

      <h1 className="mt-6 text-2xl font-bold">
        {t('newTitle')}
      </h1>

      {/* =========================
          위치 / 날씨
         ========================= */}
      <section className="mt-8">
        <h2 className="font-semibold">
          {t(
            'currentLocation'
          )}
        </h2>

        <button
          type="button"
          onClick={
            handleGetLocation
          }
          disabled={loading}
          className="mt-3 rounded-lg border px-5 py-3 disabled:opacity-50"
        >
          {loading
            ? t(
                'loadingLocation'
              )
            : t(
                'getLocation'
              )}
        </button>

	{locationMessage && (
	  <p className="mt-2 text-sm text-red-500">
	    {locationMessage}
	  </p>
	)}

        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
	  <div>
	    <label className="mb-1 block text-sm font-medium">
	      {t('city')}
	    </label>

	    <input
		  type="text"
		  value={displayCity}
		  onChange={(event) => {
		    setDisplayCity(
		      event.target.value
		    )

		    setLocationOverridden(
		      true
		    )

		    setWeatherInfo(null)
		  }}
		  placeholder={
		    locale === 'ko'
		      ? '도시를 입력해주세요'
		      : 'Enter city'
		  }
		  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
		/>
	  </div>

	  <div className="mt-4">
	    <label className="mb-1 block text-sm font-medium">
	      {t('country')}
	    </label>

	    <input
	      type="text"
	      value={displayCountry}
	      onChange={(event) => {
	        setDisplayCountry(
	          event.target.value
	        )

	        setLocationOverridden(
	          true
	        )

	        setWeatherInfo(null)
	      }}
	      placeholder={
	        locale === 'ko'
	          ? '국가를 입력해주세요'
	          : 'Enter country'
	      }
	      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
	    />
	  </div>

	  {locationInfo?.state && (
	    <p className="mt-3 text-sm text-gray-500">
	      {t('region')}:{' '}
	      {locationInfo.state}
	    </p>
	  )}
	</div>
	
        {/* 개발 확인용 GPS */}
        {location && (
          <div className="mt-4 space-y-1 text-sm">
            <p>
              위도:{' '}
              {
                location.latitude
              }
            </p>

            <p>
              경도:{' '}
              {
                location.longitude
              }
            </p>

            <p>
              정확도: 약{' '}
              {Math.round(
                location.accuracy
              )}
              m
            </p>
          </div>
        )}

        {weatherInfo && (
          <div className="mt-4 rounded-lg border p-4">
            <p>
              {t(
                'temperature'
              )}
              :{' '}
              {Math.round(
                weatherInfo.temperature
              )}
              ℃
            </p>

            <p>
              {t(
                'feelsLike'
              )}
              :{' '}
              {Math.round(
                weatherInfo.feelsLike
              )}
              ℃
            </p>

            <p>
              {t(
                'humidity'
              )}
              :{' '}
              {
                weatherInfo.humidity
              }
              %
            </p>

            <p>
              {t(
                'windSpeed'
              )}
              :{' '}
              {
                weatherInfo.windSpeed
              }{' '}
              m/s
            </p>

            <p>
              {t(
                'weatherCondition'
              )}
              :{' '}
              {t(
                `weather.${weatherInfo.weatherCondition}`
              )}
            </p>
          </div>
        )}
      </section>

      {/* =========================
          사진 / 동영상
         ========================= */}
      <section className="mt-8">
        <h2 className="font-semibold">
          {locale === 'ko'
            ? '사진 / 동영상'
            : 'Photos / Video'}
        </h2>

        <p className="mt-2 text-sm">
          {locale === 'ko'
            ? '사진은 최대 5장 또는 동영상 1개를 선택할 수 있습니다.'
            : 'Select up to 5 photos or 1 video.'}
        </p>

        <div className="mt-4">
	  <label className="block text-sm font-semibold text-gray-900">
	    {locale === 'ko'
	      ? '사진 선택'
	      : 'Select photos'}
	  </label>

	  <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
	    {locale === 'ko'
	      ? '사진 추가'
	      : 'Add photos'}

	    <input
	      type="file"
	      accept="image/*"
	      multiple
	      disabled={
	        mediaType === 'video'
	      }
	      onChange={
	        handleImageChange
	      }
	      className="hidden"
	    />
	  </label>
	</div>

	<div className="mt-4">
	  <label className="block text-sm font-semibold text-gray-900">
	    {locale === 'ko'
	      ? '동영상 선택'
	      : 'Select video'}
	  </label>

	  <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
	    {locale === 'ko'
	      ? '동영상 추가'
	      : 'Add video'}

	    <input
	      type="file"
	      accept="video/*"
	      disabled={
	        mediaType === 'image'
	      }
	      onChange={
	        handleVideoChange
	      }
	      className="hidden"
	    />
	  </label>
	</div>

	{mediaMessage && (
	  <p className="mt-3">
	    {mediaMessage}
	  </p>
	)}

        {/* 사진 미리보기 */}
        {mediaType === 'image' &&
  mediaPreviews.length > 0 && (
    <div className="mt-4 flex flex-wrap gap-3">
      {mediaPreviews.map(
        (preview, index) => (
          <div
            key={preview}
            className="relative"
          >
            <img
              src={preview}
              alt={`preview-${index}`}
              className="h-28 w-28 rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={() =>
                handleRemoveImage(
                  index
                )
              }
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-sm font-bold shadow"
              aria-label={
                locale === 'ko'
                  ? '사진 삭제'
                  : 'Remove photo'
              }
            >
              ×
            </button>
          </div>
        )
      )}
    </div>
  )}

        {/* 동영상 미리보기 */}
        {mediaType ===
          'video' &&
          mediaPreviews[0] && (
            <video
              src={
                mediaPreviews[0]
              }
              controls
              className="mt-4 max-h-80 max-w-xl rounded-lg border"
            />
          )}

        {mediaFiles.length >
          0 && (
          <button
            type="button"
            onClick={
              clearMedia
            }
            className="mt-4 rounded-lg border px-4 py-2"
          >
            {locale === 'ko'
              ? '선택 취소'
              : 'Clear media'}
          </button>
        )}
      </section>

      {/* =========================
          게시물 내용
         ========================= */}
      <section className="mt-8">
        <h2 className="font-semibold">
          {t('content')}
        </h2>

        <textarea
          value={content}
          onChange={(event) =>
            setContent(
              event.target.value
            )
          }
          placeholder={t(
            'contentPlaceholder'
          )}
          maxLength={1000}
          rows={5}
          className="min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        <p className="mt-2 text-sm">
          {content.length} /
          1000
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
                className={`rounded-full border px-4 py-2 text-sm transition ${
		  weatherFeeling === option
		    ? 'border-blue-200 bg-blue-50 font-medium text-blue-700'
		    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

        {outfitTagsLoading ? (
          <p className="mt-3">
            {t(
              'outfitLoading'
            )}
          </p>
        ) : outfitTags.length ===
          0 ? (
          <p className="mt-3">
            {locale === 'ko'
              ? '등록된 옷차림 태그가 없습니다.'
              : 'No outfit tags found.'}
          </p>
        ) : (
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
                    className={`rounded-full border px-4 py-2 text-sm transition ${
			  selectedOutfitTags.includes(tag.id)
			    ? 'border-gray-300 bg-gray-100 font-medium text-gray-800'
			    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
        )}
      </section>

      {/* =========================
          게시하기
         ========================= */}
      <section className="mt-8">
	  <div className="flex gap-3">
	    {/* 취소 버튼 */}
	    <button
	      type="button"
	      onClick={() => router.push('/')}
	      disabled={saving}
	      className="min-h-12 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
	    >
	      {locale === 'ko'
	        ? '취소'
	        : 'Cancel'}
	    </button>

	    {/* 게시하기 버튼 */}
	    <button
	      type="button"
	      onClick={handleSubmitPost}
	      disabled={saving}
	      className="min-h-12 flex-1 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
	    >
	      {saving
	        ? locale === 'ko'
	          ? '저장 중...'
	          : 'Saving...'
	        : locale === 'ko'
	          ? '게시하기'
	          : 'Post'}
	    </button>
	  </div>

	  {saveMessage && (
	    <p className="mt-3 text-sm text-red-500">
	      {saveMessage}
	    </p>
	  )}
	</section>

      {/* =========================
          개발 확인용
         ========================= */}
      <section className="mt-8 rounded-lg border p-4">
        <h2 className="font-semibold">
          개발 확인
        </h2>

        <p className="mt-2">
          선택된 미디어:{' '}
          {mediaType ?? '-'}
        </p>

        <p className="mt-2">
          미디어 개수:{' '}
          {mediaFiles.length}
        </p>

        <p className="mt-2">
          선택된 체감 날씨:{' '}
          {weatherFeeling ??
            '-'}
        </p>

        <p className="mt-2">
          입력 내용:{' '}
          {content || '-'}
        </p>

        <p className="mt-2">
          선택된 옷차림 태그
          ID:{' '}
          {selectedOutfitTags.length >
          0
            ? selectedOutfitTags.join(
                ', '
              )
            : '-'}
        </p>
      </section>
    </main>
  )
}
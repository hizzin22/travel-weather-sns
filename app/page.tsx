import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

import SearchPanel from '@/components/SearchPanel'
import PostMediaCarousel from '@/components/PostMediaCarousel'
import LikeButton from '@/components/LikeButton'
import DeletePostButton from '@/components/DeletePostButton'

import { createClient } from '@/lib/supabase/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ExpandablePostContent from '@/components/ExpandablePostContent'



type Post = {
  id: string
  user_id: string
  display_city: string | null
  display_country: string | null
  display_weather_condition: string | null
  display_temperature: number | null
  weather_feeling: string | null
  content: string | null
  weather_observed_at: string | null
  created_at: string
}

type Profile = {
  id: string
  username: string | null
  profile_image_path: string | null
}

type PostMedia = {
  id: string
  post_id: string
  media_type: 'image' | 'video'
  storage_path: string
  sort_order: number
}

type PostOutfitTag = {
  post_id: string
  outfit_tag_id: string
}

type Like = {
  id: string
  post_id: string
  user_id: string
}

type OutfitTag = {
  id: string
  name_ko: string
  name_en: string
}

 type Post = {
  id: string
  user_id: string

  city_ko: string | null
  city_en: string | null
  country_code: string | null

  display_city: string | null
  display_country: string | null
  location_overridden: boolean
  display_weather_condition: string | null
  display_temperature: number | null
  weather_feeling: string | null
  content: string | null
  created_at: string
}
function getWeatherFeelingLabel(
  value: string | null,
  locale: string
) {
  const labels = {
    very_cold: {
      ko: '매우 추움',
      en: 'Very cold',
    },
    cold: {
      ko: '추움',
      en: 'Cold',
    },
    comfortable: {
      ko: '적당함',
      en: 'Comfortable',
    },
    hot: {
      ko: '더움',
      en: 'Hot',
    },
    very_hot: {
      ko: '매우 더움',
      en: 'Very hot',
    },
  } as const

  if (
    !value ||
    !(value in labels)
  ) {
    return '-'
  }

  const item =
    labels[
      value as keyof typeof labels
    ]

  return locale === 'ko'
    ? item.ko
    : item.en
}

function getWeatherLabel(
  value: string | null,
  locale: string
) {
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
    return value ?? '-'
  }

  const item =
    labels[
      value as keyof typeof labels
    ]

  return locale === 'ko'
    ? item.ko
    : item.en
}

export default async function HomePage({
  searchParams,
}: {
 searchParams?: Promise<{
  query?: string
  weather?: string
  date?: string
}>
}) {
  const resolvedSearchParams =
    await searchParams

  const query =
    resolvedSearchParams?.query
      ?.trim()
      .toLowerCase() ?? ''

  const weatherFilter =
    resolvedSearchParams?.weather ??
    'all'

  const dateFilter =
    resolvedSearchParams?.date ?? ''

  const supabase =
    await createClient()

  const locale =
    await getLocale()

  // =========================
  // 로그인 확인
  // =========================

  const {
    data: { user },
  } =
    await supabase.auth.getUser()

  
  // =========================
  // 게시물 조회
  // 최신 게시물부터
  // =========================

  const {
    data: postsData,
    error: postsError,
  } =
    await supabase
      .from('posts')
      .select(
        `
        id,
        user_id,
        city_ko,
  	city_en,
  	country_code,
        display_city,
        display_country,
	location_overridden,
        display_weather_condition,
        display_temperature,
        weather_feeling,
        content,
	weather_observed_at,
        created_at
        `
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

  if (postsError) {
    console.error(
      'Feed posts error:',
      postsError
    )
  }

//날짜 비교 함수
function isWithinSeasonalDateRange(
  observedAt: string | null,
  selectedDate: string,
  rangeDays = 5
) {
  if (
    !observedAt ||
    !selectedDate
  ) {
    return true
  }

  const observed =
    new Date(observedAt)

  const selected =
    new Date(
      `${selectedDate}T12:00:00`
    )

  if (
    Number.isNaN(
      observed.getTime()
    ) ||
    Number.isNaN(
      selected.getTime()
    )
  ) {
    return false
  }

  // 연도를 동일하게 맞추고
  // 월/일 차이만 비교
  const referenceYear = 2000

  const observedReference =
    new Date(
      referenceYear,
      observed.getMonth(),
      observed.getDate()
    )

  const selectedReference =
    new Date(
      referenceYear,
      selected.getMonth(),
      selected.getDate()
    )

  const oneDay =
    1000 * 60 * 60 * 24

  let diffDays =
    Math.abs(
      observedReference.getTime() -
        selectedReference.getTime()
    ) / oneDay

  // 12월 말 ↔ 1월 초 같은 경우 대응
  const yearLength =
    366

  diffDays =
    Math.min(
      diffDays,
      yearLength - diffDays
    )

  return (
    diffDays <= rangeDays
  )
}

  const posts =
    (postsData ?? []) as Post[]
	const filteredPosts =
  query
    ? (() => {
        // =========================
        // 1. 도시 한글 ↔ 영문 alias 생성
        // =========================

        const searchAliases =
          new Set<string>([
            query,
          ])

        posts.forEach(
          (post) => {
            const cityKo =
              post.city_ko
                ?.trim()
                .toLowerCase()

            const cityEn =
              post.city_en
                ?.trim()
                .toLowerCase()

            if (
              !cityKo ||
              !cityEn
            ) {
              return
            }

            // 서울 검색 → seoul 추가
            if (
              cityKo.includes(
                query
              ) ||
              query.includes(
                cityKo
              )
            ) {
              searchAliases.add(
                cityKo
              )

              searchAliases.add(
                cityEn
              )
            }

            // seoul 검색 → 서울 추가
            if (
              cityEn.includes(
                query
              ) ||
              query.includes(
                cityEn
              )
            ) {
              searchAliases.add(
                cityEn
              )

              searchAliases.add(
                cityKo
              )
            }
          }
        )

        // =========================
        // 2. 실제 게시물 검색
        // =========================

        return posts.filter(
          (post) => {
            // ---------------------
            // 사용자가 위치를 수정한 게시물
            // ---------------------

            if (
              post.location_overridden
            ) {
              const manualValues =
                [
                  post.display_city,
                  post.display_country,
                ]
                  .filter(
                    (
                      value
                    ): value is string =>
                      Boolean(
                        value
                      )
                  )
                  .map(
                    (value) =>
                      value
                        .trim()
                        .toLowerCase()
                  )

              // 변경 후 위치만 검색
              return manualValues.some(
                (value) =>
                  value.includes(
                    query
                  )
              )
            }

            // ---------------------
            // 자동 위치 게시물
            // ---------------------

            const automaticValues =
              [
                post.city_ko,
                post.city_en,
                post.display_city,
                post.display_country,
                post.country_code,
              ]
                .filter(
                  (
                    value
                  ): value is string =>
                    Boolean(
                      value
                    )
                )
                .map(
                  (value) =>
                    value
                      .trim()
                      .toLowerCase()
                )

            // 서울 / Seoul alias 모두 검색
            return [
              ...searchAliases,
            ].some(
              (alias) =>
                automaticValues.some(
                  (value) =>
                    value.includes(
                      alias
                    )
                )
            )
          }
        )
      })()
    : posts

const finalPosts =
  weatherFilter === 'all'
    ? filteredPosts
    : filteredPosts.filter(
        (post) => {
          if (
            weatherFilter ===
            'cloudy'
          ) {
            return (
              post.display_weather_condition ===
                'cloudy' ||
              post.display_weather_condition ===
                'partly_cloudy'
            )
          }

          return (
            post.display_weather_condition ===
            weatherFilter
          )
        }
      )

//현재 날씨까지 적용한 finalPosts를 한 단계 더 필터
	const dateFilteredPosts =
	  dateFilter
	    ? finalPosts.filter(
	        (post) =>
	          isWithinSeasonalDateRange(
	            post.weather_observed_at,
	            dateFilter,
	            5
	          )
	      )
	    : finalPosts


  // 게시물이 없으면
  // 아래 추가 데이터 조회는 생략
  const postIds =
    posts.map(
      (post) => post.id
    )
  let likes: Like[] = []

if (postIds.length > 0) {
  const {
    data,
    error,
  } =
    await supabase
      .from('likes')
      .select(
        'id, post_id, user_id'
      )
      .in(
        'post_id',
        postIds
      )

  if (error) {
    console.error(
      'Feed likes error:',
      error
    )
  }

  likes =
    (data ?? []) as Like[]
}

  const userIds =
    [
      ...new Set(
        posts.map(
          (post) =>
            post.user_id
        )
      ),
    ]

  // =========================
  // 작성자 프로필 조회
  // =========================

  let profiles: Profile[] = []

  if (userIds.length > 0) {
    const {
      data,
      error,
    } =
      await supabase
        .from('profiles')
        .select(
          'id, username, profile_image_path'
        )
        .in(
          'id',
          userIds
        )

    if (error) {
      console.error(
        'Feed profiles error:',
        error
      )
    }

    profiles =
      (data ?? []) as Profile[]
  }

  // =========================
  // 게시물 미디어 조회
  // =========================

  let media: PostMedia[] = []

  if (postIds.length > 0) {
    const {
      data,
      error,
    } =
      await supabase
        .from('post_media')
        .select(
          'id, post_id, media_type, storage_path, sort_order'
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

    if (error) {
      console.error(
        'Feed media error:',
        error
      )
    }

    media =
      (data ?? []) as PostMedia[]
  }

  // =========================
  // 게시물-옷차림 연결 조회
  // =========================

  let postOutfitTags:
    PostOutfitTag[] = []

  if (postIds.length > 0) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'post_outfit_tags'
        )
        .select(
          'post_id, outfit_tag_id'
        )
        .in(
          'post_id',
          postIds
        )

    if (error) {
      console.error(
        'Feed post outfit error:',
        error
      )
    }

    postOutfitTags =
      (data ?? []) as PostOutfitTag[]
  }

  // =========================
  // 옷차림 태그 이름 조회
  // =========================

  const outfitTagIds =
    [
      ...new Set(
        postOutfitTags.map(
          (item) =>
            item.outfit_tag_id
        )
      ),
    ]

  let outfitTags:
    OutfitTag[] = []

  if (
    outfitTagIds.length > 0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from('outfit_tags')
        .select(
          'id, name_ko, name_en'
        )
        .in(
          'id',
          outfitTagIds
        )

    if (error) {
      console.error(
        'Feed outfit tags error:',
        error
      )
    }

    outfitTags =
      (data ?? []) as OutfitTag[]
  }

  // =========================
  // 빠르게 찾기 위한 Map
  // =========================

  const profileMap =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    )

  const outfitTagMap =
    new Map(
      outfitTags.map(
        (tag) => [
          tag.id,
          tag,
        ]
      )
    )

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6 sm:px-6">
      {/* =========================
          상단 메뉴
         ========================= */}
     <header className="flex items-center justify-between gap-3 border-b pb-4">
	  <Link
	  href="/"
	  className="whitespace-nowrap text-xl font-bold"
	>
	  Weather Outfit
	</Link>

	  <div className="flex shrink-0 items-center gap-2">
	    <Link
	  href="/post/new"
	  aria-label={
	    locale === 'ko'
	      ? '글쓰기'
	      : 'New post'
	  }
	  title={
	    locale === 'ko'
	      ? '글쓰기'
	      : 'New post'
	  }
	  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
	>
	  <svg
	    xmlns="http://www.w3.org/2000/svg"
	    viewBox="0 0 24 24"
	    fill="none"
	    stroke="currentColor"
	    strokeWidth="1.8"
	    className="h-5 w-5"
	  >
	    <path
	      strokeLinecap="round"
	      strokeLinejoin="round"
	      d="M12 20h9"
	    />
	    <path
	      strokeLinecap="round"
	      strokeLinejoin="round"
	      d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"
	    />
	  </svg>
	</Link>

	<Link
	  href="/me/profile"
	  aria-label={
	    locale === 'ko'
	      ? '마이페이지'
	      : 'My page'
	  }
	  title={
	    locale === 'ko'
	      ? '마이페이지'
	      : 'My page'
	  }
	  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
	>
	  <svg
	    xmlns="http://www.w3.org/2000/svg"
	    viewBox="0 0 24 24"
	    fill="none"
	    stroke="currentColor"
	    strokeWidth="1.8"
	    className="h-5 w-5"
	  >
	    <path
	      strokeLinecap="round"
	      strokeLinejoin="round"
	      d="M20 21a8 8 0 0 0-16 0"
	    />
	    <circle
	      cx="12"
	      cy="7"
	      r="4"
	    />
	  </svg>
	</Link>

	    <LanguageSwitcher />
	  </div>
	</header>

      {/* =========================
          게시물이 없는 경우
         ========================= */}
      {posts.length === 0 && (
        <div className="mt-12 rounded-xl border p-8 text-center">
          <p>
            {locale === 'ko'
              ? '아직 등록된 게시물이 없습니다.'
              : 'No posts yet.'}
          </p>

          <Link
            href="/post/new"
            className="mt-4 inline-block rounded-lg border px-5 py-3"
          >
            {locale === 'ko'
              ? '첫 게시물 작성하기'
              : 'Create the first post'}
          </Link>
        </div>
      )}

      {/* =========================
          Feed
         ========================= */}
	<SearchPanel
	  locale={locale}
	/>


      <section className="mt-6 space-y-6">
	  {dateFilteredPosts.length === 0 ? (
	    <div className="rounded-2xl border bg-white px-4 py-10 text-center">
	      <p className="text-sm text-gray-500">
	        {locale === 'ko'
	          ? '검색 조건에 맞는 게시물이 없어요'
	          : 'No posts match your search criteria.'}
	      </p>
	    </div>
	  ) : (
	    dateFilteredPosts.map((post) => {
	      const cityName =
	        post.location_overridden
	          ? post.display_city
	          : locale === 'ko'
	            ? post.city_ko ?? post.display_city
	            : post.city_en ?? post.display_city

	      const countryName =
	        post.location_overridden
	          ? post.display_country
	          : post.country_code
	            ? new Intl.DisplayNames(
	                [locale],
	                { type: 'region' }
	              ).of(post.country_code) ??
	              post.display_country
	            : post.display_country

		
		const postLikes =
		  likes.filter(
		    (like) =>
		      like.post_id ===
		      post.id
		  )

		const likedByMe =
		  user
		    ? postLikes.some(
		        (like) =>
		          like.user_id === user.id
		      )
		    : false


            const profile =
              profileMap.get(
                post.user_id
              )

            const postMedia =
              media.filter(
                (item) =>
                  item.post_id ===
                  post.id
              )

            const tagConnections =
              postOutfitTags.filter(
                (item) =>
                  item.post_id ===
                  post.id
              )

            const tags =
              tagConnections
                .map(
                  (item) =>
                    outfitTagMap.get(
                      item.outfit_tag_id
                    )
                )
                .filter(
                  (
                    tag
                  ): tag is OutfitTag =>
                    Boolean(tag)
                )

            let profileImageUrl:
              string | null =
              null

            if (
              profile?.profile_image_path
            ) {
              const {
                data,
              } =
                supabase.storage
                  .from(
                    'avatars'
                  )
                  .getPublicUrl(
                    profile.profile_image_path
                  )

              profileImageUrl =
                data.publicUrl
            }
            

            const createdAt =
              new Intl.DateTimeFormat(
                locale === 'ko'
                  ? 'ko-KR'
                  : 'en-US',
                {
                  year:
                    'numeric',
                  month:
                    'short',
                  day:
                    'numeric',
                  hour:
                    '2-digit',
                  minute:
                    '2-digit',
                }
              ).format(
                new Date(
                  post.created_at
                )
              )

            return (
              <article
		  key={post.id}
		  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
		>
                {/* 작성자 */}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
			  {/* 왼쪽: 프로필 이미지 + 작성자 + 작성일 */}
		  {/* 왼쪽: 프로필 */}
		  <div className="flex min-w-0 items-center gap-3">
		    {profileImageUrl ? (
		      <img
		        src={profileImageUrl}
		        alt=""
		        className="h-9 w-9 shrink-0 rounded-full object-cover"
		      />
		    ) : (
		      <div className="h-9 w-9 shrink-0 rounded-full bg-gray-100" />
		    )}

		    <div className="min-w-0">
		      <p className="truncate text-sm font-semibold text-gray-900">
		        {profile?.username ?? 'User'}
		      </p>

		      <p className="mt-0.5 text-xs text-gray-400">
		        {new Date(
		          post.created_at
		        ).toLocaleDateString(
		          locale === 'ko'
		            ? 'ko-KR'
		            : 'en-US'
		        )}
		      </p>
		    </div>
		  

		  {/* 오른쪽: 수정 / 삭제 */}
		 {user?.id === post.user_id && (
		  <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
		    <Link
		      href={`/post/${post.id}/edit`}
		      className="hover:text-gray-700"
		    >
		      {locale === 'ko'
		        ? '수정'
		        : 'Edit'}
		    </Link>

		    <DeletePostButton
		      postId={post.id}
		      currentUserId={user.id}
		      postUserId={post.user_id}
		      locale={locale}
		    />
		  </div>
		)}
		</div>

		</div>

                {/* 이미지 / 동영상 캐러셀 */}
		{postMedia.length > 0 && (
		  <PostMediaCarousel
		    items={postMedia.map(
		      (item) => {
		        const { data } =
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
		          url:
		            data.publicUrl,
		        }
		      }
		    )}
		  />
		)}

                {/* 게시물 정보 */}
		<div className="px-4 py-4">
		  {/* 위치 + 날씨 + 기온 */}
		  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
		  <div className="flex items-center gap-1.5">
		    <svg
		      xmlns="http://www.w3.org/2000/svg"
		      viewBox="0 0 24 24"
		      fill="none"
		      stroke="currentColor"
		      strokeWidth="1.8"
		      className="h-4 w-4 text-gray-500"
		    >
		      <path
		        strokeLinecap="round"
		        strokeLinejoin="round"
		        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
		      />
		      <circle
		        cx="12"
		        cy="10"
		        r="2.5"
		      />
		    </svg>

		    <span className="text-sm font-semibold text-gray-900">
		      {cityName}
		      {countryName
		        ? `, ${countryName}`
		        : ''}
		    </span>
		  </div>

		  {(post.display_weather_condition ||
		    post.display_temperature !== null) && (
		    <span className="text-sm text-gray-500">
		      {post.display_weather_condition
		        ? getWeatherLabel(
		            post.display_weather_condition,
		            locale
		          )
		        : ''}

		      {post.display_temperature !== null
		        ? `${post.display_weather_condition ? ' · ' : ''}${post.display_temperature}℃`
		        : ''}
		    </span>
		  )}
		</div>

		  {/* 체감 날씨 */}
		  {post.weather_feeling && (
  			<div className="mt-3">
			    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
			      {locale === 'ko' ? '체감' : 'Feels'}
			      {' · '}
			      {getWeatherFeelingLabel(
			        post.weather_feeling,
			        locale
			      )}
			    </span>
			  </div>
			)}

		  {/* 내용 */}
		  {post.content && (
		    <ExpandablePostContent
		      content={post.content}
		      locale={locale}
		    />
		  )}

		  {/* 옷차림 태그 */}
		 {tags.length > 0 && (
		  <div className="mt-3 flex flex-wrap gap-2">
		    {tags.map(tag => (
		      <span
		        key={tag.id}
		        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
		      >
		        #{locale === 'ko'
		          ? tag.name_ko
		          : tag.name_en}
		      </span>
		    ))}
		  </div>
		)}

		  {/* 좋아요 */}
		  <div className="mt-4 pt-2">
		    <LikeButton
			  postId={post.id}
			  userId={user?.id ?? null}
			  initialLiked={likedByMe}
			  initialCount={postLikes.length}
			/>
		  </div>
		</div>

		</article>      
           )
        })
      )}
    </section>
    </main>
  )
}
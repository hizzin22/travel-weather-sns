'use client'

import { useState } from 'react'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

import PostSearch from '@/components/PostSearch'
import DateFilter from '@/components/DateFilter'
import WeatherFilter from '@/components/WeatherFilter'

type Props = {
  locale: string
}

export default function SearchPanel({
  locale,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams =
    useSearchParams()

  const [open, setOpen] =
    useState(false)

  const query =
    searchParams.get('query')?.trim() ??
    ''

  const date =
    searchParams.get('date') ?? ''

  const weather =
    searchParams.get('weather') ??
    'all'

  // =========================
  // 날짜 표시
  // =========================

  const getDateLabel = () => {
    if (!date) {
      return ''
    }

    const parsedDate =
      new Date(
        `${date}T12:00:00`
      )

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return ''
    }

    return parsedDate.toLocaleDateString(
      locale === 'ko'
        ? 'ko-KR'
        : 'en-US',
      {
        month: 'short',
        day: 'numeric',
      }
    )
  }

  // =========================
  // 날씨 표시
  // =========================

  const getWeatherLabel = () => {
    const labels = {
      clear: {
        ko: '맑음',
        en: 'Clear',
      },
      cloudy: {
        ko: '흐림',
        en: 'Cloudy',
      },
      rain: {
        ko: '비',
        en: 'Rain',
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
      weather === 'all'
    ) {
      return ''
    }

    if (
      !(weather in labels)
    ) {
      return weather
    }

    const key =
      weather as keyof typeof labels

    return locale === 'ko'
      ? labels[key].ko
      : labels[key].en
  }

  // =========================
  // 검색조건 요약
  // =========================

  const summaryItems = [
    query,
    getDateLabel(),
    getWeatherLabel(),
  ].filter(Boolean)

  const summary =
    summaryItems.length > 0
      ? summaryItems.join(' · ')
      : locale === 'ko'
        ? '여행지·날짜로 찾아보기'
        : 'Find by destination & date'

  // =========================
  // 전체 검색조건 초기화
  // =========================

  const handleReset = () => {
    router.replace(pathname)
  }

  return (
    <section className="mt-6">
      {/* 검색 패널 열기 / 닫기 */}
     <button
	  type="button"
	  onClick={() => setOpen(current => !current)}
	  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
	>
        <div className="flex min-w-0 items-center gap-2">
          <svg
	  xmlns="http://www.w3.org/2000/svg"
	  viewBox="0 0 24 24"
	  fill="none"
	  stroke="currentColor"
	  strokeWidth="1.8"
	  className="h-5 w-5 shrink-0 text-gray-500"
	>
	  <circle
	    cx="11"
	    cy="11"
	    r="7"
	  />
	  <path
	    d="m20 20-3.5-3.5"
	  />
	</svg>

          <span className="truncate text-sm font-semibold">
            {summary}
          </span>
        </div>

        <svg
	  xmlns="http://www.w3.org/2000/svg"
	  viewBox="0 0 24 24"
	  fill="none"
	  stroke="currentColor"
	  strokeWidth="1.8"
	  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
	    open ? 'rotate-180' : ''
	  }`}
	>
	  <path
	    strokeLinecap="round"
	    strokeLinejoin="round"
	    d="m6 9 6 6 6-6"
	  />
	</svg>
      </button>

      {/* 펼쳐지는 검색 영역 */}
      {open && (
        <div className="mt-3 rounded-2xl border bg-white p-4 sm:p-5">
          {/* 여행지 */}
          <div>
            <p className="mb-2 text-sm font-semibold">
              {locale === 'ko'
                ? '여행지 검색'
                : 'Search destination'}
            </p>

            <PostSearch
              locale={locale}
            />
          </div>

          {/* 날짜 */}
          <div className="mt-5">
            <DateFilter
              locale={locale}
            />
          </div>

          {/* 날씨 */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">
              {locale === 'ko'
                ? '날씨'
                : 'Weather'}
            </p>

            <WeatherFilter
              locale={locale}
            />
          </div>

          {/* 전체 검색조건 초기화 */}
          {summaryItems.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border px-4 py-3 text-sm font-medium"
              >
                {locale === 'ko'
                  ? '검색 조건 초기화'
                  : 'Reset filters'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
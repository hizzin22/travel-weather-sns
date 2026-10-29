'use client'

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

type Props = {
  locale: string
}

type WeatherFilterValue =
  | 'all'
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'fog'
  | 'etc'

export default function WeatherFilter({
  locale,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams =
    useSearchParams()

  const currentWeather =
    searchParams.get('weather') ??
    'all'

  const options: {
    value: WeatherFilterValue
    ko: string
    en: string
  }[] = [
    {
      value: 'all',
      ko: '전체',
      en: 'All',
    },
    {
      value: 'clear',
      ko: '맑음',
      en: 'Clear',
    },
    {
      value: 'cloudy',
      ko: '흐림',
      en: 'Cloudy',
    },
    {
      value: 'rain',
      ko: '비',
      en: 'Rain',
    },
    {
      value: 'snow',
      ko: '눈',
      en: 'Snow',
    },
    {
      value: 'thunderstorm',
      ko: '뇌우',
      en: 'Thunderstorm',
    },
    {
      value: 'fog',
      ko: '안개',
      en: 'Fog',
    },
    {
      value: 'etc',
      ko: '기타',
      en: 'Other',
    },
  ]

  const handleFilter = (
    value: WeatherFilterValue
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      )

    if (value === 'all') {
      params.delete('weather')
    } else {
      params.set(
        'weather',
        value
      )
    }

    const queryString =
      params.toString()

    router.replace(
      queryString
        ? `${pathname}?${queryString}`
        : pathname
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(
        (option) => {
          const selected =
            currentWeather ===
            option.value

          return (
            <button
              key={
                option.value
              }
              type="button"
              onClick={() =>
                handleFilter(
                  option.value
                )
              }
              className={`rounded-full border px-4 py-2 text-sm ${
                selected
                  ? 'font-bold ring-2'
                  : ''
              }`}
            >
              {locale === 'ko'
                ? option.ko
                : option.en}
            </button>
          )
        }
      )}
    </div>
  )
}
'use client'

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

type Props = {
  locale: string
}

export default function DateFilter({
  locale,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams =
    useSearchParams()

  const currentDate =
    searchParams.get('date') ?? ''

  const handleDateChange = (
    value: string
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      )

    if (value) {
      params.set(
        'date',
        value
      )
    } else {
      params.delete(
        'date'
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
    <div>
      <label className="block text-sm font-medium">
        {locale === 'ko'
          ? '여행 날짜'
          : 'Travel date'}
      </label>

      <div className="mt-2 flex items-center gap-2">
        <input
          type="date"
          value={currentDate}
          onChange={(event) =>
            handleDateChange(
              event.target.value
            )
          }
          className="min-h-11 rounded-xl border px-3 py-2 outline-none focus:ring-2"
        />

        {currentDate && (
          <button
            type="button"
            onClick={() =>
              handleDateChange('')
            }
            className="min-h-11 rounded-xl border px-3 py-2 text-sm font-medium"
          >
            {locale === 'ko'
              ? '초기화'
              : 'Clear'}
          </button>
        )}
      </div>

      <p className="mt-2 text-xs">
        {locale === 'ko'
          ? '선택한 날짜 전후 5일의 과거 게시물을 보여줍니다.'
          : 'Shows past posts within 5 days before and after the selected date.'}
      </p>
    </div>
  )
}
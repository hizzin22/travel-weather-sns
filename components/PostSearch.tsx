'use client'

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

type Props = {
  locale: string
}

export default function PostSearch({
  locale,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams =
    useSearchParams()

  const currentQuery =
    searchParams.get('query') ?? ''

  const handleSearch = (
    value: string
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      )

    if (value.trim()) {
      params.set(
        'query',
        value
      )
    } else {
      params.delete(
        'query'
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
    <div className="w-full">
      <input
        type="search"
        defaultValue={
          currentQuery
        }
        onChange={(event) =>
          handleSearch(
            event.target.value
          )
        }
        placeholder={
          locale === 'ko'
            ? '도시 또는 국가 검색'
            : 'Search city or country'
        }
        className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2"
      />
    </div>
  )
}
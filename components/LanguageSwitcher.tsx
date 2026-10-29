'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { setLocale } from '@/app/actions/locale'

export default function LanguageSwitcher() {
  const router = useRouter()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleChange = (
    nextLocale: 'ko' | 'en'
  ) => {
    startTransition(async () => {
      await setLocale(nextLocale)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen(
            current => !current
          )
        }
        disabled={isPending}
        aria-label={
          locale === 'ko'
            ? '언어 변경'
            : 'Change language'
        }
        title={
          locale === 'ko'
            ? '언어 변경'
            : 'Change language'
        }
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path
            d="M3 12h18"
          />
          <path
            d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21"
          />
          <path
            d="M12 3C9.8 5.5 8.7 8.5 8.7 12S9.8 18.5 12 21"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-28 rounded-xl border bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() =>
              handleChange('ko')
            }
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              locale === 'ko'
                ? 'bg-gray-100 font-semibold'
                : 'hover:bg-gray-50'
            }`}
          >
            한국어
          </button>

          <button
            type="button"
            onClick={() =>
              handleChange('en')
            }
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              locale === 'en'
                ? 'bg-gray-100 font-semibold'
                : 'hover:bg-gray-50'
            }`}
          >
            English
          </button>
        </div>
      )}
    </div>
  )
}
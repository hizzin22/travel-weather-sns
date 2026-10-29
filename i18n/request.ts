import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

const supportedLocales = ['ko', 'en'] as const
type Locale = (typeof supportedLocales)[number]

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const savedLocale = cookieStore.get('locale')?.value

  let locale: Locale

  if (savedLocale === 'ko' || savedLocale === 'en') {
    locale = savedLocale
  } else {
    const acceptLanguage = headerStore.get('accept-language') ?? ''
    locale = acceptLanguage.toLowerCase().startsWith('ko')
      ? 'ko'
      : 'en'
  }

  const messages = (
    await import(`../messages/${locale}.json`)
  ).default

  return {
    locale,
    messages
  }
})
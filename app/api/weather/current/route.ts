import { NextResponse } from 'next/server'

function normalizeWeatherCondition(main: string) {
  const value = main.toLowerCase()

  if (value === 'clear') return 'clear'
  if (value === 'clouds') return 'cloudy'
  if (value === 'rain') return 'rain'
  if (value === 'drizzle') return 'drizzle'
  if (value === 'snow') return 'snow'
  if (value === 'thunderstorm') return 'thunderstorm'

  if (
    value === 'mist' ||
    value === 'fog' ||
    value === 'haze' ||
    value === 'smoke'
  ) {
    return 'fog'
  }

  return 'other'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json(
      { error: '위도와 경도가 필요합니다.' },
      { status: 400 }
    )
  }

  const apiKey = process.env.OPENWEATHER_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenWeather API Key가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&units=metric` +
    `&appid=${apiKey}`

  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()

    console.error(
      'OpenWeather current weather error:',
      response.status,
      errorText
    )

    return NextResponse.json(
      {
        error: '날씨 정보를 가져오지 못했습니다.',
        status: response.status,
        detail: errorText,
      },
      { status: response.status }
    )
  }

  const data = await response.json()

  return NextResponse.json({
  temperature: data.main?.temp ?? null,
  feelsLike: data.main?.feels_like ?? null,
  humidity: data.main?.humidity ?? null,
  windSpeed: data.wind?.speed ?? null,

  precipitation:
    data.rain?.['1h'] ??
    data.snow?.['1h'] ??
    0,

  weatherCondition: normalizeWeatherCondition(
    data.weather?.[0]?.main ?? ''
  ),

  observedAt: new Date().toISOString(),
})
}
//날씨정보(api 호출)
import { NextResponse } from 'next/server'

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
    `https://api.openweathermap.org/geo/1.0/reverse` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&limit=1` +
    `&appid=${apiKey}`

  const response = await fetch(url, {
    cache: 'no-store',
  })

if (!response.ok) {
  const errorText = await response.text()

  console.error(
    'OpenWeather reverse geocoding error:',
    response.status,
    errorText
  )

  return NextResponse.json(
    {
      error: '지역 정보를 가져오지 못했습니다.',
      status: response.status,
      detail: errorText,
    },
    { status: response.status }
  )
}

  const data = await response.json()

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json(
      { error: '지역 정보를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const location = data[0]

return NextResponse.json({
  city: {
    ko:
      location.local_names?.ko ??
      location.name ??
      '',
    en:
      location.local_names?.en ??
      location.name ??
      '',
  },
  countryCode: location.country ?? '',
  state: location.state ?? '',
  })
}
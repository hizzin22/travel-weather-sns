'use client'

import { useState } from 'react'

type MediaItem = {
  id: string
  media_type: 'image' | 'video'
  url: string
}

type Props = {
  items: MediaItem[]
}

export default function PostMediaCarousel({
  items,
}: Props) {
  // 현재 보고 있는 미디어 순서
  const [currentIndex, setCurrentIndex] =
    useState(0)

  // 모바일 터치 스와이프용
  const [touchStart, setTouchStart] =
    useState<number | null>(null)

  const [touchEnd, setTouchEnd] =
    useState<number | null>(null)

  // PC 마우스 드래그용
  const [mouseStart, setMouseStart] =
    useState<number | null>(null)

  const [mouseEnd, setMouseEnd] =
    useState<number | null>(null)

  const [isDragging, setIsDragging] =
    useState(false)

  if (items.length === 0) {
    return null
  }

  const currentItem =
    items[currentIndex]

  // =========================
  // 이전 미디어
  // =========================

  const handlePrevious = () => {
    setCurrentIndex((current) => {
      if (current === 0) {
        return items.length - 1
      }

      return current - 1
    })
  }

  // =========================
  // 다음 미디어
  // =========================

  const handleNext = () => {
    setCurrentIndex((current) => {
      if (
        current ===
        items.length - 1
      ) {
        return 0
      }

      return current + 1
    })
  }

  // =========================
  // 모바일 터치 스와이프
  // =========================

  const handleTouchStart = (
    event: React.TouchEvent
  ) => {
    setTouchEnd(null)

    setTouchStart(
      event.targetTouches[0]
        .clientX
    )
  }

  const handleTouchMove = (
    event: React.TouchEvent
  ) => {
    setTouchEnd(
      event.targetTouches[0]
        .clientX
    )
  }

  const handleTouchEnd = () => {
    if (
      touchStart === null ||
      touchEnd === null
    ) {
      return
    }

    const distance =
      touchStart - touchEnd

    const minSwipeDistance =
      50

    // 왼쪽으로 스와이프
    if (
      distance >
      minSwipeDistance
    ) {
      handleNext()
    }

    // 오른쪽으로 스와이프
    if (
      distance <
      -minSwipeDistance
    ) {
      handlePrevious()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // =========================
  // PC 마우스 드래그
  // =========================

  const handleMouseDown = (
    event: React.MouseEvent
  ) => {
    setIsDragging(true)

    setMouseStart(
      event.clientX
    )

    setMouseEnd(null)
  }

  const handleMouseMove = (
    event: React.MouseEvent
  ) => {
    if (!isDragging) {
      return
    }

    setMouseEnd(
      event.clientX
    )
  }

  const finishMouseDrag =
    () => {
      if (
        !isDragging ||
        mouseStart === null ||
        mouseEnd === null
      ) {
        setIsDragging(false)
        setMouseStart(null)
        setMouseEnd(null)
        return
      }

      const distance =
        mouseStart - mouseEnd

      const minDragDistance =
        50

      // 왼쪽으로 드래그
      if (
        distance >
        minDragDistance
      ) {
        handleNext()
      }

      // 오른쪽으로 드래그
      if (
        distance <
        -minDragDistance
      ) {
        handlePrevious()
      }

      setIsDragging(false)
      setMouseStart(null)
      setMouseEnd(null)
    }

  const handleMouseUp = () => {
    finishMouseDrag()
  }

  const handleMouseLeave =
    () => {
      if (isDragging) {
        finishMouseDrag()
      }
    }

  return (
    <div
      className="relative cursor-grab select-none bg-black active:cursor-grabbing"
      onTouchStart={
        handleTouchStart
      }
      onTouchMove={
        handleTouchMove
      }
      onTouchEnd={
        handleTouchEnd
      }
      onMouseDown={
        handleMouseDown
      }
      onMouseMove={
        handleMouseMove
      }
      onMouseUp={
        handleMouseUp
      }
      onMouseLeave={
        handleMouseLeave
      }
    >
      {/* =========================
          현재 이미지 / 동영상
         ========================= */}

      {currentItem.media_type ===
      'video' ? (
        <video
          src={currentItem.url}
          controls
          draggable={false}
          className="aspect-square w-full object-contain"
        />
      ) : (
        <img
          src={currentItem.url}
          alt=""
          draggable={false}
          className="aspect-square w-full object-cover"
        />
      )}

      {/* =========================
          미디어가 2개 이상일 때만
          이동 UI 표시
         ========================= */}

      {items.length > 1 && (
        <>
          {/* 이전 버튼 */}
          <button
            type="button"
            onClick={(
              event
            ) => {
              // 버튼 클릭이 캐러셀 드래그 이벤트로
              // 전달되지 않도록 차단
              event.stopPropagation()

              handlePrevious()
            }}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl shadow"
            aria-label="Previous"
          >
            ‹
          </button>

          {/* 다음 버튼 */}
          <button
            type="button"
            onClick={(
              event
            ) => {
              event.stopPropagation()

              handleNext()
            }}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl shadow"
            aria-label="Next"
          >
            ›
          </button>

          {/* 현재 순서 */}
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {currentIndex + 1} /{' '}
            {items.length}
          </div>

          {/* 하단 점 */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map(
              (
                item,
                index
              ) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(
                    event
                  ) => {
                    event.stopPropagation()

                    setCurrentIndex(
                      index
                    )
                  }}
                  onMouseDown={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  aria-label={`Media ${
                    index + 1
                  }`}
                  className={`h-2 w-2 rounded-full ${
                    currentIndex ===
                    index
                      ? 'bg-white'
                      : 'bg-white/50'
                  }`}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
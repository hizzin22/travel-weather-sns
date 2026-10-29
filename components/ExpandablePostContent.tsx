'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

type Props = {
  content: string
  locale: string
}

export default function ExpandablePostContent({
  content,
  locale,
}: Props) {
  const [expanded, setExpanded] =
    useState(false)

  const [
    shouldShowToggle,
    setShouldShowToggle,
  ] = useState(false)

  const textRef =
    useRef<HTMLParagraphElement | null>(
      null
    )

  useEffect(() => {
    const checkOverflow = () => {
      const element =
        textRef.current

      if (!element) {
        return
      }

      const wasExpanded =
        expanded

      element.classList.remove(
        'line-clamp-3'
      )

      const fullHeight =
        element.scrollHeight

      const computedStyle =
        window.getComputedStyle(
          element
        )

      const lineHeight =
        parseFloat(
          computedStyle.lineHeight
        )

      const threeLineHeight =
        lineHeight * 3

      setShouldShowToggle(
        fullHeight >
          threeLineHeight + 1
      )

      if (!wasExpanded) {
        element.classList.add(
          'line-clamp-3'
        )
      }
    }

    checkOverflow()

    window.addEventListener(
      'resize',
      checkOverflow
    )

    return () => {
      window.removeEventListener(
        'resize',
        checkOverflow
      )
    }
  }, [content, expanded])

  return (
    <div className="mt-3">
      <p
        ref={textRef}
        className={
          expanded
            ? 'whitespace-pre-wrap'
            : 'line-clamp-3 whitespace-pre-wrap'
        }
      >
        {content}
      </p>

      {shouldShowToggle && (
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          className="mt-1 text-sm font-medium"
        >
          {expanded
            ? locale === 'ko'
              ? '접기'
              : 'Show less'
            : locale === 'ko'
              ? '더보기'
              : 'More'}
        </button>
      )}
    </div>
  )
}
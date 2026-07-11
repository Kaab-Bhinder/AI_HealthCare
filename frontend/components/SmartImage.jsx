"use client"
import { useState } from 'react'

/** Image with a designed gradient fallback — if the photo can't load (offline,
 *  404), the layout still looks intentional instead of broken. */
export default function SmartImage({ src, alt = '', className = '', eager = false, fallbackClassName = 'bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900' }) {
  const [ok, setOk] = useState(true)
  if (!ok || !src) return <div aria-hidden="true" className={`${className} ${fallbackClassName}`} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} onError={() => setOk(false)} />
  )
}

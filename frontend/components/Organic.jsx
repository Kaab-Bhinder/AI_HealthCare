"use client"
import { useState } from 'react'

/** Soft organic blob — a decorative background shape (place absolutely). */
export function Blob({ className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 200" aria-hidden="true">
      <path fill="currentColor" d="M44.7,-58.3C57.4,-49.1,66.5,-34.9,70.6,-19.2C74.7,-3.6,73.8,13.5,66.7,27.4C59.6,41.3,46.3,52,31.6,59.6C16.9,67.2,0.8,71.7,-15.7,69.9C-32.2,68.1,-49.1,60,-59.8,46.7C-70.5,33.4,-75,14.9,-73.2,-2.7C-71.4,-20.3,-63.3,-37,-50.7,-46.4C-38.1,-55.8,-21,-57.9,-3.2,-53.9C14.6,-49.9,29.2,-39.8,44.7,-58.3Z" transform="translate(100 100)" />
    </svg>
  )
}

/** Botanical leaf sprig — hand-drawn feel decoration. */
export function Leaf({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M60 110C60 70 30 45 15 40 40 40 55 55 60 75 62 50 78 30 105 25 85 45 70 70 60 110Z" fill="currentColor" opacity="0.9" />
      <path d="M60 108C60 78 45 58 30 52" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
    </svg>
  )
}

/** Wavy section divider. Put at the top or bottom edge of a section. */
export function Wave({ className = '', flip = false, fill = 'currentColor' }) {
  return (
    <div className={`pointer-events-none w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-[40px] sm:h-[64px]">
        <path d="M0,40 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z" fill={fill} />
      </svg>
    </div>
  )
}

/** Doctor avatar — clean gradient initials. (Real photos can be re-enabled later
 *  by passing a `photo` URL and restoring the <img> branch.) */
export function DoctorAvatar({ name, className = '' }) {
  const initials = name
    ? name.replace(/^Dr\.?\s*/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('')
    : 'Dr'
  return (
    <span className={`grid place-items-center bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold ${className}`}>
      {initials}
    </span>
  )
}

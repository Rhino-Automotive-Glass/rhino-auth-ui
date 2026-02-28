'use client'

import Image from 'next/image'

export interface AuthLayoutProps {
  /** Background image path (e.g. "/my-bg.webp") */
  backgroundImage: string
  /** Alt text for the background image */
  backgroundAlt?: string
  /** Large heading displayed above the card */
  title: string
  /** Subtitle displayed below the heading */
  subtitle?: string
  /** Form or page content rendered inside the card */
  children: React.ReactNode
}

export function AuthLayout({
  backgroundImage,
  backgroundAlt = '',
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt={backgroundAlt}
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-blue-700/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-md text-blue-100">
              {subtitle}
            </p>
          )}
        </div>

        <div className="p-8 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-md">
          {children}
        </div>
      </div>
    </div>
  )
}

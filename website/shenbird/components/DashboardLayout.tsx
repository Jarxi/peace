"use client"

import { vendorLogout } from "@/lib/data/vendor"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { PeaceLogo } from "./icons"

type DashboardLayoutProps = {
  children: React.ReactNode
  vendorName?: string
  vendorEmail?: string
}

const NavLink: React.FC<{ children: React.ReactNode; href: string; active?: boolean }> = ({ children, href, active }) => (
  <Link
    href={href}
    className={`transition-colors duration-300 font-medium text-base ${
      active
        ? 'text-brand-primary border-b-2 border-brand-primary pb-1'
        : 'text-brand-text-secondary hover:text-brand-primary'
    }`}
  >
    {children}
  </Link>
)

export default function DashboardLayout({ children, vendorName = "Vendor", vendorEmail = "vendor@example.com" }: DashboardLayoutProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="bg-white text-brand-text-primary min-h-screen font-sans">
      <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-50 border-b border-brand-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <PeaceLogo className="h-6 w-auto" />
                <span className="font-bold text-2xl text-black">Shenbird</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <NavLink href="/dashboard" active={pathname === "/dashboard"}>AEO</NavLink>
              <NavLink href="/dashboard/acp-report" active={pathname === "/dashboard/acp-report"}>ACP Report</NavLink>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3"
                >
                  <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-800">{vendorName}</p>
                    {vendorEmail && (
                      <p className="text-slate-500 text-xs">{vendorEmail}</p>
                    )}
                  </div>
                  <svg className={`h-4 w-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </div>
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <form action={vendorLogout}>
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </div>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}

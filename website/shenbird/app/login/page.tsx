"use client"

import { vendorLogin } from "@/lib/data/vendor"
import { useActionState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, formAction] = useActionState(vendorLogin, null)
  const formRef = useRef<HTMLFormElement>(null)

  // Get error from URL query params
  const urlError = searchParams.get("error")

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state?.success, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-peach/20 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text-primary">
            Vendor Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-brand-text-secondary">
            Sign in to your vendor account
          </p>
        </div>
        <form ref={formRef} className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border-2 border-brand-border" action={formAction}>
          {(state?.error || urlError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {state?.error || urlError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-lg text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-brand-primary/30"
            >
              Sign In
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-brand-text-secondary">Don&apos;t have an account? </span>
            <Link href="/register" className="font-medium text-brand-primary hover:text-brand-primary-dark">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-white via-brand-peach/20 to-white flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

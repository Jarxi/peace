"use client"

import { useState } from "react"
import { useActionState } from "react"
import { changePassword } from "@/lib/data/vendor"

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  return (
    <div className="bg-white shadow-xl border-2 border-brand-border sm:rounded-2xl">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-brand-text-primary mb-2">
          Change Password
        </h3>
        <p className="text-sm text-brand-text-secondary mb-4">
          Update your password to keep your account secure
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-brand-text-primary"
            >
              Current Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm px-3 py-2 border pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-brand-text-primary"
            >
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                required
                minLength={8}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm px-3 py-2 border pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Password must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-brand-text-primary"
            >
              Confirm New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm px-3 py-2 border pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              {state?.success && (
                <p className="text-green-600 text-sm font-medium">
                  Password changed successfully!
                </p>
              )}
              {state?.error && (
                <p className="text-red-600 text-sm font-medium">{state.error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex justify-center rounded-md border border-transparent bg-brand-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPending ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

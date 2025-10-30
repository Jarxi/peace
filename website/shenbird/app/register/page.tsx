"use client"

import { vendorRegister } from "@/lib/data/vendor"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(vendorRegister, null)
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    vendorName: "",
    firstName: "",
    lastName: ""
  })
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [modalUrl, setModalUrl] = useState("")
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (showPrivacyModal) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [showPrivacyModal])

  const openModal = (url: string) => {
    setModalUrl(url)
    setShowPrivacyModal(true)
  }

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state?.success, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-text-primary">
            Vendor Registration
          </h2>
          <p className="mt-2 text-center text-sm text-brand-text-secondary">
            Create your vendor account
          </p>
        </div>
        <form ref={formRef} className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl border-2 border-brand-border" action={formAction}>
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {state.error}
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
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-gray-900"
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
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                id="vendorName"
                name="vendorName"
                type="text"
                required
                value={formData.vendorName}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy-policy"
                name="privacy-policy"
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="privacy-policy" className="text-gray-700">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => openModal('/privacy')}
                  className="text-brand-primary hover:text-brand-primary-dark underline"
                >
                  Privacy Policy
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => openModal('/service-agreement')}
                  className="text-brand-primary hover:text-brand-primary-dark underline"
                >
                  Service Agreement
                </button>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!acceptedPrivacy}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Vendor Account
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-brand-text-secondary">Already have an account? </span>
            <Link href="/login" className="font-medium text-brand-primary hover:text-brand-primary-dark">
              Sign in
            </Link>
          </div>
        </form>
      </div>

      {/* Privacy Policy Modal */}
      <style jsx>{`
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          maxWidth: 'none',
          maxHeight: 'none',
          width: '60vw',
          height: '85vh',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'transparent'
        }}
        className="rounded-lg"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            setShowPrivacyModal(false)
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full h-full relative">
          {/* Close Button */}
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Policy Content */}
          <iframe
            src={modalUrl}
            className="w-full h-full rounded-lg border-0"
            title="Policy Document"
          />
        </div>
      </dialog>
    </div>
  )
}

import { retrieveVendor } from "@/lib/data/vendor"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import ProfileForm from "@/components/ProfileForm"
import ChangePasswordForm from "@/components/ChangePasswordForm"

export default async function ProfilePage() {
  const { vendor, error } = await retrieveVendor()

  if (!vendor || !vendor.admins || vendor.admins.length === 0) {
    const errorParam = error ? `?error=${encodeURIComponent(error)}` : ""
    redirect(`/login${errorParam}`)
  }

  const admin = vendor.admins[0]
  const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || "Admin"

  return (
    <DashboardLayout
      vendorName={adminName}
      vendorEmail={admin.email}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your vendor information, contact details, and store policies
          </p>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-blue-900 mb-1">Admin Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Name:</span>{" "}
              <span className="text-blue-900">{adminName}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Email:</span>{" "}
              <span className="text-blue-900">{admin.email}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Vendor ID:</span>{" "}
              <span className="text-blue-900 font-mono text-xs">{vendor.id}</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <ChangePasswordForm />
        </div>

      </div>
    </DashboardLayout>
  )
}

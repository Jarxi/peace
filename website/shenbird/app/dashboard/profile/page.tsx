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
          <h1 className="text-3xl font-bold text-brand-text-primary">Vendor Profile</h1>
          <p className="mt-2 text-brand-text-secondary">
            Manage your vendor information, contact details, and store policies
          </p>
        </div>

        <div className="mb-6 bg-brand-peach/20 border-2 border-brand-border rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-brand-text-primary mb-1">Admin Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-brand-primary font-medium">Name:</span>{" "}
              <span className="text-brand-text-primary">{adminName}</span>
            </div>
            <div>
              <span className="text-brand-primary font-medium">Email:</span>{" "}
              <span className="text-brand-text-primary">{admin.email}</span>
            </div>
            <div>
              <span className="text-brand-primary font-medium">Vendor ID:</span>{" "}
              <span className="text-brand-text-primary font-mono text-xs">{vendor.id}</span>
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

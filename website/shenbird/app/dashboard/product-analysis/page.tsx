import DashboardLayout from "@/components/DashboardLayout"
import ProductAnalysisContent from "@/components/ProductAnalysisContent"
import { retrieveVendor } from "@/lib/data/vendor"
import { redirect } from "next/navigation"

export default async function ProductAnalysisPage() {
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
      <ProductAnalysisContent />
    </DashboardLayout>
  )
}

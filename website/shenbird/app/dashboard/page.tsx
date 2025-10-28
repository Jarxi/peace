import { retrieveVendor, checkVendorStores } from "@/lib/data/vendor"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import AnalyticsDashboard from "@/components/AnalyticsDashboard"
import ClaimStore from "@/components/ClaimStore"

type PageProps = {
  searchParams: Promise<{ claimed?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { vendor, error } = await retrieveVendor()

  if (!vendor || !vendor.admins || vendor.admins.length === 0) {
    const errorParam = error ? `?error=${encodeURIComponent(error)}` : ""
    redirect(`/login${errorParam}`)
  }

  const admin = vendor.admins[0]
  const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || "Admin"

  // Special test account - show claim page, but analytics if claimed
  const isTestAccount = admin.email === "test@shopify.com"
  const params = await searchParams
  const testAccountClaimed = isTestAccount && params.claimed === "true"

  // Check if vendor has claimed any stores
  const { hasStores } = isTestAccount && !testAccountClaimed
    ? { hasStores: false }
    : testAccountClaimed
    ? { hasStores: true }
    : await checkVendorStores()

  return (
    <DashboardLayout
      vendorName={adminName}
      vendorEmail={admin.email}
    >
      {hasStores ? (
        <AnalyticsDashboard />
      ) : (
        <ClaimStore isTestAccount={isTestAccount} />
      )}
    </DashboardLayout>
  )
}

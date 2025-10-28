"use client"

import DashboardLayout from "@/components/DashboardLayout"
import AnalyticsDashboard from "@/components/AnalyticsDashboard"

export default function DemoPage() {
  return (
    <DashboardLayout
      vendorName="Demo Vendor"
      vendorEmail="demo@example.com"
    >
      <AnalyticsDashboard />
    </DashboardLayout>
  )
}

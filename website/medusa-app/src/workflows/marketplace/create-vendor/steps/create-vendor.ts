import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

type CreateVendorStepInput = {
    name: string
    handle?: string
    logo?: string
}

const createVendorStep = createStep(
    "create-vendor",
    async (vendorData: CreateVendorStepInput, { container }) => {
        const marketplaceModuleService: MarketplaceModuleService =
            container.resolve(MARKETPLACE_MODULE)

        // Auto-generate handle from name if not provided (use lowercase vendor name)
        const handle = vendorData.handle || vendorData.name.toLowerCase()

        const vendor = await marketplaceModuleService.createVendors({
            ...vendorData,
            handle,
        })

        return new StepResponse(vendor, vendor.id)
    },
    async (vendorId, { container }) => {
        if (!vendorId) {
            return
        }

        const marketplaceModuleService: MarketplaceModuleService =
            container.resolve(MARKETPLACE_MODULE)

        marketplaceModuleService.deleteVendors(vendorId)
    }
)

export default createVendorStep
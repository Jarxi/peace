import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import MarketplaceModuleService from "../../../../modules/marketplace/service"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"

type CreateVendorStoreStepInput = {
    store_id: string
    claim_code: string
    vendor_id?: string | null
}

const createVendorStoreStep = createStep(
    "create-vendor-store-step",
    async (
        storeData: CreateVendorStoreStepInput,
        { container }
    ) => {
        const marketplaceModuleService: MarketplaceModuleService =
            container.resolve(MARKETPLACE_MODULE)

        const vendorStore = await marketplaceModuleService.createVendorStores(
            storeData
        )

        return new StepResponse(
            vendorStore,
            vendorStore.id
        )
    },
    async (vendorStoreId, { container }) => {
        if (!vendorStoreId) {
            return
        }

        const marketplaceModuleService: MarketplaceModuleService =
            container.resolve(MARKETPLACE_MODULE)

        marketplaceModuleService.deleteVendorStores(vendorStoreId)
    }
)

export default createVendorStoreStep
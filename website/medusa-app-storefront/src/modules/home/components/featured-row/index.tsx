import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

type FeaturedRowProps = {
  region: HttpTypes.StoreRegion
  countryCode: string
  collectionId?: string
  limit?: number
}

export default async function FeaturedRow({
  region,
  countryCode,
  collectionId,
  limit = 8,
}: FeaturedRowProps) {
  // Fetch products - either from a specific collection or general featured products
  const queryParams: any = {
    limit,
    fields: "*variants.calculated_price",
  }

  if (collectionId) {
    queryParams.collection_id = [collectionId]
  }

  const { response } = await listProducts({
    queryParams,
    countryCode,
  })

  const products = response.products

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className="content-container pt-12 pb-6">
      <div className="w-full overflow-x-auto">
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview region={region} product={product} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <LocalizedClientLink href="/store">
          <Button
            variant="secondary"
            className="px-8 py-3 text-base font-semibold"
          >
            See All
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

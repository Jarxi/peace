import './App.css'
import { useWidgetProps } from './lib/use-widget-props'

type Product = {
  sku: string
  name: string
  description: string
  price: {
    amount: number
    currency: string
    display: string
  }
  badges: string[]
  imageUrl: string
  productUrl?: string
}

type WidgetPayload = {
  status?: string
  products?: Product[]
}

function App() {
  const widgetData = useWidgetProps<WidgetPayload>({ status: 'loading' })
  console.debug('[Rockrooster widget] toolOutput payload:', widgetData)

  const displayProducts = widgetData.products ?? []
  const statusMessage =
    widgetData.status ??
    (displayProducts.length > 0
      ? 'Ready to explore Rockrooster boots tailored to your trade.'
      : 'No Rockrooster products available right now.')

  return (
    <div className="boot-app">
      <header className="boot-header">
        <h1>Rockrooster Boot Merchant</h1>
        <p className="boot-lede">
          Five ready-to-ship Rockrooster boots curated for protection, comfort,
          and lasting grit.
        </p>
        <p className="boot-status">{statusMessage}</p>
      </header>

      <section aria-label="Featured Rockrooster boots">
        <div className="boot-carousel">
          {displayProducts.map((product) => {
            const {
              sku,
              name,
              imageUrl,
              price,
              description,
              badges = [],
              productUrl,
            } = product

            const handleViewDetails = () => {
              console.log('[Rockrooster widget] View details clicked for:', name)
              console.log('[Rockrooster widget] Product URL:', productUrl)
              if (productUrl) {
                console.log('[Rockrooster widget] Navigating to:', productUrl)
                window.open(productUrl, '_blank')
              } else {
                console.warn('[Rockrooster widget] No productUrl provided for:', name)
              }
            }

            return (
              <article key={sku} className="boot-card">
                <img
                  src={imageUrl}
                  alt={`${name} boot`}
                  className="boot-card-image"
                  loading="lazy"
                />
                <div className="boot-card-body">
                  <div className="boot-card-meta">
                    <h2>{name}</h2>
                    {price?.display ? (
                      <p className="boot-card-price">{price.display}</p>
                    ) : null}
                  </div>
                  {description ? (
                    <p className="boot-card-description">{description}</p>
                  ) : null}
                  {badges.length > 0 ? (
                    <ul className="boot-card-badges">
                      {badges.map((badge) => (
                        <li key={`${sku}-${badge}`}>{badge}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <footer className="boot-card-footer">
                  <button
                    type="button"
                    className="boot-card-cta"
                    onClick={handleViewDetails}
                  >
                    View details
                  </button>
                </footer>
              </article>
            )
          })}
          {displayProducts.length === 0 ? (
            <div className="boot-empty">
              <p>No Rockrooster products available right now.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default App

import './App.css'
import { useEffect } from 'react'
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
  intention_summary?: string
  summary?: string
  products?: Product[]
}

function App() {
  const widgetData = useWidgetProps<WidgetPayload>({ status: 'loading' })
  console.debug('[Rockrooster widget] toolOutput payload:', widgetData)
  console.log('[Rockrooster widget] Summary from API:', widgetData.summary)
  console.log('[Rockrooster widget] Has summary?', !!widgetData.summary)

  useEffect(() => {
    console.log('[Rockrooster widget] Component re-rendered with summary:', widgetData.summary)
  }, [widgetData.summary])

  const displayProducts = widgetData.products ?? []
  const isLoading = widgetData.status === 'loading' && displayProducts.length === 0
  const hasProducts = displayProducts.length > 0
  const statusMessage = widgetData.status ??
    (hasProducts
      ? 'Ready to explore Rockrooster boots tailored to your trade.'
      : 'Describe your shift and constraints to sharpen these recommendations.')

  return (
    <div className={`boot-app ${isLoading ? 'is-loading' : ''}`}>
      <header className="boot-header">
        <h1>Rockrooster Boot Merchant</h1>
        <p className="boot-lede">
          {widgetData.summary || 'Five ready-to-ship Rockrooster boots curated for protection, comfort, and lasting grit.'}
        </p>
        <p className="boot-status">{statusMessage}</p>
      </header>

      <section aria-label="Featured Rockrooster boots">
        <div className={`boot-carousel ${isLoading ? 'boot-carousel--loading' : ''}`}>
          {isLoading ? (
            <div className="boot-loading" role="status" aria-live="polite">
              <div className="boot-loading-spinner" aria-hidden="true" />
              <p>Finding the strongest Rockrooster boots …</p>
            </div>
          ) : null}
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
              const targetUrl = productUrl || 'https://rockroosterfootwear.com'
              console.log('[Rockrooster widget] Navigating to:', targetUrl)
              window.open(targetUrl, '_blank')
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
          {!isLoading && !hasProducts ? (
            <div className="boot-empty">
              <p>
                We could not find a matching boot yet. Adjust your request or ask for
                Rockrooster best sellers to get restarted.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default App

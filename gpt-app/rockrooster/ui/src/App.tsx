import { useEffect } from 'react'
import './App.css'
import { useOpenAiGlobal } from './lib/use-openai-global'
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
  products?: Product[]
}

function App() {
  const theme = useOpenAiGlobal('theme')
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const container = document.getElementById('buy-boot-root')
    const root = document.documentElement

    if (!container) {
      return
    }

    const previousContainerTheme = container.getAttribute('data-theme')
    const previousRootTheme = root.getAttribute('data-theme')

    container.setAttribute('data-theme', resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)

    return () => {
      if (previousContainerTheme) {
        container.setAttribute('data-theme', previousContainerTheme)
      } else {
        container.removeAttribute('data-theme')
      }

      if (previousRootTheme) {
        root.setAttribute('data-theme', previousRootTheme)
      } else {
        root.removeAttribute('data-theme')
      }
    }
  }, [resolvedTheme])

  const widgetData = useWidgetProps<WidgetPayload>({ status: 'loading' })
  console.debug('[Rockrooster widget] toolOutput payload:', widgetData)

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
          Five ready-to-ship Rockrooster boots curated for protection, comfort,
          and lasting grit.
        </p>
        <p className="boot-status">{statusMessage}</p>
      </header>

      <section aria-label="Featured Rockrooster boots">
        <div className={`boot-carousel ${isLoading ? 'boot-carousel--loading' : ''}`}>
          {isLoading ? (
            <article
              className="boot-card boot-card--loading"
              role="status"
              aria-live="polite"
            >
              <div className="boot-loading-spinner" aria-hidden="true" />
              <p>Finding the strongest Rockrooster boots …</p>
            </article>
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

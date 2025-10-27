import { useEffect, useRef, useState } from 'react'
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
  summary?: string
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

  const displayProducts = widgetData.products ?? []
  const isLoading = widgetData.status === 'loading' && displayProducts.length === 0
  const hasProducts = displayProducts.length > 0

  const carouselRef = useRef<HTMLDivElement | null>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollHints = () => {
    const el = carouselRef.current
    if (!el) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    const maxScrollLeft = el.scrollWidth - el.clientWidth
    const left = el.scrollLeft
    setCanScrollPrev(left > 4)
    setCanScrollNext(left < maxScrollLeft - 4)
  }

  useEffect(() => {
    updateScrollHints()
    const el = carouselRef.current
    if (!el) {
      return
    }

    const handleScroll = () => updateScrollHints()
    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [displayProducts.length])

  useEffect(() => {
    const raf = requestAnimationFrame(updateScrollHints)
    return () => cancelAnimationFrame(raf)
  }, [isLoading])

  const scrollCarousel = (direction: 'left' | 'right') => {
    const el = carouselRef.current
    if (!el) {
      return
    }
    const delta = direction === 'left' ? -el.clientWidth * 0.8 : el.clientWidth * 0.8
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className={`boot-app ${isLoading ? 'is-loading' : ''}`}>
      {!isLoading ? (
        <header className="boot-header">
          <h1>Rockrooster Boot Merchant</h1>
          <p className="boot-lede">
            {widgetData.summary || 'Popular Rockrooster boots curated for protection, comfort, and lasting grit.'}
          </p>
        </header>
      ) : null}

      <section aria-label="Featured Rockrooster boots">
        <div className="boot-carousel-frame">
          {canScrollPrev ? (
            <button
              type="button"
              className="boot-carousel-arrow boot-carousel-arrow--left"
              aria-label="Scroll left"
              onClick={() => scrollCarousel('left')}
            >
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M15 5 9 12l6 7" />
              </svg>
            </button>
          ) : null}
          {canScrollNext ? (
            <button
              type="button"
              className="boot-carousel-arrow boot-carousel-arrow--right"
              aria-label="Scroll right"
              onClick={() => scrollCarousel('right')}
            >
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M9 5l6 7-6 7" />
              </svg>
            </button>
          ) : null}
          <div
            ref={carouselRef}
            className={`boot-carousel ${isLoading ? 'boot-carousel--loading' : ''}`}
          >
            {isLoading ? (
              <div className="boot-loading-inline" role="status" aria-live="polite">
                <div className="boot-loading-spinner" aria-hidden="true" />
                <span>Rockrooster is picking the right boots…</span>
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
                const targetUrl = productUrl || 'https://rockroosterfootwear.com'
                window.open(targetUrl, '_blank')
              }

              return (
                <article key={sku} className="boot-card">
                  <div className="boot-card-image">
                    <img
                      src={imageUrl}
                      alt={`${name} boot`}
                      loading="lazy"
                      width="320"
                      height="320"
                    />
                  </div>
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
        </div>
      </section>
    </div>
  )
}

export default App

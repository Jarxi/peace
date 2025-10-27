import './App.css'

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
}

const products: Product[] = [
  {
    sku: 'RR-TASMAN-LOGGER',
    name: 'Tasman Logger',
    description:
      'Composite toe, PORON XRD cushioning, full-grain leather shell.',
    price: { amount: 189.0, currency: 'USD', display: '$189.00' },
    badges: ['Composite Toe', 'EH Rated', 'PORON XRD'],
    imageUrl:
      'https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369',
  },
  {
    sku: 'RR-HARBOR-WP',
    name: 'Harbor Waterproof',
    description:
      'Waterproof membrane with CoolMax lining to stay dry in every season.',
    price: { amount: 175.0, currency: 'USD', display: '$175.00' },
    badges: ['Waterproof', 'CoolMax'],
    imageUrl:
      'https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369',
  },
  {
    sku: 'RR-SUMMIT-HIKER',
    name: 'Summit Hiker',
    description: 'Vibram outsole, heat resistant thread, ready for mixed terrain.',
    price: { amount: 162.0, currency: 'USD', display: '$162.00' },
    badges: ['Vibram', 'Heat Resistant'],
    imageUrl:
      'https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369',
  },
  {
    sku: 'RR-FORGE-PULLON',
    name: 'Forge Pull-On',
    description: 'Slip resistant wedge outsole with easy on-off pull tabs.',
    price: { amount: 168.0, currency: 'USD', display: '$168.00' },
    badges: ['Slip Resistant', 'Quick On/Off'],
    imageUrl:
      'https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369',
  },
  {
    sku: 'RR-OUTBACK-STEEL',
    name: 'Outback Steel',
    description:
      'Steel toe with puncture plate engineered for heavy industrial duty.',
    price: { amount: 194.0, currency: 'USD', display: '$194.00' },
    badges: ['Steel Toe', 'Puncture Plate'],
    imageUrl:
      'https://rockroosterfootwear.com/cdn/shop/files/IMG_0294_1390x1390.jpg?v=1754550369',
  },
]

function App() {
  return (
    <div className="boot-app">
      <header className="boot-header">
        <h1>Rockrooster Boot Merchant</h1>
        <p className="boot-lede">
          Five ready-to-ship Rockrooster boots curated for protection, comfort,
          and lasting grit.
        </p>
      </header>

      <section aria-label="Featured Rockrooster boots">
        <div className="boot-carousel">
          {products.map((product) => (
            <article key={product.sku} className="boot-card">
              <img
                src={product.imageUrl}
                alt={`${product.name} boot`}
                className="boot-card-image"
                loading="lazy"
              />
              <div className="boot-card-body">
                <div className="boot-card-meta">
                  <h2>{product.name}</h2>
                  <p className="boot-card-price">{product.price.display}</p>
                </div>
                <p className="boot-card-description">{product.description}</p>
                <ul className="boot-card-badges">
                  {product.badges.map((badge) => (
                    <li key={badge}>{badge}</li>
                  ))}
                </ul>
              </div>
              <footer className="boot-card-footer">
                <button type="button" className="boot-card-cta">
                  View details
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App

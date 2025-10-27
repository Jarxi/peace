import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('buy-boot-root')

if (container) {
  createRoot(container).render(<App />)
} else {
  console.error(
    'Rockrooster boot widget failed to mount because #buy-boot-root was not found.',
  )
}

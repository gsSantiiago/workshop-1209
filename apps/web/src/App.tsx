import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState('checking…')

  useEffect(() => {
    fetch('/health')
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<{ status: string }>
      })
      .then((data) => setHealth(data.status))
      .catch(() => setHealth('offline'))
  }, [])

  return (
    <main>
      <h1>Fake ERP</h1>
      <p>
        API: <code>{health}</code>
      </p>
    </main>
  )
}

export default App

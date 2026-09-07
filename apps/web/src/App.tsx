import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Item = {
  id: string
  sku: string
  name: string
  unit: string
  createdAt: string
}

function App() {
  const [items, setItems] = useState<Item[]>([])
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    const response = await fetch('/api/items')
    if (!response.ok) return
    const data = (await response.json()) as Item[]
    setItems(data)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sku, name, unit }),
    })
    if (response.status === 201) {
      setSku('')
      setName('')
      setUnit('')
      await refresh()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Não foi possível criar o item')
  }

  async function onDelete(id: string) {
    setError('')
    const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
    if (response.status === 204) {
      await refresh()
    }
  }

  return (
    <main>
      <h1>Catálogo</h1>
      <form onSubmit={(event) => void onSubmit(event)}>
        <label>
          SKU
          <input
            name="sku"
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            required
          />
        </label>
        <label>
          Nome
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Unidade
          <input
            name="unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            required
          />
        </label>
        <button type="submit">Criar item</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {items.length === 0 ? (
        <p>Nenhum item no catálogo.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.sku}</span>
              <span>{item.name}</span>
              <span>{item.unit}</span>
              <button type="button" onClick={() => void onDelete(item.id)}>
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App

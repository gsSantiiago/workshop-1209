import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Screen = 'catalog' | 'warehouse' | 'job' | 'stock' | 'inventory' | 'users'
type Role = 'Administrator' | 'Operator'

type User = {
  id: string
  email: string
  role: Role
  createdAt: string
}

type Item = {
  id: string
  sku: string
  name: string
  unit: string
  createdAt: string
}

type Warehouse = {
  id: string
  name: string
  createdAt: string
}

type Job = {
  id: string
  name: string
  createdAt: string
}

type Stock = {
  id: string
  warehouseId: string
  itemId: string
  quantity: number
  createdAt: string
}

type Movement = {
  id: string
  type: 'receipt' | 'transfer' | 'issue'
  itemId: string
  quantity: number
  warehouseId: string
  toWarehouseId: string | null
  jobId: string | null
  createdAt: string
}

function App() {
  const [ready, setReady] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [screen, setScreen] = useState<Screen>('catalog')
  const [items, setItems] = useState<Item[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [stock, setStock] = useState<Stock[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [warehouseName, setWarehouseName] = useState('')
  const [jobName, setJobName] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [transferItemId, setTransferItemId] = useState('')
  const [transferQuantity, setTransferQuantity] = useState('')
  const [issueWarehouseId, setIssueWarehouseId] = useState('')
  const [issueItemId, setIssueItemId] = useState('')
  const [issueJobId, setIssueJobId] = useState('')
  const [issueQuantity, setIssueQuantity] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState<Role>('Operator')
  const [error, setError] = useState('')

  async function request(url: string, init?: RequestInit) {
    const response = await fetch(url, { ...init, credentials: 'include' })
    if (response.status === 401) {
      setCurrentUser(null)
    }
    return response
  }

  async function refreshItems() {
    const response = await request('/api/items')
    if (!response.ok) return
    setItems((await response.json()) as Item[])
  }

  async function refreshWarehouses() {
    const response = await request('/api/warehouses')
    if (!response.ok) return
    setWarehouses((await response.json()) as Warehouse[])
  }

  async function refreshJobs() {
    const response = await request('/api/jobs')
    if (!response.ok) return
    setJobs((await response.json()) as Job[])
  }

  async function refreshStock() {
    const response = await request('/api/stock')
    if (!response.ok) return
    setStock((await response.json()) as Stock[])
  }

  async function refreshMovements() {
    const response = await request('/api/movements')
    if (!response.ok) return
    setMovements((await response.json()) as Movement[])
  }

  async function refreshUsers() {
    const response = await request('/api/users')
    if (!response.ok) return
    setUsers((await response.json()) as User[])
  }

  async function refreshAll() {
    await Promise.all([
      refreshItems(),
      refreshWarehouses(),
      refreshJobs(),
      refreshStock(),
      refreshMovements(),
      refreshUsers(),
    ])
  }

  useEffect(() => {
    void (async () => {
      const response = await request('/api/me')
      if (response.ok) {
        setCurrentUser((await response.json()) as User)
        await refreshAll()
      }
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (warehouseId && !warehouses.some((warehouse) => warehouse.id === warehouseId)) {
      setWarehouseId('')
    }
  }, [warehouseId, warehouses])

  useEffect(() => {
    if (itemId && !items.some((item) => item.id === itemId)) {
      setItemId('')
    }
  }, [itemId, items])

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    })
    if (response.ok) {
      setCurrentUser((await response.json()) as User)
      setLoginEmail('')
      setLoginPassword('')
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not sign in')
  }

  async function onLogout() {
    setError('')
    await request('/api/logout', { method: 'POST' })
    setCurrentUser(null)
    setScreen('catalog')
  }

  async function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword, role: userRole }),
    })
    if (response.status === 201) {
      setUserEmail('')
      setUserPassword('')
      setUserRole('Operator')
      await refreshUsers()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not create User')
  }

  async function onDeleteUser(id: string) {
    setError('')
    const response = await request(`/api/users/${id}`, { method: 'DELETE' })
    if (response.status === 204) {
      await refreshUsers()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not delete User')
  }

  async function onCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sku, name, unit }),
    })
    if (response.status === 201) {
      setSku('')
      setName('')
      setUnit('')
      await refreshItems()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Não foi possível criar o item')
  }

  async function onDeleteItem(id: string) {
    setError('')
    const response = await request(`/api/items/${id}`, { method: 'DELETE' })
    if (response.status === 204) {
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Não foi possível excluir o item')
  }

  async function onCreateWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/warehouses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: warehouseName }),
    })
    if (response.status === 201) {
      setWarehouseName('')
      await refreshWarehouses()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not create Warehouse')
  }

  async function onDeleteWarehouse(id: string) {
    setError('')
    const response = await request(`/api/warehouses/${id}`, { method: 'DELETE' })
    if (response.status === 204) {
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not delete Warehouse')
  }

  async function onCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: jobName }),
    })
    if (response.status === 201) {
      setJobName('')
      await refreshJobs()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not create Job')
  }

  async function onDeleteJob(id: string) {
    setError('')
    const response = await request(`/api/jobs/${id}`, { method: 'DELETE' })
    if (response.status === 204) {
      await refreshJobs()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not delete Job')
  }

  async function onCreateReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/receipts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        warehouseId,
        itemId,
        quantity: Number(quantity),
      }),
    })
    if (response.status === 201) {
      setQuantity('')
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not post Receipt')
  }

  async function onCreateTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/transfers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fromWarehouseId,
        toWarehouseId,
        itemId: transferItemId,
        quantity: Number(transferQuantity),
      }),
    })
    if (response.status === 201) {
      setTransferQuantity('')
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not post Transfer')
  }

  async function onCreateIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await request('/api/issues', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        warehouseId: issueWarehouseId,
        itemId: issueItemId,
        jobId: issueJobId,
        quantity: Number(issueQuantity),
      }),
    })
    if (response.status === 201) {
      setIssueQuantity('')
      await refreshAll()
      return
    }
    const body = (await response.json()) as { error?: string }
    setError(body.error ?? 'Could not post Issue')
  }

  function warehouseNameOf(id: string) {
    return warehouses.find((warehouse) => warehouse.id === id)?.name ?? id
  }

  function itemLabelOf(id: string) {
    const item = items.find((row) => row.id === id)
    return item ? `${item.sku} ${item.name}` : id
  }

  function itemUnitOf(id: string) {
    return items.find((row) => row.id === id)?.unit ?? ''
  }

  function jobNameOf(id: string) {
    return jobs.find((job) => job.id === id)?.name ?? id
  }

  if (!ready) {
    return null
  }

  if (!currentUser) {
    return (
      <main>
        <h1>Sign in</h1>
        <form onSubmit={(event) => void onLogin(event)}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
        {error ? <p role="alert">{error}</p> : null}
      </main>
    )
  }

  return (
    <main>
      <nav>
        <button
          type="button"
          aria-current={screen === 'catalog' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('catalog')
          }}
        >
          Catalog
        </button>
        <button
          type="button"
          aria-current={screen === 'warehouse' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('warehouse')
          }}
        >
          Warehouse
        </button>
        <button
          type="button"
          aria-current={screen === 'job' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('job')
          }}
        >
          Job
        </button>
        <button
          type="button"
          aria-current={screen === 'stock' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('stock')
          }}
        >
          Stock
        </button>
        <button
          type="button"
          aria-current={screen === 'inventory' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('inventory')
          }}
        >
          Inventory
        </button>
        <button
          type="button"
          aria-current={screen === 'users' ? 'page' : undefined}
          onClick={() => {
            setError('')
            setScreen('users')
          }}
        >
          Users
        </button>
        <div className="session">
          <span>{currentUser.email}</span>
          <button type="button" onClick={() => void onLogout()}>
            Logout
          </button>
        </div>
      </nav>

      {screen === 'catalog' ? (
        <>
          <h1>Catálogo</h1>
          <form onSubmit={(event) => void onCreateItem(event)}>
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
                  <button type="button" onClick={() => void onDeleteItem(item.id)}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'warehouse' ? (
        <>
          <h1>Warehouse</h1>
          <form onSubmit={(event) => void onCreateWarehouse(event)}>
            <label>
              Name
              <input
                name="warehouseName"
                value={warehouseName}
                onChange={(event) => setWarehouseName(event.target.value)}
                required
              />
            </label>
            <button type="submit">Create Warehouse</button>
          </form>
          {error ? <p role="alert">{error}</p> : null}
          {warehouses.length === 0 ? (
            <p>No Warehouse yet.</p>
          ) : (
            <ul>
              {warehouses.map((warehouse) => (
                <li className="warehouse" key={warehouse.id}>
                  <span>{warehouse.name}</span>
                  <button type="button" onClick={() => void onDeleteWarehouse(warehouse.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'job' ? (
        <>
          <h1>Job</h1>
          <form onSubmit={(event) => void onCreateJob(event)}>
            <label>
              Name
              <input
                name="jobName"
                value={jobName}
                onChange={(event) => setJobName(event.target.value)}
                required
              />
            </label>
            <button type="submit">Create Job</button>
          </form>
          {error ? <p role="alert">{error}</p> : null}
          {jobs.length === 0 ? (
            <p>No Job yet.</p>
          ) : (
            <ul>
              {jobs.map((job) => (
                <li className="job" key={job.id}>
                  <span>{job.name}</span>
                  <button type="button" onClick={() => void onDeleteJob(job.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'stock' ? (
        <>
          <h1>Stock</h1>
          {error ? <p role="alert">{error}</p> : null}
          {stock.length === 0 ? (
            <p>No Stock yet.</p>
          ) : (
            <ul>
              {stock.map((row) => (
                <li className="stock" key={row.id}>
                  <span>{warehouseNameOf(row.warehouseId)}</span>
                  <span>{itemLabelOf(row.itemId)}</span>
                  <span>
                    {row.quantity} {itemUnitOf(row.itemId)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'inventory' ? (
        <>
          <h1>Inventory</h1>
          <form onSubmit={(event) => void onCreateReceipt(event)}>
            <h2>Receipt</h2>
            <label>
              Warehouse
              <select
                name="receiptWarehouseId"
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Item
              <select
                name="receiptItemId"
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
                required
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                name="receiptQuantity"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>
            <button type="submit">Post Receipt</button>
          </form>
          <form onSubmit={(event) => void onCreateTransfer(event)}>
            <h2>Transfer</h2>
            <label>
              From Warehouse
              <select
                name="fromWarehouseId"
                value={fromWarehouseId}
                onChange={(event) => setFromWarehouseId(event.target.value)}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To Warehouse
              <select
                name="toWarehouseId"
                value={toWarehouseId}
                onChange={(event) => setToWarehouseId(event.target.value)}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Item
              <select
                name="transferItemId"
                value={transferItemId}
                onChange={(event) => setTransferItemId(event.target.value)}
                required
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                name="transferQuantity"
                type="number"
                min="0"
                step="any"
                value={transferQuantity}
                onChange={(event) => setTransferQuantity(event.target.value)}
                required
              />
            </label>
            <button type="submit">Post Transfer</button>
          </form>
          <form onSubmit={(event) => void onCreateIssue(event)}>
            <h2>Issue</h2>
            <label>
              Warehouse
              <select
                name="issueWarehouseId"
                value={issueWarehouseId}
                onChange={(event) => setIssueWarehouseId(event.target.value)}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Item
              <select
                name="issueItemId"
                value={issueItemId}
                onChange={(event) => setIssueItemId(event.target.value)}
                required
              >
                <option value="">Select Item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Job
              <select
                name="issueJobId"
                value={issueJobId}
                onChange={(event) => setIssueJobId(event.target.value)}
                required
              >
                <option value="">Select Job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                name="issueQuantity"
                type="number"
                min="0"
                step="any"
                value={issueQuantity}
                onChange={(event) => setIssueQuantity(event.target.value)}
                required
              />
            </label>
            <button type="submit">Post Issue</button>
          </form>
          {error ? <p role="alert">{error}</p> : null}
          {movements.length === 0 ? (
            <p>No Movement yet.</p>
          ) : (
            <ul>
              {movements.map((movement) => (
                <li className="movement" key={movement.id}>
                  <span>{movement.type}</span>
                  <span>{itemLabelOf(movement.itemId)}</span>
                  <span>
                    {movement.quantity} {itemUnitOf(movement.itemId)}
                  </span>
                  <span>{warehouseNameOf(movement.warehouseId)}</span>
                  <span>
                    {movement.toWarehouseId
                      ? warehouseNameOf(movement.toWarehouseId)
                      : movement.jobId
                        ? jobNameOf(movement.jobId)
                        : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'users' ? (
        <>
          <h1>Users</h1>
          <form onSubmit={(event) => void onCreateUser(event)}>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                required
              />
            </label>
            <label>
              Role
              <select
                name="role"
                value={userRole}
                onChange={(event) => setUserRole(event.target.value as Role)}
                required
              >
                <option value="Operator">Operator</option>
                <option value="Administrator">Administrator</option>
              </select>
            </label>
            <button type="submit">Create User</button>
          </form>
          {error ? <p role="alert">{error}</p> : null}
          {users.length === 0 ? (
            <p>No User yet.</p>
          ) : (
            <ul>
              {users.map((user) => (
                <li className="user" key={user.id}>
                  <span>{user.email}</span>
                  <span>{user.role}</span>
                  <button type="button" onClick={() => void onDeleteUser(user.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  )
}

export default App

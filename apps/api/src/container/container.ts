type Factory<T> = (container: Container) => T

export class Container {
  private readonly factories = new Map<string, Factory<unknown>>()
  private readonly instances = new Map<string, unknown>()

  register<T>(token: string, factory: Factory<T>): void {
    if (this.factories.has(token)) {
      throw new Error(`Already registered: ${token}`)
    }
    this.factories.set(token, factory)
  }

  get<T>(token: string): T {
    const cached = this.instances.get(token)
    if (cached) return cached as T

    const factory = this.factories.get(token)
    if (!factory) {
      throw new Error(`Not registered: ${token}`)
    }

    const instance = factory(this) as T
    this.instances.set(token, instance)
    return instance
  }
}

export const tokens = {
  db: 'db',
} as const

export const container = new Container()

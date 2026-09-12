import { StockRepository, type StockRecord } from '../repositories/stock.repository'

export class StockService {
  constructor(private readonly stock: StockRepository) {}

  list(): Promise<StockRecord[]> | StockRecord[] {
    return this.stock.list()
  }
}

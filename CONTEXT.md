# Fake ERP

ERP de aula para traders/contractors: cadastro mestre de materiais, depois quantidade em depósito e compra.

## Language

**Item**:
Material ou insumo que se compra e se estoca. Existe no cadastro mesmo sem nenhuma quantidade.
_Avoid_: Product, produto, catalog item (como entidade)

**Catálogo**:
A lista mestre de Items. Não tem saldo.
_Avoid_: estoque, inventory, warehouse

**SKU**:
Código estável e único no catálogo que identifica um Item. Não muda quando a quantidade muda.
_Avoid_: id interno como identificador de negócio

**Unidade**:
Como se conta o Item (saco, metro, peça). Nesta fatia, texto no próprio Item.
_Avoid_: UoM como entidade, unit of measure table

**Warehouse**:
Depósito onde uma quantidade de um Item vive. A quantidade pertence aqui, não ao Item.
_Avoid_: estoque no Item, stock no cadastro

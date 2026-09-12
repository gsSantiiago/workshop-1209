# Fake ERP

Classroom ERP for traders/contractors: a master catalog of materials, then quantity in a warehouse and purchase.

## Language

**Item**:
A material or input that is bought and stocked. It exists in the catalog even with no quantity.
_Avoid_: Product, produto, catalog item (as an entity)

**Catalog**:
The master list of Items. It has no balance.
_Avoid_: Catálogo, estoque, inventory, warehouse

**SKU**:
A stable, unique code in the catalog that identifies an Item. It does not change when quantity changes.
_Avoid_: internal id as a business identifier

**Unit**:
How an Item is counted (bag, meter, piece). In this slice, text on the Item itself.
_Avoid_: Unidade, UoM as an entity, unit of measure table

**Warehouse**:
The depot where a quantity of an Item lives. Quantity belongs here, not on the Item.
_Avoid_: stock on the Item, stock in the catalog

**Stock**:
The quantity of one Item in one Warehouse. An Item can have Stock in more than one Warehouse.
_Avoid_: inventory on the Item, balance on the Catalog, estoque

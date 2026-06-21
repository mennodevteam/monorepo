import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { RequiredScopes } from '../auth/scopes.decorator';
import { RequestShop } from './shop.decorator';
import { Shop, Product, Order, FilterOrderDto, ProductCategory, Member, FilterMemberV2Dto, Material, BillOfMaterial, BillOfProduct, InventoryTransaction, MenuCost, PurchaseInvoice, PurchaseInvoiceItem } from '@menno/types';
import { ShopIntegrationService } from './shop-integration.service';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('api/v1/shop-integration')
export class ShopIntegrationController {
  constructor(private readonly integrationService: ShopIntegrationService) {}

  @Get('openapi.json')
  getOpenApiSchema() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Shottt Vendor Integration API',
        description: `Secure REST API to read and manage vendor data (items, menu, orders, and reports) on behalf of a store.

### Product Availability & Status Hierarchy Rules:
Product availability is determined by a hierarchical structure: \`Category > Product > Variant\`.
1. **Status Fields**: Category, Product, and Variant each have their own \`status\` field (\`0: Inactive\`, \`1: Active\`, \`2: Pending\`, \`3: Blocked\`).
2. **Parent Inactivity Propagation**: If a parent category status is \`Inactive (0)\`, all products and their variants under that category are automatically considered inactive/unavailable, regardless of their own individual status fields.
3. **Product Inactivity Propagation**: If a product status is \`Inactive (0)\` or \`Blocked (3)\`, all of its variants are automatically considered inactive/unavailable.
4. **Availability Rule**: A product is considered unavailable if its status is \`Inactive (0)\` or \`Blocked (3)\`, or if its stock is \`0\`. For products with variants, it is unavailable if all variants are inactive, blocked, or out of stock.

### Menu Costs, Taxes & Dynamic Pricing Rules:
\`MenuCost\` items define how taxes, service charges, surcharges, and discounts are applied.
1. **Status & Validity Filter**: Only active menu costs (\`status: 1\`) within their valid date range (\`fromDate\` to \`toDate\`) and matching the order's \`orderType\` must be applied.
2. **Discounts Representation**: Discounts are defined as negative values (e.g., a \`percentageCost\` of \`-10\` means a 10% discount, and a \`fixedCost\` of \`-5000\` means a 5000 fixed discount).
3. **Item-Level Costs (\`showOnItem: true\`)**:
   - Applies directly to individual product/variant base prices.
   - Surcharges (positive percentage/fixed) increase the item price.
   - Discounts (negative percentage/fixed) decrease the item price.
   - Used for calculating dynamic item-level pricing: \`totalPrice\` (post-discount) and \`realPrice\` (pre-discount).
4. **Global/Order-Level Costs (\`showOnItem: false\`)**:
   - Calculated on the sum of all item prices after applying item-level costs.
   - Applied globally on the order total as separate line items (abstract items) on the invoice.
5. **Association Rules**:
   - A menu cost is global if \`includeProductCategory\` and \`includeProduct\` are both empty.
   - If \`includeProductCategory\` is specified, the cost applies only to items under those categories.
   - If \`includeProduct\` is specified, the cost applies only to those specific products.

### Critical Safety & Confirmation Rules:
To protect database integrity and prevent unintended customer communications, the AI agent MUST strictly follow these rules:
1. **Data Modifications (Create, Update, Delete)**: Whenever invoking any write or deletion tool/endpoint (e.g., adding/modifying products, categories, menu costs, inventory adjustments, or changing order states), you **MUST** summarize the planned changes clearly to the user (detailing target items, fields, and values) and ask for explicit confirmation (e.g., asking "Should I proceed with these changes?"). Do not invoke the tool until the user responds with approval.
2. **Sending SMS Messages**: Before calling the customer message tool/endpoint (\`POST /customers/messages\`), you **MUST** explain exactly how many recipients, their names/phone numbers (or the target filter), and the exact message body being sent, and get explicit user approval before executing the tool.`,
        version: '1.0.0',
      },
      servers: [
        {
          url: '/api/v1/shop-integration',
          description: 'Default Integration Base URL',
        },
      ],
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Shop-API-Key',
            description: 'Authentication token generated in the Vendor Panel under Settings > Developer API',
          },
        },
        schemas: {
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'number' },
              description: { type: 'string', nullable: true },
              category: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                },
                required: ['id'],
              },
            },
          },
          Order: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              qNumber: { type: 'number' },
              state: { type: 'number', description: '0: Pending, 1: Accepted, 2: Rejected, 3: Completed, 4: Canceled' },
              type: { type: 'number', description: '0: TakeAway, 1: DineIn, 2: Delivery' },
              totalPrice: { type: 'number' },
              note: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          ProductCategory: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              status: { type: 'integer', description: '0: Inactive, 1: Active' },
              slug: { type: 'string', nullable: true },
              position: { type: 'number', nullable: true },
            },
            required: ['title'],
          },
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              joinedAt: { type: 'string', format: 'date-time' },
              star: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  mobilePhone: { type: 'string' },
                  firstName: { type: 'string', nullable: true },
                  lastName: { type: 'string', nullable: true },
                },
                required: ['mobilePhone'],
              },
            },
          },
          FilterCustomer: {
            type: 'object',
            properties: {
              query: { type: 'string', nullable: true },
              joinedAtFromDate: { type: 'string', format: 'date-time', nullable: true },
              joinedAtToDate: { type: 'string', format: 'date-time', nullable: true },
              fromStar: { type: 'number', nullable: true },
              toStar: { type: 'number', nullable: true },
              minOrderCount: { type: 'number', nullable: true },
              maxOrderCount: { type: 'number', nullable: true },
              sortBy: { type: 'string', enum: ['joinedAt', 'firstOrder', 'lastOrder', 'lastVisit', 'totalOrderCount', 'totalOrderSum', 'star', 'wallet'], default: 'joinedAt' },
              sortType: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
              take: { type: 'number', default: 20 },
              skip: { type: 'number', default: 0 },
            },
          },
          Material: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              stock: { type: 'number' },
              cost: { type: 'number', nullable: true },
              unit: { type: 'string', description: 'Unit of measurement' },
            },
            required: ['title', 'unit'],
          },
          BillOfMaterial: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              material: { $ref: '#/components/schemas/Material' },
              product: { type: 'object', properties: { id: { type: 'string' } } },
              variant: { type: 'object', properties: { id: { type: 'string' } }, nullable: true },
              quantity: { type: 'number' },
            },
            required: ['material', 'product', 'quantity'],
          },
          BillOfProduct: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productSource: { type: 'object', properties: { id: { type: 'string' } } },
              variantSource: { type: 'object', properties: { id: { type: 'string' } }, nullable: true },
              product: { type: 'object', properties: { id: { type: 'string' } } },
              variant: { type: 'object', properties: { id: { type: 'string' } }, nullable: true },
              quantity: { type: 'number' },
            },
            required: ['productSource', 'product', 'quantity'],
          },
          InventoryTransaction: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              material: { type: 'object', properties: { id: { type: 'string' } } },
              type: { type: 'integer', description: '0: Consumption, 1: Purchase, 2: Adjustment' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number', nullable: true },
              costUpdateStrategy: { type: 'integer', description: '0: Average, 1: Last, 2: Manual, 3: None' },
            },
            required: ['material', 'type', 'quantity'],
          },
          PurchaseInvoice: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              supplier: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PurchaseInvoiceItem',
                },
              },
            },
            required: ['items'],
          },
          PurchaseInvoiceItem: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              material: { type: 'object', properties: { id: { type: 'string' } } },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              costUpdateStrategy: { type: 'string', enum: ['average', 'last', 'current'] },
              previousStock: { type: 'number', nullable: true },
              previousCost: { type: 'number', nullable: true },
            },
            required: ['material', 'quantity', 'unitPrice'],
          },
          MenuCost: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              percentageCost: { type: 'number', description: 'Percentage of charge. Can be negative for percentage discounts (e.g. -10 for 10% discount).' },
              fixedCost: { type: 'number', description: 'Fixed amount of charge. Can be negative for fixed discounts.' },
              showOnItem: { type: 'boolean', description: 'If true, the cost/discount is applied directly to each item price. If false, it is calculated globally on the total order sum.' },
              orderTypes: {
                type: 'array',
                items: { type: 'integer', description: '0: DineIn, 1: Delivery, 2: Takeaway' },
              },
              fromDate: { type: 'string', format: 'date-time', nullable: true },
              toDate: { type: 'string', format: 'date-time', nullable: true },
              status: { type: 'integer', description: '0: Inactive, 1: Active, 2: Pending, 3: Blocked' },
              includeProductCategory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'integer' } },
                  required: ['id'],
                },
                description: 'Product Category IDs to apply this cost to. If empty, applies to all unless specific products are selected.',
                nullable: true,
              },
              includeProduct: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                  required: ['id'],
                },
                description: 'Product IDs to apply this cost to. If empty, applies to all unless specific categories are selected.',
                nullable: true,
              },
            },
            required: ['title'],
          },
        },
      },
      paths: {
        '/menu': {
          get: {
            summary: 'Retrieve menu structure',
            description: 'Returns the full list of product categories, products, variant options, pricing, and stock status. Note: Evaluate item availability and dynamic prices/discounts based on the parent-child status propagation and MenuCost rules defined in the API description. Required scope: menu:read',
            responses: {
              200: {
                description: 'Successful Response',
              },
            },
          },
        },
        '/menu/products': {
          post: {
            summary: 'Create a new product',
            description: 'Adds a new product to a category on the menu. Required scope: menu:write',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
            responses: {
              201: {
                description: 'Product created successfully',
              },
            },
          },
        },
        '/menu/products/{id}': {
          put: {
            summary: 'Update an existing product',
            description: 'Modifies fields (such as price, stock, description) of an existing product. Required scope: menu:write',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
            responses: {
              200: {
                description: 'Product updated successfully',
              },
            },
          },
        },
        '/orders': {
          get: {
            summary: 'List and filter orders',
            description: 'Returns the list of orders with filters for dates and states. Required scope: orders:read',
            parameters: [
              { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
              { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
              { name: 'states', in: 'query', schema: { type: 'array', items: { type: 'integer' } } },
              { name: 'take', in: 'query', schema: { type: 'integer', default: 20 } },
              { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
            ],
            responses: {
              200: {
                description: 'List of orders matching query filters',
              },
            },
          },
        },
        '/orders/{id}/state': {
          patch: {
            summary: 'Update order status',
            description: 'Updates the order state (e.g. accepts, rejects, or completes the order). Required scope: orders:write',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      state: { type: 'integer', description: '0: Pending, 1: Accepted, 2: Rejected, 3: Completed, 4: Canceled' },
                    },
                    required: ['state'],
                  },
                },
              },
            },
            responses: {
              200: {
                description: 'Order state updated successfully',
              },
            },
          },
        },
        '/reports/sales': {
          get: {
            summary: 'Get sales report',
            description: 'Aggregates sales revenue statistics grouped by day, payment type, or category. Required scope: reports:read',
            parameters: [
              { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
              { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
              { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['date', 'payment', 'state', 'type', 'category', 'product'], default: 'date' } },
            ],
            responses: {
              200: {
                description: 'Aggregated financial sales summary',
              },
            },
          },
        },
        '/menu/categories': {
            post: {
              summary: 'Create a new product category',
              description: 'Adds a new category for products on the menu. Required scope: menu:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ProductCategory',
                    },
                  },
                },
              },
              responses: {
                201: {
                  description: 'Product category created successfully',
                },
              },
            },
          },
          '/menu/categories/{id}': {
            put: {
              summary: 'Update an existing product category',
              description: 'Modifies fields of an existing product category. Required scope: menu:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ProductCategory',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Product category updated successfully',
                },
              },
            },
          },
          '/customers': {
            get: {
              summary: 'List customers',
              description: 'Returns the list of customers in the vendor club with basic filters. Required scope: customers:read',
              parameters: [
                { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
                { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
                { name: 'query', in: 'query', schema: { type: 'string' }, description: 'Search term for name or phone' },
                { name: 'take', in: 'query', schema: { type: 'integer', default: 20 } },
                { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
              ],
              responses: {
                200: {
                  description: 'List of customers matching query filters',
                },
              },
            },
            post: {
              summary: 'Create or update a customer',
              description: 'Saves or updates a customer profile (member) in the vendor club. Required scope: customers:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Customer',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Customer saved successfully',
                },
              },
            },
          },
          '/customers/filter': {
            post: {
              summary: 'Filter customers with rich query',
              description: 'Returns a detailed list of customers in the vendor club using a rich query schema. Required scope: customers:read',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/FilterCustomer',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Filtered list of customers',
                },
              },
            },
          },
          '/customers/messages': {
            post: {
              summary: 'Send SMS to customers',
              description: 'Sends arbitrary SMS text messages to a list of customer mobile numbers, or to all customers matching a filter. Required scope: sms:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        receptors: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'List of mobile phone numbers',
                        },
                        message: {
                          type: 'string',
                          description: 'SMS message text content',
                        },
                        filter: {
                          $ref: '#/components/schemas/FilterCustomer',
                          description: 'Filter parameters to target a group of customers',
                        },
                      },
                      required: ['message'],
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Messages sent successfully',
                },
              },
            },
          },
          '/inventory/materials': {
            get: {
              summary: 'List raw materials',
              description: 'Returns the full list of raw materials for the store. Required scope: inventory:read',
              responses: {
                200: {
                  description: 'Successful Response',
                },
              },
            },
            post: {
              summary: 'Create or update a raw material',
              description: 'Adds or updates a raw material definition. Required scope: inventory:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Material',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Material saved successfully',
                },
              },
            },
          },
          '/inventory/materials/{id}': {
            delete: {
              summary: 'Delete a raw material',
              description: 'Deletes a raw material definition. Required scope: inventory:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                200: {
                  description: 'Material deleted successfully',
                },
              },
            },
          },
          '/inventory/boms': {
            get: {
              summary: 'List BOM recipes',
              description: 'Returns the Bill of Materials (BOM) configurations. Required scope: inventory:read',
              responses: {
                200: {
                  description: 'Successful Response',
                },
              },
            },
            post: {
              summary: 'Create or update a BOM configuration',
              description: 'Saves a Bill of Materials entry linking a material to a product. Required scope: inventory:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/BillOfMaterial',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'BOM configuration saved successfully',
                },
              },
            },
          },
          '/inventory/boms/{id}': {
            delete: {
              summary: 'Delete a BOM configuration',
              description: 'Deletes a BOM recipe entry. Required scope: inventory:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                200: {
                  description: 'BOM entry deleted successfully',
                },
              },
            },
          },
          '/inventory/bops': {
            get: {
              summary: 'List BOP recipe links',
              description: 'Returns Bill of Product (BOP) ingredient configurations. Required scope: inventory:read',
              responses: {
                200: {
                  description: 'Successful Response',
                },
              },
            },
            post: {
              summary: 'Create or update a BOP configuration',
              description: 'Saves a Bill of Product recipe linking a product as an ingredient of another product. Required scope: inventory:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/BillOfProduct',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'BOP configuration saved successfully',
                },
              },
            },
          },
          '/inventory/bops/{id}': {
            delete: {
              summary: 'Delete a BOP recipe link',
              description: 'Deletes a BOP recipe entry. Required scope: inventory:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              responses: {
                200: {
                  description: 'BOP entry deleted successfully',
                },
              },
            },
          },
          '/inventory/transactions': {
            post: {
              summary: 'Create an inventory transaction',
              description: 'Logs a stock adjustment, purchase, or consumption transaction, updating the material stock. Required scope: inventory:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/InventoryTransaction',
                    },
                  },
                },
              },
              responses: {
                201: {
                  description: 'Transaction logged and stock updated successfully',
                },
              },
            },
          },
          '/inventory/purchase-invoices': {
            get: {
              summary: 'Retrieve purchase invoices history',
              description: 'Returns the full list of purchase invoices registered for this shop. Required scope: inventory:read',
              responses: {
                200: {
                  description: 'Successful Response',
                },
              },
            },
            post: {
              summary: 'Create a purchase invoice',
              description: 'Registers a new purchase invoice, updating material stock quantities and unit costs in the warehouse. Required scope: inventory:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/PurchaseInvoice',
                    },
                  },
                },
              },
              responses: {
                201: {
                  description: 'Purchase invoice created and stock/costs updated successfully',
                },
              },
            },
          },
          '/inventory/purchase-invoices/{id}': {
            delete: {
              summary: 'Delete a purchase invoice',
              description: 'Deletes a purchase invoice history. Optional query parameter `revertStock` can be set to true to decrement material stock and revert cost. Required scope: inventory:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
                {
                  name: 'revertStock',
                  in: 'query',
                  required: false,
                  schema: { type: 'boolean', default: false },
                },
              ],
              responses: {
                200: {
                  description: 'Purchase invoice deleted successfully',
                },
              },
            },
          },
          '/inventory/profit': {
            get: {
              summary: 'Get cost price and profit per product',
              description: 'Calculates the real-time material cost price, sales price, gross profit, and profit margin percent for each product and variant on the menu. Required scope: inventory:read',
              responses: {
                200: {
                  description: 'Successful Response returning product profit sheet',
                },
              },
            },
          },
          '/inventory/costs': {
            get: {
              summary: 'List menu costs (discounts, taxes, surcharges)',
              description: 'Returns the full list of menu costs, taxes, service charges, and discounts. Required scope: menu:read',
              responses: {
                200: {
                  description: 'Successful Response',
                },
              },
            },
            post: {
              summary: 'Create or update a menu cost/discount',
              description: 'Creates a new menu cost or updates an existing one (tax, service fee, discount, surcharge). Required scope: menu:write',
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/MenuCost',
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'Menu cost saved successfully',
                },
              },
            },
          },
          '/inventory/costs/{id}': {
            delete: {
              summary: 'Delete a menu cost/discount',
              description: 'Deletes a menu cost (tax, service fee, or discount). Required scope: menu:write',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'integer' },
                },
              ],
              responses: {
                200: {
                  description: 'Menu cost deleted successfully',
                },
              },
            },
          },
      },
    };
  }

  @Get('menu')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:read')
  async getMenu(@RequestShop() shop: Shop) {
    return this.integrationService.getMenu(shop.id);
  }

  @Post('menu/products')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async createProduct(@RequestShop() shop: Shop, @Body() dto: Partial<Product>) {
    return this.integrationService.createProduct(shop.id, dto);
  }

  @Put('menu/products/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async updateProduct(@RequestShop() shop: Shop, @Param('id') id: string, @Body() dto: Partial<Product>) {
    return this.integrationService.updateProduct(shop.id, id, dto);
  }

  @Get('orders')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('orders:read')
  async getOrders(
    @RequestShop() shop: Shop,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('states') statesStr?: string,
    @Query('take') takeStr?: string,
    @Query('skip') skipStr?: string,
  ) {
    const filters: FilterOrderDto = {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      states: statesStr ? statesStr.split(',').map(Number) : undefined,
      take: takeStr ? Number(takeStr) : 20,
      skip: skipStr ? Number(skipStr) : 0,
    };
    return this.integrationService.getOrders(shop.id, filters);
  }

  @Patch('orders/:id/state')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('orders:write')
  async updateOrderState(
    @RequestShop() shop: Shop,
    @Param('id') id: string,
    @Body('state') state: number,
  ) {
    return this.integrationService.updateOrderState(shop.id, id, state);
  }

  @Get('reports/sales')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('reports:read')
  async getSalesReport(
    @RequestShop() shop: Shop,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.integrationService.getSalesReport(shop.id, { fromDate, toDate, groupBy });
  }

  @Post('menu/categories')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async createCategory(@RequestShop() shop: Shop, @Body() dto: Partial<ProductCategory>) {
    return this.integrationService.createCategory(shop.id, dto);
  }

  @Put('menu/categories/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async updateCategory(@RequestShop() shop: Shop, @Param('id') id: string, @Body() dto: Partial<ProductCategory>) {
    return this.integrationService.updateCategory(shop.id, Number(id), dto);
  }

  @Get('customers')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('customers:read')
  async getCustomers(
    @RequestShop() shop: Shop,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('query') query?: string,
    @Query('take') takeStr?: string,
    @Query('skip') skipStr?: string,
  ) {
    const filters: FilterMemberV2Dto = {
      joinedAtFromDate: fromDate ? new Date(fromDate) : undefined,
      joinedAtToDate: toDate ? new Date(toDate) : undefined,
      query,
      take: takeStr ? Number(takeStr) : 20,
      skip: skipStr ? Number(skipStr) : 0,
    };
    return this.integrationService.getCustomers(shop.id, filters);
  }

  @Post('customers/filter')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('customers:read')
  async filterCustomers(@RequestShop() shop: Shop, @Body() dto: FilterMemberV2Dto) {
    return this.integrationService.getCustomers(shop.id, dto);
  }

  @Post('customers')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('customers:write')
  async createOrUpdateCustomer(@RequestShop() shop: Shop, @Body() dto: Partial<Member>) {
    return this.integrationService.createOrUpdateCustomer(shop.id, dto);
  }

  @Post('customers/messages')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('sms:write')
  async sendCustomerSms(
    @RequestShop() shop: Shop,
    @Body() dto: { receptors?: string[]; message: string; filter?: FilterMemberV2Dto },
  ) {
    return this.integrationService.sendCustomerSms(shop.id, dto);
  }

  // Inventory: Materials
  @Get('inventory/materials')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:read')
  async getMaterials(@RequestShop() shop: Shop) {
    return this.integrationService.getMaterials(shop.id);
  }

  @Post('inventory/materials')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async createMaterial(@RequestShop() shop: Shop, @Body() dto: Partial<Material>) {
    return this.integrationService.createOrUpdateMaterial(shop.id, dto);
  }

  @Delete('inventory/materials/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async deleteMaterial(@RequestShop() shop: Shop, @Param('id') id: string) {
    return this.integrationService.deleteMaterial(shop.id, id);
  }

  // Inventory: BOM
  @Get('inventory/boms')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:read')
  async getBoms(@RequestShop() shop: Shop) {
    return this.integrationService.getBoms(shop.id);
  }

  @Post('inventory/boms')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async createBom(@RequestShop() shop: Shop, @Body() dto: Partial<BillOfMaterial>) {
    return this.integrationService.createOrUpdateBom(shop.id, dto);
  }

  @Delete('inventory/boms/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async deleteBom(@RequestShop() shop: Shop, @Param('id') id: string) {
    return this.integrationService.deleteBom(shop.id, id);
  }

  // Inventory: BOP
  @Get('inventory/bops')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:read')
  async getBops(@RequestShop() shop: Shop) {
    return this.integrationService.getBops(shop.id);
  }

  @Post('inventory/bops')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async createBop(@RequestShop() shop: Shop, @Body() dto: Partial<BillOfProduct>) {
    return this.integrationService.createOrUpdateBop(shop.id, dto);
  }

  @Delete('inventory/bops/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async deleteBop(@RequestShop() shop: Shop, @Param('id') id: string) {
    return this.integrationService.deleteBop(shop.id, id);
  }

  // Inventory: Transactions
  @Post('inventory/transactions')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async createInventoryTransaction(@RequestShop() shop: Shop, @Body() dto: Partial<InventoryTransaction>) {
    return this.integrationService.createInventoryTransaction(shop.id, dto);
  }

  @Get('inventory/profit')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:read')
  async getProductCostsAndProfit(@RequestShop() shop: Shop) {
    return this.integrationService.getProductCostsAndProfit(shop.id);
  }

  @Get('inventory/costs')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:read')
  async getMenuCosts(@RequestShop() shop: Shop) {
    return this.integrationService.getMenuCosts(shop.id);
  }

  @Post('inventory/costs')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async createOrUpdateMenuCost(@RequestShop() shop: Shop, @Body() dto: Partial<MenuCost>) {
    return this.integrationService.createOrUpdateMenuCost(shop.id, dto);
  }

  @Delete('inventory/costs/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('menu:write')
  async deleteMenuCost(@RequestShop() shop: Shop, @Param('id') id: string) {
    return this.integrationService.deleteMenuCost(shop.id, Number(id));
  }

  // Inventory: Purchase Invoices
  @Get('inventory/purchase-invoices')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:read')
  async getPurchaseInvoices(@RequestShop() shop: Shop) {
    return this.integrationService.getPurchaseInvoices(shop.id);
  }

  @Post('inventory/purchase-invoices')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async createPurchaseInvoice(@RequestShop() shop: Shop, @Body() dto: Partial<PurchaseInvoice>) {
    return this.integrationService.createPurchaseInvoice(shop.id, dto);
  }

  @Delete('inventory/purchase-invoices/:id')
  @UseGuards(ApiKeyAuthGuard)
  @RequiredScopes('inventory:write')
  async deletePurchaseInvoice(
    @RequestShop() shop: Shop,
    @Param('id') id: string,
    @Query('revertStock') revertStock: string,
  ) {
    const revert = revertStock === 'true';
    return this.integrationService.deletePurchaseInvoice(shop.id, id, revert);
  }
}

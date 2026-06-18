import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { RequiredScopes } from '../auth/scopes.decorator';
import { RequestShop } from './shop.decorator';
import { Shop, Product, Order, FilterOrderDto } from '@menno/types';
import { ShopIntegrationService } from './shop-integration.service';

@Controller('api/v1/shop-integration')
export class ShopIntegrationController {
  constructor(private readonly integrationService: ShopIntegrationService) {}

  @Get('openapi.json')
  getOpenApiSchema() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Menno Shop Integration API',
        description: 'Secure REST API to read and manage shop data (items, menu, orders, and reports) on behalf of a store.',
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
            description: 'Authentication token generated in the Shop Panel under Settings > Developer API',
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
        },
      },
      paths: {
        '/menu': {
          get: {
            summary: 'Retrieve menu structure',
            description: 'Returns the full list of product categories, products, variant options, pricing, and stock status. Required scope: menu:read',
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
}

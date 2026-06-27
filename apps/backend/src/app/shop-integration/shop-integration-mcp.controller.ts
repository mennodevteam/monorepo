import { Controller, Get, Post, Query, Headers, Req, Res, UnauthorizedException, NotFoundException, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response } from 'express';
import { ShopApiKey, Shop } from '@menno/types';
import { ShopIntegrationService } from './shop-integration.service';
import * as crypto from 'crypto';

interface McpSession {
  res: Response;
  shop: Shop;
}

@Controller('api/v1/shop-integration/mcp')
export class ShopIntegrationMcpController {
  private sessions = new Map<string, McpSession>();

  constructor(
    private readonly integrationService: ShopIntegrationService,
    @InjectRepository(ShopApiKey)
    private readonly apiKeyRepo: Repository<ShopApiKey>,
  ) {
    // Keep-alive ping for active SSE sessions every 30 seconds
    setInterval(() => {
      for (const [sessionId, session] of this.sessions.entries()) {
        try {
          session.res.write(':\n\n');
        } catch (err) {
          console.error(`Failed to ping session ${sessionId}:`, err);
          this.sessions.delete(sessionId);
        }
      }
    }, 30000);
  }

  /**
   * 1. Streamable HTTP Endpoint (POST)
   * Directly processes JSON-RPC requests and returns the response in the HTTP body.
   * Best for modern clients (like Cursor) with type: "http".
   */
  @Post()
  async handleStreamableHttp(
    @Query('apiKey') queryApiKey: string,
    @Headers('x-shop-api-key') headerApiKey: string,
    @Body() body: any,
  ) {
    const token = (headerApiKey || queryApiKey || '').trim();
    if (!token) {
      throw new UnauthorizedException('API key is missing');
    }

    const shop = await this.authenticateToken(token);

    const { id, method, params } = body;
    let responseResult: any = null;
    let responseError: any = null;

    try {
      if (method === 'initialize') {
        responseResult = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'Shottt MCP Server',
            version: '1.0.0',
          },
        };
      } else if (method === 'notifications/initialized') {
        return { jsonrpc: '2.0', result: null };
      } else if (method === 'tools/list') {
        responseResult = {
          tools: this.getToolsList(),
        };
      } else if (method === 'tools/call') {
        const name = params?.name;
        const args = params?.arguments || {};
        const result = await this.executeTool(name, args, shop);
        responseResult = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } else {
        responseError = {
          code: -32601,
          message: `Method not found: ${method}`,
        };
      }
    } catch (err: any) {
      console.error('Error executing MCP method:', err);
      responseError = {
        code: -32603,
        message: err.message || 'Internal error',
      };
    }

    const jsonRpcResponse: any = {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
    };

    if (responseError) {
      jsonRpcResponse.error = responseError;
    } else {
      jsonRpcResponse.result = responseResult;
    }

    return jsonRpcResponse;
  }

  /**
   * 2. SSE Connection Endpoint (GET)
   * Starts a persistent Server-Sent Events connection.
   */
  @Get('sse')
  async sse(
    @Query('apiKey') queryApiKey: string,
    @Headers('x-shop-api-key') headerApiKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = (headerApiKey || queryApiKey || '').trim();
    if (!token) {
      throw new UnauthorizedException('API key is missing');
    }

    const shop = await this.authenticateToken(token);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, { res, shop });

    // Send the endpoint notification event as per MCP SSE Transport Spec
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const messageUrl = `${baseUrl}/api/v1/shop-integration/mcp/messages?sessionId=${sessionId}`;

    res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);

    req.on('close', () => {
      this.sessions.delete(sessionId);
    });
  }

  /**
   * 3. SSE Messages Endpoint (POST)
   * Receives JSON-RPC requests for an active SSE session and streams response back via SSE.
   */
  @Post('messages')
  async messages(
    @Query('sessionId') sessionId: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found or expired');
    }

    const { id, method, params } = body;
    let responseResult: any = null;
    let responseError: any = null;

    try {
      if (method === 'initialize') {
        responseResult = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'Shottt MCP Server',
            version: '1.0.0',
          },
        };
      } else if (method === 'notifications/initialized') {
        return res.status(202).end();
      } else if (method === 'tools/list') {
        responseResult = {
          tools: this.getToolsList(),
        };
      } else if (method === 'tools/call') {
        const name = params?.name;
        const args = params?.arguments || {};
        const result = await this.executeTool(name, args, session.shop);
        responseResult = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } else {
        responseError = {
          code: -32601,
          message: `Method not found: ${method}`,
        };
      }
    } catch (err: any) {
      console.error('Error executing MCP method:', err);
      responseError = {
        code: -32603,
        message: err.message || 'Internal error',
      };
    }

    const jsonRpcResponse: any = {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
    };

    if (responseError) {
      jsonRpcResponse.error = responseError;
    } else {
      jsonRpcResponse.result = responseResult;
    }

    session.res.write(`event: message\ndata: ${JSON.stringify(jsonRpcResponse)}\n\n`);
    res.status(200).end();
  }

  private async authenticateToken(token: string): Promise<Shop> {
    const hashedKey = crypto.createHash('sha256').update(token).digest('hex');
    const apiKeyRecord = await this.apiKeyRepo.findOne({
      where: { hashedKey },
      relations: ['shop'],
    });

    if (!apiKeyRecord || !apiKeyRecord.shop) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Update lastUsedAt in background
    this.apiKeyRepo.update(apiKeyRecord.id, { lastUsedAt: new Date() }).catch((err) => {
      console.error('Failed to update API key lastUsedAt:', err);
    });

    return apiKeyRecord.shop;
  }

  private getToolsList() {
    return [
      {
        name: 'get_menu',
        description: 'دریافت منوی کامل فروشگاه شامل محصولات، دسته‌بندی‌ها و متغیرها.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_product',
        description: 'ایجاد یک محصول جدید در منوی فروشگاه.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'عنوان محصول' },
            price: { type: 'number', description: 'قیمت محصول به تومان' },
            description: { type: 'string', description: 'توضیحات محصول' },
            status: { type: 'number', description: 'وضعیت (0: غیرفعال، 1: فعال)' },
            category: {
              type: 'object',
              properties: { id: { type: 'number', description: 'شناسه دسته‌بندی' } },
              required: ['id'],
            },
          },
          required: ['title', 'price', 'category'],
        },
      },
      {
        name: 'update_product',
        description: 'ویرایش اطلاعات یک محصول موجود.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'شناسه محصول' },
            title: { type: 'string', description: 'عنوان جدید' },
            price: { type: 'number', description: 'قیمت جدید به تومان' },
            description: { type: 'string', description: 'توضیحات جدید' },
            status: { type: 'number', description: 'وضعیت جدید (0: غیرفعال، 1: فعال)' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_orders',
        description: 'لیست و فیلتر سفارشات فروشگاه بر اساس تاریخ و وضعیت.',
        inputSchema: {
          type: 'object',
          properties: {
            fromDate: { type: 'string', format: 'date-time', description: 'تاریخ شروع' },
            toDate: { type: 'string', format: 'date-time', description: 'تاریخ پایان' },
            states: { type: 'array', items: { type: 'number' }, description: 'وضعیت‌های سفارش (0: لغو شده، 1: در انتظار، 2: در حال آماده‌سازی، 3: ارسال شده، 4: تکمیل شده، 5: آماده)' },
            take: { type: 'number', default: 20 },
            skip: { type: 'number', default: 0 },
          },
        },
      },
      {
        name: 'create_order',
        description: 'ثبت سفارش دستی جدید برای مشتری.',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'شناسه مشتری در باشگاه مشتریان' },
            extraCosts: { type: 'number', description: 'هزینه ارسال یا هزینه‌های اضافی به تومان' },
            manualDiscount: { type: 'number', description: 'تخفیف دستی به تومان' },
            paymentType: { type: 'number', description: 'نوع پرداخت (0: پرداخت نشده، 1: آنلاین، 2: نقدی، 3: کیف پول)' },
            note: { type: 'string', description: 'یادداشت سفارش' },
            productItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  productVariantId: { type: 'number' },
                  quantity: { type: 'number' },
                },
                required: ['productId', 'quantity'],
              },
            },
          },
          required: ['productItems'],
        },
      },
      {
        name: 'update_order_state',
        description: 'تغییر وضعیت یک سفارش مشخص (تایید، ارسال، تکمیل و غیره).',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'شناسه سفارش' },
            state: { type: 'number', description: 'وضعیت جدید (0: لغو شده، 1: در انتظار، 2: در حال آماده‌سازی، 3: ارسال شده، 4: تکمیل شده، 5: آماده)' },
          },
          required: ['id', 'state'],
        },
      },
      {
        name: 'get_sales_report',
        description: 'دریافت گزارش فروش فروشگاه در یک بازه زمانی.',
        inputSchema: {
          type: 'object',
          properties: {
            fromDate: { type: 'string', format: 'date-time', description: 'تاریخ شروع' },
            toDate: { type: 'string', format: 'date-time', description: 'تاریخ پایان' },
            groupBy: { type: 'string', enum: ['date', 'payment', 'state', 'type', 'category', 'product'], default: 'date' },
          },
        },
      },
      {
        name: 'list_customers',
        description: 'لیست مشتریان فروشگاه.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'جستجو بر اساس نام یا شماره موبایل' },
            take: { type: 'number', default: 20 },
            skip: { type: 'number', default: 0 },
          },
        },
      },
      {
        name: 'filter_customers',
        description: 'فیلتر پیشرفته مشتریان بر اساس تاریخ عضویت، ستاره، میزان خرید و غیره.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            minOrderCount: { type: 'number' },
            maxOrderCount: { type: 'number' },
            fromStar: { type: 'number' },
            toStar: { type: 'number' },
          },
        },
      },
      {
        name: 'send_sms_to_customers',
        description: 'ارسال پیامک گروهی به مشتریان.',
        inputSchema: {
          type: 'object',
          properties: {
            receptors: { type: 'array', items: { type: 'string' }, description: 'لیست شماره‌های موبایل گیرندگان' },
            message: { type: 'string', description: 'متن پیامک' },
          },
          required: ['message'],
        },
      },
      {
        name: 'list_materials',
        description: 'لیست مواد اولیه موجود در انبار.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'create_or_update_material',
        description: 'ایجاد یا ویرایش ماده اولیه در انبار.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'شناسه (برای ویرایش)' },
            name: { type: 'string', description: 'نام ماده اولیه' },
            stock: { type: 'number', description: 'موجودی فعلی' },
            cost: { type: 'number', description: 'هزینه واحد به تومان' },
            unit: { type: 'string', enum: ['count', 'gram', 'kg', 'liter', 'ml'], description: 'واحد اندازه گیری' },
          },
          required: ['name', 'unit'],
        },
      },
      {
        name: 'create_inventory_transaction',
        description: 'ثبت تراکنش انبار (خرید، مصرف، اصلاح موجودی).',
        inputSchema: {
          type: 'object',
          properties: {
            materialId: { type: 'string', description: 'شناسه ماده اولیه' },
            type: { type: 'string', enum: ['purchase', 'consumption', 'adjustment'], description: 'نوع تراکنش' },
            quantity: { type: 'number', description: 'مقدار تراکنش' },
            unitPrice: { type: 'number', description: 'قیمت واحد (فقط برای خرید)' },
            costUpdateStrategy: { type: 'string', enum: ['average', 'last', 'current'], default: 'average' },
            note: { type: 'string', description: 'یادداشت' },
          },
          required: ['materialId', 'type', 'quantity'],
        },
      },
      {
        name: 'list_menu_costs',
        description: 'لیست هزینه‌های جانبی منو (مالیات، سرویس، تخفیف).',
        inputSchema: { type: 'object', properties: {} },
      },
    ];
  }

  private async executeTool(name: string, args: any, shop: Shop): Promise<any> {
    switch (name) {
      case 'get_menu':
        return this.integrationService.getMenu(shop.id);

      case 'create_product':
        return this.integrationService.createProduct(shop.id, args);

      case 'update_product': {
        const { id, ...dto } = args;
        return this.integrationService.updateProduct(shop.id, id, dto);
      }

      case 'get_orders': {
        const filters = {
          fromDate: args.fromDate ? new Date(args.fromDate) : undefined,
          toDate: args.toDate ? new Date(args.toDate) : undefined,
          states: args.states,
          take: args.take ? Number(args.take) : 20,
          skip: args.skip ? Number(args.skip) : 0,
        };
        return this.integrationService.getOrders(shop.id, filters);
      }

      case 'create_order':
        return this.integrationService.createOrder(shop.id, args);

      case 'update_order_state':
        return this.integrationService.updateOrderState(shop.id, args.id, args.state);

      case 'get_sales_report': {
        const filters = {
          fromDate: args.fromDate ? String(args.fromDate) : undefined,
          toDate: args.toDate ? String(args.toDate) : undefined,
          groupBy: args.groupBy || 'date',
        };
        return this.integrationService.getSalesReport(shop.id, filters);
      }

      case 'list_customers': {
        const filters = {
          query: args.query,
          take: args.take ? Number(args.take) : 20,
          skip: args.skip ? Number(args.skip) : 0,
        };
        return this.integrationService.getCustomers(shop.id, filters);
      }

      case 'filter_customers':
        return this.integrationService.getCustomers(shop.id, args);

      case 'send_sms_to_customers':
        return this.integrationService.sendCustomerSms(shop.id, args);

      case 'list_materials':
        return this.integrationService.getMaterials(shop.id);

      case 'create_or_update_material':
        return this.integrationService.createOrUpdateMaterial(shop.id, args);

      case 'create_inventory_transaction': {
        const transactionDto = {
          material: { id: args.materialId } as any,
          type: args.type,
          quantity: args.quantity,
          unitPrice: args.unitPrice,
          costUpdateStrategy: args.costUpdateStrategy,
          note: args.note,
        };
        return this.integrationService.createInventoryTransaction(shop.id, transactionDto);
      }

      case 'list_menu_costs':
        return this.integrationService.getMenuCosts(shop.id);

      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  }
}

import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDetails,
  OrderDto,
  OrderReview,
} from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @MessagePattern('orders/findOne')
  findOne(id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('orders/dtoToOrder')
  dtoToOrder(dto: OrderDto): Promise<Order> {
    return this.ordersService.dtoToOrder(dto);
  }

  @MessagePattern('orders/insert')
  insert(dto: OrderDto): Promise<Order> {
    return this.ordersService.insert(dto);
  }

  @MessagePattern('orders/edit')
  edit(dto: OrderDto): Promise<Order> {
    return this.ordersService.edit(dto);
  }

  @MessagePattern('orders/manualSettlement')
  manualSettlement(dto: ManualSettlementDto): Promise<Order> {
    return this.ordersService.manualSettlement(dto);
  }

  @MessagePattern('orders/changeProperties')
  changeState(order: Order): Promise<Order> {
    return this.ordersService.changeProperties(order);
  }

  @MessagePattern('orders/sendOrderLinkToCustomer')
  sendOrderLinkToCustomer(orderId: string): Promise<void> {
    return this.ordersService.sendOrderLinkToCustomer(orderId);
  }

  @MessagePattern('orders/filter')
  filter(dto: FilterOrderDto): Promise<Order[]> {
    return this.ordersService.filter(dto);
  }
  @MessagePattern('orders/setCustomer')
  setCustomer(dto: { orderId: string; customerId: string }): Promise<Order> {
    return this.ordersService.setCustomer(dto);
  }

  @MessagePattern('orders/group')
  group(ids: string[]): Promise<Order> {
    return this.ordersService.groupOrders(ids);
  }

  @MessagePattern('orders/unGroup')
  Ungroup(orderId: string): Promise<Order[]> {
    return this.ordersService.UnGroupOrders(orderId);
  }

  @MessagePattern('orders/addReview')
  reviews(orderReview: OrderReview): Promise<OrderReview> {
    return this.ordersService.addOrderReview(orderReview);
  }
  @MessagePattern('orders/remove')
  delete(dto: { id: string; deletionReason: string }): Promise<void> {
    return this.ordersService.delete(dto);
  }

  @MessagePattern('orders/editOrderDetails')
  editOrderDetails(dto: {
    orderId: string;
    orderDetails: OrderDetails;
  }): Promise<void> {
    return this.ordersService.editOrderDetails(dto);
  }

  @MessagePattern('orders/findByPackOrderIds')
  findByPackOrderIds(ids: string[]): Promise<Order[]> {
    return this.ordersService.findByPackOrderIds(ids);
  }
}

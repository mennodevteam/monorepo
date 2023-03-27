import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderPaymentType, OrderReportDto, OrderState, OrderType } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OrderTypePipe } from '../../../shared/pipes/order-type.pipe';
import { OrderPaymentPipe } from '../../../shared/pipes/order-payment.pipe';
import { OrderStatePipe } from '../../../shared/pipes/order-state.pipe';
import { MenuService } from '../../../core/services/menu.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCurrencyPipe } from '../../../shared/pipes/menu-currency.pipe';
Chart.defaults.font.family = 'IRANSans';

declare let persianDate: any;

@Component({
  selector: 'order-reports',
  templateUrl: './order-reports.component.html',
  styleUrls: ['./order-reports.component.scss'],
})
export class OrderReportsComponent implements AfterViewInit {
  form: FormGroup;
  OrderType = OrderType;
  OrderPaymentType = OrderPaymentType;
  OrderState = OrderState;
  chartType: ChartType = 'bar';
  loading = false;
  chartOptions: ChartConfiguration['options'] = {
    aspectRatio: 3,
    animation: false,
    // responsive: false,
    scales: {
      // y: {
      //   stacked: true,
      // },
      // x: {
      //   stacked: true,
      // },
    },
  };
  chartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: [],
  };

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService,
    private ordersService: OrdersService,
    private orderTypePipe: OrderTypePipe,
    private orderPaymentPipe: OrderPaymentPipe,
    private orderStatePipe: OrderStatePipe,
    private translate: TranslateService,
    private menuCurrency: MenuCurrencyPipe
  ) {
    this.form = this.fb.group({
      fromDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      states: [[OrderState.Completed], Validators.required],
      payments: [
        [
          OrderPaymentType.NotPayed,
          OrderPaymentType.Cash,
          OrderPaymentType.ClubWallet,
          OrderPaymentType.Online,
        ],
        Validators.required,
      ],
      types: [[OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway], Validators.required],
      waiterId: [undefined],
      groupBy: 'date',
    });
  }

  ngAfterViewInit(): void {
    this.submit();
  }

  async submit() {
    this.loading = true;
    const dto: OrderReportDto = this.form.getRawValue();
    dto.fromDate.setHours(0, 0, 0, 0);
    dto.fromDate.setHours(dto.fromDate.getHours() + 3);
    dto.toDate.setHours(23, 59, 59, 999);
    dto.toDate.setHours(dto.toDate.getHours() + 3);
    switch (dto.groupBy) {
      case 'date':
        this.chartType = 'line';
        break;
      case 'payment':
      case 'state':
      case 'type':
        this.chartType = 'pie';
        break;
      default:
        this.chartType = 'bar';
    }
    const data = await this.ordersService.report(dto);
    if (data) {
      const keys = Object.keys(data);
      if (dto.groupBy === 'date') {
        keys.sort((a, b) => new Date(a).valueOf() - new Date(b).valueOf());
      }
      const chartSumData = keys.map((key) => data[key].sum);
      const chartCountData = keys.map((key) => data[key].count);

      this.chartData.datasets = [
        {
          data: chartCountData,
          hidden: true,
          label: this.translate.instant('app.count'),
        },
        {
          data: chartSumData,
          label: `${this.translate.instant('app.sum')} (${this.menuCurrency.transform('')})`,
        },
      ];

      // if (dto.groupBy === date)
      switch (dto.groupBy) {
        case 'date':
          this.chartData.labels = keys.map((x) => new persianDate(new Date(x)).format('YYYY/MM/DD'));
          break;
        case 'category':
          this.chartData.labels = keys.map((x) => this.menuService.getCategoryById(Number(x))?.title);
          break;
        case 'product':
          this.chartData.labels = keys.map((x) => this.menuService.getProductById(x)?.title);
          break;
        case 'payment':
          this.chartData.labels = keys.map((x) => this.orderPaymentPipe.transform(Number(x)));
          break;
        case 'state':
          this.chartData.labels = keys.map((x) => this.orderStatePipe.transform(Number(x)));
          break;
        case 'type':
          this.chartData.labels = keys.map((x) => this.orderTypePipe.transform(Number(x)));
          break;
      }
      dto.groupBy === 'date'
        ? keys.map((x) => new persianDate(new Date(x)).format('YYYY/MM/DD'))
        : keys;
      this.chart?.update();
    }
    this.loading = false;
  }
}

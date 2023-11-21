import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderPaymentType, OrderReportDto, OrderState, OrderType, ShopPrintView } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { OrderTypePipe } from '../../../shared/pipes/order-type.pipe';
import { OrderPaymentPipe } from '../../../shared/pipes/order-payment.pipe';
import { OrderStatePipe } from '../../../shared/pipes/order-state.pipe';
import { MenuService } from '../../../core/services/menu.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCurrencyPipe } from '../../../shared/pipes/menu-currency.pipe';
import { sortByCreatedAt } from '@menno/utils';
import { PrinterService } from '../../../core/services/printer.service';
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
  isRangeCorrect = false;
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
  tableData: {
    label: string;
    count: number;
    sum: number;
  }[];
  tableColumns = ['label', 'count', 'sum'];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService,
    private ordersService: OrdersService,
    private orderTypePipe: OrderTypePipe,
    private orderPaymentPipe: OrderPaymentPipe,
    private orderStatePipe: OrderStatePipe,
    private translate: TranslateService,
    private menuCurrency: MenuCurrencyPipe,
    private printerService: PrinterService,
  ) {
    this.form = this.fb.group({
      fromDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      states: [
        [
          OrderState.Pending,
          OrderState.Processing,
          OrderState.Ready,
          OrderState.Shipping,
          OrderState.Completed,
        ],
        Validators.required,
      ],
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

    this.form.get('fromDate')?.valueChanges.subscribe(() => {
      this.isRangeCorrect = false;
    });
    this.form.get('toDate')?.valueChanges.subscribe(() => {
      this.isRangeCorrect = false;
    });
  }

  ngAfterViewInit(): void {
    this.submit();
  }

  async submit() {
    this.loading = true;
    const dto: OrderReportDto = this.form.getRawValue();
    dto.fromDate = (dto.fromDate as any)._d || dto.fromDate;
    dto.toDate = (dto.toDate as any)._d || dto.toDate;
    if (!this.isRangeCorrect) {
      dto.fromDate.setHours(0, 0, 0, 0);
      dto.fromDate.setHours(dto.fromDate.getHours() + 3);
      dto.toDate.setHours(23, 59, 59, 999);
      dto.toDate.setHours(dto.toDate.getHours() + 3);
      this.isRangeCorrect = true;
    }
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
        keys.sort(sortByCreatedAt);
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

      let skipTotal = false;
      switch (dto.groupBy) {
        case 'date':
          this.chartData.labels = keys.map((x) => new persianDate(new Date(x)).format('YYYY/MM/DD'));
          break;
        case 'category':
          skipTotal = true;
          this.chartData.labels = keys.map((x) => this.menuService.getCategoryById(Number(x))?.title);
          break;
        case 'product':
          skipTotal = true;
          this.chartData.labels = keys.map((x) => this.menuService.getProductById(x)?.title);
          break;
        case 'payment':
          this.chartData.labels = keys.map((x) =>
            isNaN(Number(x)) ? x : this.orderPaymentPipe.transform(Number(x))
          );
          break;
        case 'state':
          this.chartData.labels = keys.map((x) => this.orderStatePipe.transform(Number(x)));
          break;
        case 'type':
          this.chartData.labels = keys.map((x) => this.orderTypePipe.transform(Number(x)));
          break;
      }
      // dto.groupBy === 'date' ? keys.map((x) => new persianDate(new Date(x)).format('YYYY/MM/DD')) : keys;

      this.tableData = keys.map((key, i) => ({
        label: this.chartData.labels ? (this.chartData.labels[i] as string) : '',
        count: data[key].count,
        sum: data[key].sum,
      }));

      if (!skipTotal) {
        const totalRow = this.tableData.reduce(
          (t, o) => {
            return { ...t, count: t.count + o.count, sum: t.sum + o.sum };
          },
          { label: this.translate.instant('app.sum'), count: 0, sum: 0 }
        );
        this.tableData.unshift(totalRow);
      }

      this.chart?.update();
    }
    this.loading = false;
  }

  get printers() {
    return this.printerService.printers;
  }

  print(printView: ShopPrintView) {
    const formControl: OrderReportDto = this.form.getRawValue();
    if (formControl.groupBy === 'product') {
      this.printerService.printData({
        currency: 'تومان',
        customerAddress: '',
        customerName: '',
        customerPhone: '',
        date: new Date(),
        descriptions: [],
        qNumber: 0,
        shopAddress: '',
        shopName: '',
        shopPhones: [],
        items: this.tableData.map((data) => ({
          isAbstract: false,
          title: data.label,
          quantity: data.count,
          price: data.sum,
        })),
        table: '',
        totalPrice: 0,
        type: 0,
        shopUrl: ''
        
      }, printView)
    }
  }
}

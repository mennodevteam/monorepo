import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js';

declare let persianDate: any;

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  loading = 1;
  dailyReportChartOptions: ChartConfiguration['options'] = {
    aspectRatio: 3,
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

  dailyReportChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: [],
  };

  dailyData: {
    date: string;
    view: number;
    orderCount: number;
    orderSum: number;
  }[];

  dailyTableCols = ['date', 'view', 'orderCount', 'cvr', 'orderSum', 'aov'];

  constructor(private http: HttpClient, private translate: TranslateService) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 31);
    const startDateString = startDate
      .toLocaleDateString('en-CA', { year: 'numeric', day: '2-digit', month: '2-digit' })
      .replace(/\//g, '-');

    const endDate = new Date();
    const endDateString = endDate
      .toLocaleDateString('en-CA', { year: 'numeric', day: '2-digit', month: '2-digit' })
      .replace(/\//g, '-');

    this.http
      .get<
        {
          date: string;
          view: number;
          orderCount: number;
          orderSum: number;
        }[]
      >(`dashboard/daily/${startDateString}/${endDateString}`)
      .subscribe((response) => {
        this.dailyData = [...response];
        this.dailyData.reverse();
        this.dailyReportChartData.labels = response.map((x) =>
          new persianDate(new Date(x.date)).format('YYYY/MM/DD')
        );

        this.dailyReportChartData.datasets = [
          {
            label: this.translate.instant('dashboard.orderCount'),
            data: response.map((x) => x.orderCount),
          },
          {
            label: this.translate.instant('dashboard.view'),
            data: response.map((x) => x.view),
          },
        ];

        this.loading--;
      });
  }
}

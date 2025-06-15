import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ShopService } from '../../shop/shop.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent implements OnInit {
  members: any[] = [];
  loading = false;
  error: any = null;
  private readonly shopsService = inject(ShopService);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    // TODO: Replace with a real clubId or get from route/query
    const clubId = this.shopsService.data()?.club?.id;
    this.http.post<any[]>('/members/filter-v2', { clubId }).subscribe({
      next: (res) => {
        this.members = res;
        console.log('Members:', res);
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
        console.error('Error loading members:', err);
      },
    });
  }
}

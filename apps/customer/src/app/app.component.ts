import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeSectionService } from './core/services/home-section.service';
import { resolveShopUsername } from './core/functions';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'customer';
  private readonly homeSectionService = inject(HomeSectionService);

  ngOnInit(): void {
    this.homeSectionService.prefetchHomeSections(resolveShopUsername());
  }
}

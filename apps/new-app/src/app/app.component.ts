import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InitialParamsService } from './core';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'new-app';
  initialParamsService = inject(InitialParamsService);
}

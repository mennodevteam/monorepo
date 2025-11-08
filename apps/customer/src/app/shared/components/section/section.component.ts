import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-section',
  imports: [MatToolbar, MatButton, RouterLink],
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-section',
  },
})
export class SectionComponent {
  readonly title = input.required<string>();
  readonly routerLink = input<string | undefined>();
  readonly seeMoreLabel = input('مشاهده بیشتر');
}

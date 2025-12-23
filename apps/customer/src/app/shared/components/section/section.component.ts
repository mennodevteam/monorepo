import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-section',
  imports: [MatToolbar, MatButton, RouterLink, NgIcon],
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-section',
  },
})
export class SectionComponent {
  readonly title = input.required<string>();
  readonly icon = input<string | undefined>();
  readonly seeMoreRouterLink = input<string | undefined>();
  readonly seeMoreLabel = input('');
  readonly seeMoreClick = output<void>();
}

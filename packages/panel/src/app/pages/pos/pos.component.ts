import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PosService } from '../../core/services/pos.service';

@Component({
  selector: 'pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent {
  constructor(public POS: PosService, private route: ActivatedRoute, private router: Router) {
    this.POS.init(this.queryParamId);
  }

  get queryParamId() {
    return this.route.snapshot.queryParams['id'];
  }

  async save(print = false) {
    await this.POS.save(print);
    if (this.queryParamId) {
      this.router.navigate(['/pos'], {
        replaceUrl: true,
      });
    }
  }
}

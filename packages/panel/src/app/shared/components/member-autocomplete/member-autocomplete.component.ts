import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { FilterMemberDto } from '@menno/types';
import { Member } from '@menno/types';
import { User } from '@menno/types';
import { ClubService } from '../../../core/services/club.service';

@Component({
  selector: 'app-member-autocomplete',
  templateUrl: './member-autocomplete.component.html',
  styleUrls: ['./member-autocomplete.component.scss']
})
export class MemberAutocompleteComponent implements OnInit {
  @Input() myControl = new FormControl();
  filteredMembers: BehaviorSubject<Member[] | undefined> = new BehaviorSubject(undefined);
  User = User;

  constructor(
    private club: ClubService,
  ) { }

  ngOnInit() {
    this.myControl.valueChanges.pipe(startWith(''))
      .pipe(debounceTime(500)).pipe(distinctUntilChanged()).subscribe((value) => {
        this.filteredMembers.next(undefined);
        if (value) {
          this.club.filter(<FilterMemberDto>{
            query: value,
            take: 10,
          }).subscribe((res) => {
            this.filteredMembers.next(res[0]);
          });
        } else {
          this.filteredMembers.next([]);
        }
      })
  }

  displayFn(member: Member): string {
    if (member) {
      return User.fullName(member.user);
    }
  }
}

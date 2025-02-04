import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FilterMemberDto, Member, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ClubService } from '../../../core/services/club.service';
import { PhonePipe } from '../../pipes/phone.pipe';

@Component({
  selector: 'member-autocomplete',
  templateUrl: './member-autocomplete.component.html',
  styleUrls: ['./member-autocomplete.component.scss'],
})
export class MemberAutocompleteComponent implements OnInit {
  @Input('formControl') control = new FormControl();
  filteredMembers = new BehaviorSubject<Member[] | undefined>(undefined);
  User = User;

  constructor(private club: ClubService, private phonePipe: PhonePipe) {}

  ngOnInit() {
    this.control.valueChanges
      .pipe(startWith(''))
      .pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        this.filteredMembers.next(undefined);
        if (value) {
          this.club
            .filter(<FilterMemberDto>{
              query: value,
              take: 10,
            })
            .subscribe((res) => {
              this.filteredMembers.next(res[0]);
            });
        } else {
          this.filteredMembers.next([]);
        }
      });
  }

  displayFn(member: Member): string {
    if (member) {
      return `${User.fullName(member.user)} (${member.user.mobilePhone})`;
    }
    return '';
  }
}

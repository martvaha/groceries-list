import { Component, OnInit, Input } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'gl-sidenav-menu',
  templateUrl: './sidenav-menu.component.html',
  styleUrls: ['./sidenav-menu.component.scss']
})
export class SidenavMenuComponent implements OnInit {
  @Input() nav: MatSidenav;
  public navItems = [{ label: 'Home', link: '/home' }, { label: 'Login', link: '/home/login' }];

  constructor() {}

  ngOnInit() {
    console.log(this.nav);
  }

  handleClick() {
    if (this.nav && this.nav.mode === 'over') {
       this.nav.close();
    }
  };
}

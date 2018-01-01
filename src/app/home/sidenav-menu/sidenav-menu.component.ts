import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'gl-sidenav-menu',
  templateUrl: './sidenav-menu.component.html',
  styleUrls: ['./sidenav-menu.component.scss']
})
export class SidenavMenuComponent implements OnInit {
  public navItems = [
    { label: 'Home', link: '/home'},
    { label: 'Login', link: '/home/login'}
  ];

  constructor() { }

  ngOnInit() {
  }

}

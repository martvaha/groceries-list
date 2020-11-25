import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  /* NB! Do not add logic here, it will break app-shell.
     Add logic to home.component.ts */

     ngOnInit(): void {
       //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
       //Add 'implements OnInit' to the class.
       console.log('4858', 'app');
     }
}

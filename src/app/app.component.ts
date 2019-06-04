import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'gl-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Groceries List';

  constructor(private icons: MatIconRegistry, private sanitizer: DomSanitizer) {
    this.icons.addSvgIcon('flogo', this.sanitizer.bypassSecurityTrustResourceUrl('../assets/flogo.svg'));
  }
}

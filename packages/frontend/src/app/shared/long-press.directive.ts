import { Directive, HostBinding, HostListener, output, input } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appLongPress]',
})
export class LongPressDirective {
  readonly duration = input(500);

  readonly longPress = output<any>();
  readonly longPressing = output<any>();
  readonly longPressEnd = output<any>();

  private pressing: boolean;
  private islongPressing: boolean;
  private timeout: any;
  private mouseX = 0;
  private mouseY = 0;

  @HostBinding('class.press')
  get press() {
    return this.pressing;
  }

  @HostBinding('class.longpress')
  get isLongPress() {
    return this.islongPressing;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // don't do right/middle clicks
    if (event.which !== 1) return;

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    this.pressing = true;
    this.islongPressing = false;

    this.timeout = setTimeout(() => {
      this.islongPressing = true;
      this.longPress.emit(event);
      this.loop(event);
    }, this.duration());

    this.loop(event);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.pressing && !this.islongPressing) {
      const xThres = event.clientX - this.mouseX > 10;
      const yThres = event.clientY - this.mouseY > 10;
      if (xThres || yThres) {
        this.endPress();
      }
    }
  }

  loop(event: any) {
    if (this.islongPressing) {
      this.timeout = setTimeout(() => {
        this.longPressing.emit(event);
        this.loop(event);
      }, 50);
    }
  }

  endPress() {
    clearTimeout(this.timeout);
    this.islongPressing = false;
    this.pressing = false;
    this.longPressEnd.emit(true);
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.endPress();
  }
}

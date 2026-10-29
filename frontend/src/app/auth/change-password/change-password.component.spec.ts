import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { NgForm, NgModel } from '@angular/forms';
import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../login/auth.service';
import { authServiceStub, sessionUser } from '../../testing';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  const changePassword = jasmine.createSpy('changePassword');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        provideRouter([{ path: 'users', children: [] }]),
        provideNoopAnimations(),
        {
          provide: AuthService,
          useValue: { ...authServiceStub(sessionUser({ mustChangePassword: true })), changePassword },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('detecta el cambio obligatorio', () => {
    expect(component.forced).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Crea una contraseña nueva');
  });

  it('no envía si las contraseñas no coinciden', async () => {
    await fixture.whenStable();
    component.currentPassword = 'admin123';
    component.newPassword = 'nueva-clave-1';
    component.confirmPassword = 'otra-clave-1';
    fixture.detectChanges();
    await fixture.whenStable();

    const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    const confirm = form.controls['confirmPassword'];

    component.checkMatch({ control: confirm } as NgModel);
    expect(confirm.hasError('mismatch')).toBeTrue();

    component.save(form, { control: confirm } as NgModel);
    expect(changePassword).not.toHaveBeenCalled();
  });
});

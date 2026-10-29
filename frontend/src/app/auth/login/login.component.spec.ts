import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from './auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  const auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'user']);

  const validForm = { invalid: false } as NgForm;
  const failWith = (status: number) => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
    component.login(validForm);
    return component.error;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([{ path: 'users', children: [] }]), provideNoopAnimations(), { provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra un mensaje distinto según el error', () => {
    expect(failWith(401)).toBe('Credenciales incorrectas');
    expect(failWith(403)).toContain('desactivado');
    expect(failWith(429)).toContain('Demasiados intentos');
  });
});

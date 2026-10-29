import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgForm } from '@angular/forms';
import { of } from 'rxjs';
import { UsersFormComponent } from './users-form.component';
import { UsersService } from '../users.service';
import { AuthService } from '../../auth/login/auth.service';
import { authServiceStub, sessionUser } from '../../testing';

describe('UsersFormComponent', () => {
  let fixture: ComponentFixture<UsersFormComponent>;
  let component: UsersFormComponent;
  let usersService: jasmine.SpyObj<UsersService>;

  const existing = { _id: 'me', name: 'Yo', email: 'me@x.com', phone: '1', role: 'admin', status: 'active' } as const;

  async function setup(role: 'admin' | 'editor', id: string | null = null) {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['getOne', 'create', 'update']);
    usersService.getOne.and.returnValue(of({ ...existing }));
    usersService.create.and.returnValue(of({ ...existing }));
    usersService.update.and.returnValue(of({ ...existing }));

    await TestBed.configureTestingModule({
      imports: [UsersFormComponent],
      providers: [
        provideRouter([{ path: 'users', children: [] }]),
        provideNoopAnimations(),
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authServiceStub(sessionUser({ id: 'me', role })) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const validForm = { invalid: false } as NgForm;

  it('un editor no puede asignar el rol de administrador', async () => {
    await setup('editor');
    expect(component.availableRoles).toEqual(['editor', 'viewer']);
  });

  it('crea con rol y estado por defecto (admin)', async () => {
    await setup('admin');
    Object.assign(component.user, { name: 'Ana', email: 'ana@x.com', phone: '9' });
    component.password = 'secret123';
    component.save(validForm);

    expect(usersService.create).toHaveBeenCalledWith({
      name: 'Ana', email: 'ana@x.com', phone: '9', password: 'secret123', role: 'viewer', status: 'active',
    });
  });

  it('el editor no envía el estado', async () => {
    await setup('editor');
    Object.assign(component.user, { name: 'Ana', email: 'ana@x.com', phone: '9' });
    component.password = 'secret123';
    component.save(validForm);

    expect(usersService.create.calls.mostRecent().args[0].status).toBeUndefined();
  });

  it('al editarse a sí mismo no envía rol ni estado', async () => {
    await setup('admin', 'me');
    expect(component.isSelf).toBeTrue();
    component.save(validForm);

    const payload = usersService.update.calls.mostRecent().args[1];
    expect(payload.role).toBeUndefined();
    expect(payload.status).toBeUndefined();
    expect(payload.password).toBeUndefined();
  });
});

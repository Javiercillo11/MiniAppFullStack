import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { User, UsersService } from '../users.service';
import { AuthService } from '../../auth/login/auth.service';
import { authServiceStub, sessionUser } from '../../testing';

describe('UsersListComponent', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;
  let auth: ReturnType<typeof authServiceStub>;

  const users: User[] = [
    { _id: 'me', name: 'Yo Admin', email: 'me@x.com', phone: '1', role: 'admin', status: 'active' },
    { _id: 'a2', name: 'Otro Admin', email: 'a2@x.com', phone: '2', role: 'admin', status: 'active' },
    { _id: 'v1', name: 'Luis Lector', email: 'l@x.com', phone: '3', role: 'viewer', status: 'inactive' },
  ];

  async function setup(role: 'admin' | 'editor' | 'viewer') {
    auth = authServiceStub(sessionUser({ id: 'me', role }));
    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        provideRouter([{ path: 'users', children: [] }]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
        { provide: UsersService, useValue: { getAll: () => of(users) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('muestra todos los usuarios con su rol y estado', async () => {
    await setup('admin');
    expect(fixture.nativeElement.querySelectorAll('tr[mat-row]').length).toBe(3);
    expect(text()).toContain('Administrador');
    expect(text()).toContain('Inactivo');
  });

  it('filtra por estado', async () => {
    await setup('admin');
    component.setStatusFilter('inactive');
    fixture.detectChanges();
    expect(component.dataSource.filteredData.map(u => u._id)).toEqual(['v1']);
  });

  it('el admin administra a otros pero no a sí mismo', async () => {
    await setup('admin');
    expect(component.canAdminister(users[0])).toBeFalse();
    expect(component.canAdminister(users[1])).toBeTrue();
  });

  it('el editor no edita administradores', async () => {
    await setup('editor');
    expect(component.canEdit(users[1])).toBeFalse();
    expect(component.canEdit(users[2])).toBeTrue();
    expect(component.canAdminister(users[2])).toBeFalse();
  });

  it('el lector no ve el botón de crear', async () => {
    await setup('viewer');
    expect(text()).not.toContain('Crear usuario');
  });
});

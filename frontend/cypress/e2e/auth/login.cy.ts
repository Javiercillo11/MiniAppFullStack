describe('Login', () => {
  beforeEach(() => {
    cy.mockNoSession();

    // Mock del backend
    cy.fixture('admin-user.json').then((admin) => {
      cy.intercept('POST', '/api/auth/login', (req) => {
        const { email, password } = req.body;

        if (email === 'admin@miniapp.local' && password === 'admin123') {
          req.reply({ statusCode: 200, body: { ok: true, user: admin } });
        } else {
          req.reply({ statusCode: 401, body: { ok: false, message: 'Invalid credentials' } });
        }
      }).as('loginRequest');
    });

    cy.visit('/login');
  });

  it('debe loguear correctamente con credenciales válidas', () => {
    cy.get('input[name="email"]').should('be.visible').type('admin@miniapp.local');
    cy.get('input[name="password"]').should('be.visible').type('admin123');

    cy.get('button[type="submit"]').contains('Entrar').click();

    cy.wait('@loginRequest');

    cy.url().should('include', '/users');
    cy.contains('Usuarios').should('be.visible');

    // El token nunca se guarda en el navegador (va en cookie httpOnly)
    cy.window().then((win) => {
      expect(Object.keys(win.localStorage)).not.to.include('token');
    });
  });

  it('debe mostrar error con credenciales inválidas', () => {
    cy.get('input[name="email"]').type('admin@miniapp.local');
    cy.get('input[name="password"]').type('wrongpassword');

    cy.get('button[type="submit"]').contains('Entrar').click();

    cy.wait('@loginRequest');

    cy.url().should('include', '/login');
    cy.contains('Credenciales incorrectas').should('be.visible');
  });

  it('debe avisar al superar el límite de intentos', () => {
    cy.intercept('POST', '/api/auth/login', { statusCode: 429, body: {} });

    cy.get('input[name="email"]').type('admin@miniapp.local');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Demasiados intentos').should('be.visible');
  });

  it('debe redirigir a login si intenta acceder a /users sin sesión', () => {
    cy.visit('/users');

    cy.url().should('include', '/login');
  });

  it('debe obligar a cambiar la contraseña asignada', () => {
    cy.fixture('admin-user.json').then((admin) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: { ok: true, user: { ...admin, mustChangePassword: true } }
      });
      cy.intercept('POST', '/api/auth/change-password', {
        statusCode: 200,
        body: { ok: true, user: admin }
      }).as('changePassword');
    });
    cy.intercept('GET', '/api/users', []);

    cy.get('input[name="email"]').type('admin@miniapp.local');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/change-password');
    cy.contains('Crea una contraseña nueva').should('be.visible');

    cy.get('input[name="currentPassword"]').type('admin123');
    cy.get('input[name="newPassword"]').type('nueva-clave-1');
    cy.get('input[name="confirmPassword"]').type('nueva-clave-1');
    cy.contains('button', 'Guardar contraseña').click();

    cy.wait('@changePassword')
      .its('request.body')
      .should('deep.equal', { currentPassword: 'admin123', newPassword: 'nueva-clave-1' });
    cy.url().should('include', '/users');
  });
});

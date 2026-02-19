describe('Login - Angular Material', () => {
  beforeEach(() => {
    cy.visit('/login');

    // Mock del backend
    cy.intercept('POST', '**/auth/login', (req) => {
      const { username, password } = req.body;

      if (username === 'admin' && password === 'admin123') {
        req.reply({
          statusCode: 200,
          body: { ok: true, token: 'fake-token' },
        });
      } else {
        req.reply({
          statusCode: 401,
          body: { ok: false, message: 'Invalid credentials' },
        });
      }
    }).as('loginRequest');
  });

  it('debe loguear correctamente con credenciales válidas', () => {
    cy.get('input[name="username"]').should('be.visible').type('admin');
    cy.get('input[name="password"]').should('be.visible').type('admin123');

    cy.get('button[type="submit"]').contains('Entrar').click();

    cy.wait('@loginRequest');

    cy.url().should('include', '/users');

    // Verifica token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('fake-token');
    });

    cy.contains('Usuarios').should('be.visible');
  });

  it('debe mostrar error con credenciales inválidas', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('wrongpassword');

    cy.get('button[type="submit"]').contains('Entrar').click();

    cy.wait('@loginRequest');

    cy.url().should('include', '/login');

    cy.contains('Credenciales incorrectas').should('be.visible');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('debe redirigir a login si intenta acceder a /users sin token', () => {
    cy.visit('/login');
    cy.clearLocalStorage();
    cy.reload();

    cy.visit('/users');

    cy.url().should('include', '/login');
  });
});

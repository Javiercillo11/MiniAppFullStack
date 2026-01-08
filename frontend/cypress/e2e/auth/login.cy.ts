describe('Login', () => {

  beforeEach(() => {
    cy.visit('/login');

    // Mock del POST /auth/login
    cy.intercept('POST', '/auth/login', (req) => {
      const { username, password } = req.body;

      if (username === 'admin' && password === 'admin123') {
        // Credenciales correctas
        req.reply({
          statusCode: 200,
          body: { ok: true, token: 'fake-token' },
        });
      } else {
        // Credenciales inválidas
        req.reply({
          statusCode: 401,
          body: { ok: false, message: 'Invalid credentials' },
        });
      }
    }).as('loginRequest');
  });

  it('debe loguear correctamente con credenciales válidas', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');

    cy.get('button[type="submit"]').click();

    // Esperar la petición mock
    cy.wait('@loginRequest');

    // Redirección a /users
    cy.get('h2').contains('Usuarios').should('be.visible');

    // Token guardado
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('fake-token');
    });
  });

  it('debe mostrar error con credenciales inválidas', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('wrongpassword');

    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');

    // Sigue en login
    cy.get('h2').contains('Login').should('be.visible');

    // Mensaje de error visible
    cy.contains('Credenciales inválidas').should('be.visible');

    // No se guarda token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('debe redirigir a login si intenta acceder a /users sin token', () => {
    cy.clearLocalStorage();
    cy.visit('/users');

    cy.get('h2').contains('Login').should('be.visible');
  });
});

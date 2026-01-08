describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('debe loguear correctamente con credenciales válidas', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');

    cy.get('button[type="submit"]').click();

    // Redirección a /users
    cy.url().should('include', '/users');

    // Token guardado
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.eq('fake-token');
    });
  });

  it('debe mostrar error con credenciales inválidas', () => {
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('wrongpassword');

    cy.get('button[type="submit"]').click();

    // Sigue en login
    cy.url().should('include', '/login');

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

    cy.url().should('include', '/login');
  });
});

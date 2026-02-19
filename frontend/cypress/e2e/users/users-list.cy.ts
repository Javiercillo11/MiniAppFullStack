describe('Módulo Usuarios (Angular Material)', () => {

  const mockUser = {
    _id: '123',
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890'
  };

  beforeEach(() => {

    // Mock login
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: { ok: true, token: 'fake-token' }
    }).as('login');

    // Mock listado
    cy.intercept('GET', '/users', [mockUser]).as('getUsers');

    cy.visit('/login');

    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');

    cy.contains('Usuarios').should('be.visible');
    cy.wait('@getUsers');
  });

  it('muestra el usuario mock en la tabla Material', () => {

    // Verificar que existe una fila
    cy.get('tr[mat-row]').should('have.length', 1);

    cy.get('tr[mat-row]').first().within(() => {
      cy.get('td[mat-cell]').eq(0).should('contain.text', mockUser.name);
      cy.get('td[mat-cell]').eq(1).should('contain.text', mockUser.email);
      cy.get('td[mat-cell]').eq(2).should('contain.text', mockUser.phone);
    });

  });

});

describe('Módulo Usuarios', () => {

  const mockUser = {
    id: 1,
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890'
  };

  beforeEach(() => {
    // Mock del GET /users
    cy.intercept('GET', '/users', [mockUser]).as('getUsers');

    // Login fake
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    // Verificar que estamos en la página de usuarios
    cy.get('h2').contains('Usuarios').should('be.visible');
  });

  it('muestra el usuario mock en la tabla', () => {
    cy.wait('@getUsers'); // Esperar el intercept
    cy.get('tbody tr').should('have.length', 1);

    cy.get('tbody tr').first().within(() => {
      cy.get('td').eq(0).should('contain.text', mockUser.name);
      cy.get('td').eq(1).should('contain.text', mockUser.email);
      cy.get('td').eq(2).should('contain.text', mockUser.phone);
    });
  });

});

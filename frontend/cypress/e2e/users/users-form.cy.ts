describe('Formulario de usuario', () => {

  const mockUser = {
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890'
  };

  beforeEach(() => {

    // Mock listado vacío
    cy.intercept('GET', '/api/users', []).as('getUsers');

    // Mock creación exitosa
    cy.intercept('POST', '/api/users', (req) => {
      req.reply({
        statusCode: 201,
        body: { _id: '123', ...req.body }
      });
    }).as('createUser');

    cy.loginAs();

    // Esperar redirección
    cy.contains('Usuarios').should('be.visible');

    // Ir a crear usuario
    cy.contains('button', 'Crear usuario').click();

    cy.contains('h1', 'Crear usuario').should('be.visible');
  });

  it('debe crear un usuario con datos válidos', () => {

    // Completar formulario
    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);
    cy.get('input[name="password"]').type('secret123');

    cy.contains('button', 'Crear').click();

    // Validar request enviada (rol y estado por defecto)
    cy.wait('@createUser')
      .its('request.body')
      .should('deep.equal', { ...mockUser, password: 'secret123', role: 'viewer', status: 'active' });

    // Verificar redirección
    cy.url().should('match', /\/users$/);
  });

  it('debe mostrar error si teléfono ya existe (409)', () => {

    // Sobrescribir mock POST para conflicto
    cy.intercept('POST', '/api/users', {
      statusCode: 409,
      body: { message: 'Teléfono ya existe' }
    }).as('createConflict');

    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);
    cy.get('input[name="password"]').type('secret123');

    cy.contains('button', 'Crear').click();

    cy.wait('@createConflict');

    // Ver mensaje en pantalla
    cy.contains('Teléfono ya existe').should('be.visible');
  });

});

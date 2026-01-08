describe('Formulario Usuario', () => {
  const mockUser = {
    id: 1,
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890'
  };

  beforeEach(() => {
    // Mock GET /users para listado
    cy.intercept('GET', '/users', []).as('getUsers');

    // Mock POST /users para creación
    cy.intercept('POST', '/users', (req) => {
      req.reply({
        statusCode: 201,
        body: { ...req.body, id: 1 } // agregar id
      });
    }).as('createUser');

    // Login fake
    cy.visit('/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.get('h2').contains('Usuarios').should('be.visible');

    // Ir al formulario de crear usuario
    cy.get('button.primary').contains('Crear usuario').click();
    cy.get('h2').contains('Crear Usuario').should('be.visible');
  });

  it('debe crear un usuario con datos válidos', () => {
    // Llenar el formulario
    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);

    // Submit
    cy.get('button.primary').contains('Crear').click();

    // Esperar la petición POST
    cy.wait('@createUser').its('request.body').should('deep.equal', {
      name: mockUser.name,
      email: mockUser.email,
      phone: mockUser.phone
    });

    // Verificar redirección a /users
    cy.get('h2').contains('Usuarios').should('be.visible');
  });

  it('debe mostrar error si teléfono ya existe (409)', () => {
    // Mock POST para conflicto
    cy.intercept('POST', '/users', {
      statusCode: 409,
      body: { message: 'Teléfono ya existe' }
    }).as('createConflict');

    // Llenar formulario
    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);

    cy.get('button.primary').contains('Crear').click();

    cy.wait('@createConflict');

    // Ver mensaje de error visible
    cy.contains('Teléfono ya existe').should('be.visible');
  });
});

describe('Formulario Usuario (Angular Material)', () => {

  const mockUser = {
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890'
  };

  beforeEach(() => {

    // Simular login correcto
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: { ok: true, token: 'fake-token' }
    }).as('login');

    // Mock listado vacío
    cy.intercept('GET', '/users', []).as('getUsers');

    // Mock creación exitosa
    cy.intercept('POST', '/users', (req) => {
      req.reply({
        statusCode: 201,
        body: { _id: '123', ...req.body }
      });
    }).as('createUser');

    // Ir a login
    cy.visit('/login');

    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');

    // Esperar redirección
    cy.contains('Usuarios').should('be.visible');

    // Ir a crear usuario
    cy.contains('Crear usuario').click();

    cy.contains('Crear Usuario').should('be.visible');
  });

  it('debe crear un usuario con datos válidos', () => {

    // Completar formulario
    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);

    // Click botón Crear
    cy.contains('button', 'Crear').click();

    // Validar request enviada
    cy.wait('@createUser')
      .its('request.body')
      .should('deep.equal', mockUser);

    // Verificar redirección
    cy.contains('Usuarios').should('be.visible');
  });

  it('debe mostrar error si teléfono ya existe (409)', () => {

    // Sobrescribir mock POST para conflicto
    cy.intercept('POST', '/users', {
      statusCode: 409,
      body: { message: 'Phone already exists' }
    }).as('createConflict');

    cy.get('input[name="name"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="phone"]').type(mockUser.phone);

    cy.contains('button', 'Crear').click();

    cy.wait('@createConflict');

    // Ver mensaje en pantalla
    cy.contains('Teléfono ya existe').should('be.visible');
  });

});

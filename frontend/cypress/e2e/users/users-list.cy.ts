describe('Listado de usuarios', () => {

  const mockUser = {
    _id: '123',
    name: 'Javier Sanchez',
    email: 'javi.sanchez@mail.com',
    phone: '1234567890',
    role: 'editor',
    status: 'active'
  };

  beforeEach(() => {
    // Mock listado
    cy.intercept('GET', '/api/users', [mockUser]).as('getUsers');
  });

  it('muestra el usuario en la tabla con su rol y estado', () => {
    cy.loginAs();
    cy.wait('@getUsers');

    // Verificar que existe una fila
    cy.get('tr[mat-row]').should('have.length', 1);

    cy.get('tr[mat-row]').first().within(() => {
      cy.get('td[mat-cell]').eq(0).should('contain.text', mockUser.name);
      cy.get('td[mat-cell]').eq(1).should('contain.text', mockUser.email);
      cy.get('td[mat-cell]').eq(2).should('contain.text', mockUser.phone);
      cy.get('td[mat-cell]').eq(3).should('contain.text', 'Editor');
      cy.get('td[mat-cell]').eq(4).should('contain.text', 'Activo');
    });
  });

  it('un lector no ve acciones de gestión', () => {
    cy.loginAs({ role: 'viewer' });
    cy.wait('@getUsers');

    cy.contains('button', 'Crear usuario').should('not.exist');
    cy.get('button[aria-label^="Editar"]').should('not.exist');
    cy.get('button[aria-label^="Más acciones"]').should('not.exist');
  });

  it('el admin puede desactivar un usuario', () => {
    cy.intercept('PATCH', '/api/users/123/status', { ...mockUser, status: 'inactive' }).as('setStatus');

    cy.loginAs();
    cy.wait('@getUsers');

    cy.get('button[aria-label="Más acciones para Javier Sanchez"]').click();
    cy.contains('button', 'Desactivar').click();

    cy.wait('@setStatus').its('request.body').should('deep.equal', { status: 'inactive' });
    cy.get('tr[mat-row]').first().should('contain.text', 'Inactivo');
  });

});

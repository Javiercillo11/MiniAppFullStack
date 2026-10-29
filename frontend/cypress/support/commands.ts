/// <reference types="cypress" />

// La sesión vive en cookies httpOnly del backend: en los tests se simula
// mockeando los endpoints de auth (sin sesión previa al cargar la app).
Cypress.Commands.add('mockNoSession', () => {
  cy.intercept('GET', '/api/auth/me', { statusCode: 401, body: {} }).as('me');
  cy.intercept('POST', '/api/auth/refresh', { statusCode: 401, body: {} }).as('refresh');
});

// Inicia sesión por la UI con el usuario indicado (admin por defecto)
Cypress.Commands.add('loginAs', (overrides: Record<string, unknown> = {}) => {
  cy.fixture('admin-user.json').then((admin) => {
    const user = { ...admin, ...overrides };

    cy.mockNoSession();
    cy.intercept('POST', '/api/auth/login', { statusCode: 200, body: { ok: true, user } }).as('login');

    cy.visit('/login');
    cy.get('input[name="email"]').type(user.email);
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mockNoSession(): Chainable<void>;
      loginAs(overrides?: Record<string, unknown>): Chainable<void>;
    }
  }
}

export {};

import { FakeAuthGuard } from './fake-auth.guard';

describe('FakeAuthGuard', () => {
  it('should be defined', () => {
    expect(new FakeAuthGuard()).toBeDefined();
  });
});

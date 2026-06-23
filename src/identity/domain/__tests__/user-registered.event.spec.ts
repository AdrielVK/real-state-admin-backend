import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { UserRegisteredEvent } from '../events/user-registered.event';

describe('UserRegisteredEvent', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const email = 'test@example.com';

  it('should set eventId, occurredOn, and aggregateId from constructor', () => {
    const event = new UserRegisteredEvent(userId, email, UserRole.VISITOR);

    expect(event.eventId).toBeDefined();
    expect(typeof event.eventId).toBe('string');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(userId);
  });

  it('should set email from constructor', () => {
    const event = new UserRegisteredEvent(userId, email, UserRole.VISITOR);

    expect(event.email).toBe(email);
  });

  it('should set role from constructor', () => {
    const event = new UserRegisteredEvent(userId, email, UserRole.AGENT);

    expect(event.role).toBe(UserRole.AGENT);
  });

  it('should return the correct eventName', () => {
    const event = new UserRegisteredEvent(userId, email, UserRole.VISITOR);

    expect(event.eventName).toBe('identity.user.registered');
  });

  it('should generate unique eventId for each instance', () => {
    const event1 = new UserRegisteredEvent(userId, email, UserRole.VISITOR);
    const event2 = new UserRegisteredEvent(userId, email, UserRole.VISITOR);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

import { UserPasswordChangedEvent } from '../events/user-password-changed.event';

describe('UserPasswordChangedEvent', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  it('should set eventId, occurredOn, and aggregateId from constructor', () => {
    const event = new UserPasswordChangedEvent(userId);

    expect(event.eventId).toBeDefined();
    expect(typeof event.eventId).toBe('string');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(userId);
  });

  it('should return the correct eventName', () => {
    const event = new UserPasswordChangedEvent(userId);
    expect(event.eventName).toBe('user.passwordChanged');
  });

  it('should generate unique eventId for each instance', () => {
    const event1 = new UserPasswordChangedEvent(userId);
    const event2 = new UserPasswordChangedEvent(userId);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

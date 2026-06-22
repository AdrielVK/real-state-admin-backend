import { UserCreatedEvent } from '../events/user-created.event';

describe('UserCreatedEvent', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const email = 'test@example.com';

  it('should set eventId, occurredOn, and aggregateId from constructor', () => {
    const event = new UserCreatedEvent(userId, email);

    expect(event.eventId).toBeDefined();
    expect(typeof event.eventId).toBe('string');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(userId);
  });

  it('should set email from constructor', () => {
    const event = new UserCreatedEvent(userId, email);

    expect(event.email).toBe(email);
  });

  it('should return the correct eventName', () => {
    const event = new UserCreatedEvent(userId, email);

    expect(event.eventName).toBe('user.created');
  });

  it('should generate unique eventId for each instance', () => {
    const event1 = new UserCreatedEvent(userId, email);
    const event2 = new UserCreatedEvent(userId, email);

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

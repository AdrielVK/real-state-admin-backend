import type { ICommand } from '../cqrs/command.interface';
import type { ICommandHandler } from '../cqrs/command-handler.interface';
import type { IQuery } from '../cqrs/query.interface';
import type { IQueryHandler } from '../cqrs/query-handler.interface';
import type { UseCase } from '../use-case.interface';

class TestCommand implements ICommand<string> {
  readonly payload: string;
  constructor(payload: string) {
    this.payload = payload;
  }
}

class TestQuery implements IQuery<number> {
  readonly id: number;
  constructor(id: number) {
    this.id = id;
  }
}

describe('CQRS interfaces', () => {
  it('ICommand should be implementable as a marker interface', () => {
    const cmd = new TestCommand('data');
    expect(cmd.payload).toBe('data');
  });

  it('IQuery should be implementable as a marker interface', () => {
    const query = new TestQuery(42);
    expect(query.id).toBe(42);
  });

  it('ICommandHandler should define execute method', () => {
    const handler: ICommandHandler<TestCommand, string> = {
      execute: async (cmd: TestCommand) => cmd.payload,
    };
    void expect(
      handler.execute(new TestCommand('test')).then((r: string) => {
        expect(r).toBe('test');
      }),
    );
  });

  it('IQueryHandler should define execute method', () => {
    const handler: IQueryHandler<TestQuery, number> = {
      execute: async (query: TestQuery) => query.id * 2,
    };
    void expect(
      handler.execute(new TestQuery(5)).then((r: number) => {
        expect(r).toBe(10);
      }),
    );
  });

  it('UseCase should define execute method', () => {
    const useCase: UseCase<string, number> = {
      execute: async (req: string) => req.length,
    };
    void expect(
      useCase.execute('hello').then((r: number) => {
        expect(r).toBe(5);
      }),
    );
  });
});

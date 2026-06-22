import type { ICommand } from './command.interface';

export interface ICommandHandler<TCommand extends ICommand<TResult>, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

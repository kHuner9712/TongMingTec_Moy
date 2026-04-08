export interface StateTransition<S extends string> {
  from: S;
  to: S;
}

export interface StateMachineDefinition<S extends string> {
  name: string;
  states: S[];
  initialState: S;
  terminalStates: S[];
  transitions: StateTransition<S>[];
}

export class StateMachineError extends Error {
  constructor(
    public readonly machineName: string,
    public readonly from: string,
    public readonly to: string,
    message: string,
  ) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export class StateMachine<S extends string> {
  constructor(private readonly definition: StateMachineDefinition<S>) {}

  canTransition(from: S, to: S): boolean {
    return this.definition.transitions.some(t => t.from === from && t.to === to);
  }

  validateTransition(from: S, to: S): void {
    if (!this.canTransition(from, to)) {
      throw new StateMachineError(
        this.definition.name,
        from,
        to,
        `STATUS_TRANSITION_INVALID: Cannot transition from ${from} to ${to} in ${this.definition.name}`,
      );
    }
  }

  isTerminal(state: S): boolean {
    return this.definition.terminalStates.includes(state);
  }

  getAvailableTransitions(from: S): S[] {
    return this.definition.transitions
      .filter(t => t.from === from)
      .map(t => t.to);
  }
}

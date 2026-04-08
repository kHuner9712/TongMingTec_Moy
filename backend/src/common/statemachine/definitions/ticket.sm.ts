import { StateMachine } from "../state-machine";

export type TicketStatus =
  | "pending"
  | "assigned"
  | "processing"
  | "resolved"
  | "closed";

export const ticketStateMachine = new StateMachine<TicketStatus>({
  name: "SM-ticket",
  states: ["pending", "assigned", "processing", "resolved", "closed"],
  initialState: "pending",
  terminalStates: ["closed"],
  transitions: [
    { from: "pending", to: "assigned" },
    { from: "pending", to: "closed" },
    { from: "assigned", to: "processing" },
    { from: "assigned", to: "closed" },
    { from: "processing", to: "resolved" },
    { from: "resolved", to: "closed" },
  ],
});

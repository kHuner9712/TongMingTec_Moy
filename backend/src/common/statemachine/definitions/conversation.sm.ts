import { StateMachine } from "../state-machine";

export type ConversationStatus = "queued" | "active" | "closed";

export const conversationStateMachine = new StateMachine<ConversationStatus>({
  name: "SM-conversation",
  states: ["queued", "active", "closed"],
  initialState: "queued",
  terminalStates: ["closed"],
  transitions: [
    { from: "queued", to: "active" },
    { from: "queued", to: "closed" },
    { from: "active", to: "active" },
    { from: "active", to: "closed" },
  ],
});

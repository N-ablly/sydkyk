import type { Person, Persona, PersonaId } from "./types";

/** Fixed fictional personas from demo_personas.json and employees.csv (SYDKYK, tenant sydkyk-ph). */
export const PERSONAS: Record<PersonaId, Persona> = {
  E0001: { id: "E0001", name: "Ana Reyes", initials: "AR", role: "Customer Success Specialist · Makati", scope: "Own records only" },
  E0002: { id: "E0002", name: "Mark Santos", initials: "MS", role: "Manager, Customer Success", scope: "Direct reports' workflows" },
  E0003: { id: "E0003", name: "Ben Cruz", initials: "BC", role: "Service Specialist · Engineering", scope: "Own records only" },
  E0004: { id: "E0004", name: "Liza Garcia", initials: "LG", role: "Employee Relations Specialist", scope: "Assigned case ER-DEMO-001" },
  E0005: { id: "E0005", name: "Paolo Ramos", initials: "PR", role: "IT Application Owner", scope: "ProjectHub, DesignDesk" },
  E0006: { id: "E0006", name: "Mia Flores", initials: "MF", role: "Finance Reviewer", scope: "Assigned Finance requests" },
  E0007: { id: "E0007", name: "Nico Mendoza", initials: "NM", role: "People Operations Reviewer", scope: "Assigned HR requests" },
  E0008: { id: "E0008", name: "Carla Lim", initials: "CL", role: "Workplace Coordinator · Makati", scope: "Makati office" },
  E0010: { id: "E0010", name: "Jose Santos", initials: "JS", role: "New joiner · starts Oct 19", scope: "Preboarding" },
};

/** Queues that are teams rather than named personas. */
export const QUEUES = {
  security: { name: "Security on-call", initials: "SC", role: "Security incidents queue" },
  payroll: { name: "Payroll team", initials: "PY", role: "ADP payroll inquiries (restricted)" },
  legal: { name: "ER & Legal review", initials: "LR", role: "Restricted review queue" },
  ap: { name: "Accounts Payable", initials: "AP", role: "Invoice exceptions queue" },
  itDesk: { name: "IT service desk", initials: "IT", role: "Device and access tasks" },
} satisfies Record<string, Person>;

export const persona = (id: PersonaId) => PERSONAS[id];

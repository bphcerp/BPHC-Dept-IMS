import { relations } from "drizzle-orm";
import { projects, investigators, fundingAgencies, projectCoPIs } from "./project.ts";

export const projectsRelations = relations(projects, ({ one, many }) => ({
  pi: one(investigators, {
    fields: [projects.piId],
    references: [investigators.id],
  }),
  fundingAgency: one(fundingAgencies, {
    fields: [projects.fundingAgencyId],
    references: [fundingAgencies.id],
  }),
  coPIs: many(projectCoPIs),
}));

export const investigatorsRelations = relations(investigators, ({ many }) => ({
  projects: many(projects),
  coPIProjects: many(projectCoPIs),
}));

export const fundingAgenciesRelations = relations(fundingAgencies, ({ many }) => ({
  projects: many(projects),
}));

export const projectCoPIsRelations = relations(projectCoPIs, ({ one }) => ({
  project: one(projects, {
    fields: [projectCoPIs.projectId],
    references: [projects.id],
  }),
  investigator: one(investigators, {
    fields: [projectCoPIs.investigatorId],
    references: [investigators.id],
  }),
})); 
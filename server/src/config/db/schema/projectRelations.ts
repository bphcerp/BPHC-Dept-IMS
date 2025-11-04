import { relations } from "drizzle-orm";
import { projects, investigators, fundingAgencies, projectCoPIs, projectPIs } from "./project.ts";

export const projectsRelations = relations(projects, ({ one, many }) => ({
  pi: one(investigators, {
    fields: [projects.piId],
    references: [investigators.id],
  }),
  fundingAgency: one(fundingAgencies, {
    fields: [projects.fundingAgencyId],
    references: [fundingAgencies.id],
  }),
  PIs: many(projectPIs),
  coPIs: many(projectCoPIs),
}));

export const investigatorsRelations = relations(investigators, ({ many }) => ({
  projects: many(projects),
  PIProjects: many(projectPIs),
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

export const projectPIsRelations = relations(projectPIs, ({ one }) => ({
  project: one(projects, {
    fields: [projectPIs.projectId],
    references: [projects.id],
  }),
  investigator: one(investigators, {
    fields: [projectPIs.investigatorId],
    references: [investigators.id],
  }),
})); 
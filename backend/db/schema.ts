import {
    serial,
    text,
    boolean,
    timestamp,
    pgTable,
    pgEnum,
    integer,
    primaryKey,
  } from 'drizzle-orm/pg-core';
  import { relations } from 'drizzle-orm';
  
  // 1. Define an enum for the ticket status
  export const ticketStatusEnum = pgEnum('ticket_status', [
    'Backlog',
    'To Do',
    'In Progress',
    'In Review',
    'Done',
    'Cancelled',
  ]);
  
  // 2. Projects table
  export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  });

  // 3. The main 'tickets' table
  export const tickets = pgTable('tickets', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id').notNull().references(() => projects.id),
    title: text('title').notNull(),
    context: text('context'), // ADR context field
    decision: text('decision'), // ADR decision field
    consequences: text('consequences'), // ADR consequences field
    status: ticketStatusEnum('status').default('Backlog').notNull(),
    isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  // 4. A table for 'people' or users
  export const people = pgTable('people', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').unique(),
    username: text('username').unique(), // For @mentions
  });
  
  // 5. Join table for the many-to-many relationship between tickets and people
  export const ticketsToPeople = pgTable(
    'tickets_to_people',
    {
      ticketId: integer('ticket_id')
        .notNull()
        .references(() => tickets.id),
      personId: integer('person_id')
        .notNull()
        .references(() => people.id),
    },
    // Define a composite primary key
    (t) => ({
      pk: primaryKey({ columns: [t.ticketId, t.personId] }),
    })
  );
  
  // 6. Join table for self-referencing ticket dependencies (many-to-many)
  export const ticketDependencies = pgTable(
    'ticket_dependencies',
    {
      // The ticket that has a dependency
      ticketId: integer('ticket_id')
        .notNull()
        .references(() => tickets.id),
      // The ticket it depends on
      dependsOnTicketId: integer('depends_on_ticket_id')
        .notNull()
        .references(() => tickets.id),
    },
    (t) => ({
      pk: primaryKey({ columns: [t.ticketId, t.dependsOnTicketId] }),
    })
  );

  // 7. Define relations
  export const projectsRelations = relations(projects, ({ many }) => ({
    tickets: many(tickets),
  }));

  export const ticketsRelations = relations(tickets, ({ one, many }) => ({
    project: one(projects, {
      fields: [tickets.projectId],
      references: [projects.id],
    }),
    people: many(ticketsToPeople),
    dependencies: many(ticketDependencies, {
      relationName: 'ticketDependencies',
    }),
    dependents: many(ticketDependencies, {
      relationName: 'ticketDependents',
    }),
  }));

  export const peopleRelations = relations(people, ({ many }) => ({
    tickets: many(ticketsToPeople),
  }));

  export const ticketsToPeopleRelations = relations(ticketsToPeople, ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketsToPeople.ticketId],
      references: [tickets.id],
    }),
    person: one(people, {
      fields: [ticketsToPeople.personId],
      references: [people.id],
    }),
  }));

  export const ticketDependenciesRelations = relations(ticketDependencies, ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketDependencies.ticketId],
      references: [tickets.id],
      relationName: 'ticketDependencies',
    }),
    dependsOnTicket: one(tickets, {
      fields: [ticketDependencies.dependsOnTicketId],
      references: [tickets.id],
      relationName: 'ticketDependents',
    }),
  }));
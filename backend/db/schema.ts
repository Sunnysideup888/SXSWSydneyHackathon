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
  
  // 2. The main 'tickets' table
  export const tickets = pgTable('tickets', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content'),
    decision: text('decision'),
    consequences: text('consequences'),
    status: ticketStatusEnum('status').default('To Do').notNull(),
    isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  });
  
  // 3. A table for 'people' or users
  export const people = pgTable('people', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').unique(),
  });
  
  // 4. Join table for the many-to-many relationship between tickets and people
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
  
  // 5. Join table for self-referencing ticket dependencies (many-to-many)
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
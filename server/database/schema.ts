import { relations, sql } from 'drizzle-orm'
import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import * as t from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: int('id').notNull().primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  lastUpdatedOpenedCals: text('date')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  lastUpdatedPresets: text('date')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
})

export const preset = sqliteTable('preset', {
  name: text('name').notNull().primaryKey(),
  createdById: int('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const presetPart = sqliteTable(
  'preset_part',
  {
    mode: text('mode', { enum: ['hours', 'tasks'] }).notNull(),
    partOfName: text('part_of')
      .notNull()
      .references(() => preset.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
    workTime: int('work_time').notNull(),
    defaultFrom: int('default_from').notNull(),
    defaultTo: int('default_to').notNull(),
    precision: int('precision').notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.partOfName, table.mode] })],
)

export const presetPartTag = sqliteTable(
  'preset_part_tag',
  {
    presetMode: text('preset_mode', { enum: ['hours', 'tasks'] }).notNull(),
    presetPartOfName: text('preset_part_of')
      .notNull()
      .references(() => preset.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.presetPartOfName, table.presetMode, table.name] }),
    t.foreignKey({
      columns: [table.presetPartOfName, table.presetMode],
      foreignColumns: [presetPart.partOfName, presetPart.mode],
    }),
  ],
)

export const presetGithubRepo = sqliteTable(
  'preset_github_repo',
  {
    owner: text('owner').notNull(),
    repo: text('repo').notNull(),
    partOfName: text('part_of')
      .notNull()
      .references(() => preset.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
    autocompleteWithoutOwner: int('autocomplete_without_owner', { mode: 'boolean' }).notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.partOfName, table.owner, table.repo] })],
)

export const presetGithubOwner = sqliteTable(
  'preset_github_owner',
  {
    owner: text('owner').notNull(),
    partOfName: text('part_of')
      .notNull()
      .references(() => preset.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [t.primaryKey({ columns: [table.partOfName, table.owner] })],
)

export const calc = sqliteTable('calc', {
  id: int('id').notNull().primaryKey({ autoIncrement: true }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  createdById: int('created_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode', { enum: ['hours', 'tasks'] }).notNull(),
  savedUpTime: int('saved_up_time').notNull(),
  savedUpVacation: real('saved_up_vacation').notNull(),
  workTime: int('work_time').notNull(),
  defaultFrom: int('default_from').notNull(),
  defaultTo: int('default_to').notNull(),
  precision: int('precision').notNull(),
})

export const calcEntry = sqliteTable('calc_entry', {
  id: int('id').notNull().primaryKey({ autoIncrement: true }),
  calcId: int('calc_id')
    .notNull()
    .references(() => calc.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  from: int('from'),
  to: int('to'),
  subtractedTime: int('subtracted_time'),
  useSubtractedTime: int('use_subtracted_time', { mode: 'boolean' }).notNull(),
  isTracking: int('is_tracking', { mode: 'boolean' }).notNull(),
  notes: text('notes'),
  idx: int('idx').notNull(),
})

export const calcEntryTag = sqliteTable(
  'calc_entry_tag',
  {
    name: text('name').notNull(),
    entryId: int('entry_id')
      .notNull()
      .references(() => calcEntry.id, { onDelete: 'cascade' }),
  },
  (table) => [t.primaryKey({ columns: [table.entryId, table.name] })],
)

export const calcTag = sqliteTable(
  'calc_tag',
  {
    name: text('name').notNull(),
    calcId: int('calc_id')
      .notNull()
      .references(() => calc.id, { onDelete: 'cascade' }),
    color: text('color').notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.calcId, table.name] })],
)

export const openedCalc = sqliteTable(
  'opened_calc',
  {
    userId: int('user_id')
      .notNull()
      .references(() => user.id),
    calcId: int('calc_id')
      .notNull()
      .references(() => calc.id),
  },
  (table) => [t.primaryKey({ columns: [table.userId, table.calcId] })],
)

export const userRelations = relations(user, ({ many }) => ({
  presets: many(preset),
  calcs: many(calc),
  openedCalcs: many(openedCalc),
}))

export const presetRelations = relations(preset, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [preset.createdById],
    references: [user.id],
  }),
  parts: many(presetPart),
  githubRepos: many(presetGithubRepo),
  githubOwners: many(presetGithubOwner),
}))

export const presetPartRelations = relations(presetPart, ({ one, many }) => ({
  partOf: one(preset, {
    fields: [presetPart.partOfName],
    references: [preset.name],
  }),
  tags: many(presetPartTag),
}))

export const presetPartTagRelations = relations(presetPartTag, ({ one }) => ({
  partOf: one(presetPart, {
    fields: [presetPartTag.presetPartOfName, presetPartTag.presetMode],
    references: [presetPart.partOfName, presetPart.mode],
  }),
}))

export const presetGithubRepoRelations = relations(presetGithubRepo, ({ one }) => ({
  partOf: one(preset, {
    fields: [presetGithubRepo.partOfName],
    references: [preset.name],
  }),
}))

export const presetGithubOwnerRelations = relations(presetGithubOwner, ({ one }) => ({
  partOf: one(preset, {
    fields: [presetGithubOwner.partOfName],
    references: [preset.name],
  }),
}))

export const calcRelations = relations(calc, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [calc.createdById],
    references: [user.id],
  }),
  entries: many(calcEntry),
  tags: many(calcTag),
  openedBy: many(openedCalc),
}))

export const calcEntryRelations = relations(calcEntry, ({ one, many }) => ({
  calc: one(calc, {
    fields: [calcEntry.calcId],
    references: [calc.id],
  }),
  tags: many(calcEntryTag),
}))

export const calcEntryTagRelations = relations(calcEntryTag, ({ one }) => ({
  entry: one(calcEntry, {
    fields: [calcEntryTag.entryId],
    references: [calcEntry.id],
  }),
}))

export const calcTagRelations = relations(calcTag, ({ one }) => ({
  calc: one(calc, {
    fields: [calcTag.calcId],
    references: [calc.id],
  }),
}))

export const openedCalcRelations = relations(openedCalc, ({ one, many }) => ({
  user: one(user, {
    fields: [openedCalc.userId],
    references: [user.id],
  }),
  calc: one(calc, {
    fields: [openedCalc.userId],
    references: [calc.id],
  }),
}))

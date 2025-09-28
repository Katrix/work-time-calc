import { relations, sql } from 'drizzle-orm'
import { type AnySQLiteColumn, int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
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
  currentPresetId: int('current_preset').references((): AnySQLiteColumn => preset.id, { onDelete: 'set null' }),
})

export const preset = sqliteTable(
  'preset',
  {
    id: int('id').notNull().primaryKey({ autoIncrement: true }),
    createdById: int('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),

    hoursWorkTime: int('hours_work_time').notNull(),
    hoursDefaultFrom: int('hours_default_from').notNull(),
    hoursDefaultTo: int('hours_default_to').notNull(),
    hoursPrecision: int('hours_precision').notNull(),
    tasksPrecision: int('tasks_precision').notNull(),

    easterHoliday: int('earlier_holiday', { mode: 'boolean' }).notNull(),
    ascensionHoliday: int('ascension_holiday', { mode: 'boolean' }).notNull(),
    pentecostHoliday: int('pentecost_holiday', { mode: 'boolean' }).notNull(),
    christmasHoliday: int('christmas_holiday', { mode: 'boolean' }).notNull(),
    saturdayHoliday: int('saturday_holiday', { mode: 'boolean' }).notNull(),
    sundayHoliday: int('sunday_holiday', { mode: 'boolean' }).notNull(),
  },
  (table) => [t.unique().on(table.createdById, table.name)],
)

export const presetPartTag = sqliteTable(
  'preset_part_tag',
  {
    presetId: int('preset_id')
      .notNull()
      .references(() => preset.id, { onDelete: 'cascade' }),
    presetMode: text('preset_mode', { enum: ['hours', 'tasks'] }).notNull(),
    name: text('name').notNull(),
    color: text('color').notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.presetId, table.presetMode, table.name] })],
)

export const presetGithubOwner = sqliteTable(
  'preset_github_owner',
  {
    presetId: int('preset_id')
      .notNull()
      .references(() => preset.id, { onDelete: 'cascade' }),
    owner: text('owner').notNull(),
    active: int('active', { mode: 'boolean' }).notNull(),
    autocompleteWithoutOwner: int('autocomplete_without_owner', { mode: 'boolean' }).notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.presetId, table.owner] })],
)

export const presetGithubRepo = sqliteTable(
  'preset_github_repo',
  {
    presetId: int('preset_id')
      .notNull()
      .references(() => preset.id, { onDelete: 'cascade' }),
    owner: text('owner').notNull(),
    repo: text('repo').notNull(),
    autocompleteWithoutRepository: int('autocomplete_without_repository', { mode: 'boolean' }).notNull(),
  },
  (table) => [
    t.primaryKey({ columns: [table.presetId, table.owner, table.repo] }),
    t.foreignKey({
      columns: [table.presetId, table.owner],
      foreignColumns: [presetGithubOwner.presetId, presetGithubOwner.owner],
    }).onDelete('cascade'),
  ],
)

export const presetFixedHoliday = sqliteTable(
  'preset_fixed_holiday',
  {
    presetId: int('preset_id')
      .notNull()
      .references(() => preset.id, { onDelete: 'cascade' }),
    from: text('from').notNull(),
    to: text('to').notNull(),
  },
  (table) => [t.primaryKey({ columns: [table.presetId, table.from, table.to] })],
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

export const userRelations = relations(user, ({ many, one }) => ({
  presets: many(preset),
  calcs: many(calc),
  openedCalcs: many(openedCalc),
  currentPreset: one(preset, {
    fields: [user.currentPresetId],
    references: [preset.id],
  }),
}))

export const presetRelations = relations(preset, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [preset.createdById],
    references: [user.id],
  }),
  presetPartTags: many(presetPartTag),
  githubOwners: many(presetGithubOwner),
  githubRepos: many(presetGithubRepo),
  fixedHolidays: many(presetFixedHoliday),
  currentBy: many(user),
}))

export const presetPartTagRelations = relations(presetPartTag, ({ one }) => ({
  preset: one(preset, {
    fields: [presetPartTag.presetId],
    references: [preset.id],
  }),
}))

export const presetGithubOwnerRelations = relations(presetGithubOwner, ({ one, many }) => ({
  partOf: one(preset, {
    fields: [presetGithubOwner.presetId],
    references: [preset.id],
  }),
  repos: many(presetGithubRepo),
}))

export const presetGithubRepoRelations = relations(presetGithubRepo, ({ one }) => ({
  partOf: one(presetGithubOwner, {
    fields: [presetGithubRepo.presetId, presetGithubRepo.owner],
    references: [presetGithubOwner.presetId, presetGithubOwner.owner],
  }),
  preset: one(preset, {
    fields: [presetGithubRepo.presetId],
    references: [preset.id],
  })
}))

export const presetFixedHolidayRelations = relations(presetFixedHoliday, ({ one }) => ({
  preset: one(preset, {
    fields: [presetFixedHoliday.presetId],
    references: [preset.id],
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

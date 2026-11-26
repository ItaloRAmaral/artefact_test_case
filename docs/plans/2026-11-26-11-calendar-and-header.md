# Plan: an English calendar, the Task board name and an aligned header

| Field   | Value                                                                                                                                                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | Done                                                                                                                                                                                                                                                                                                |
| Date    | 2026-11-26                                                                                                                                                                                                                                                                                          |
| Request | A reviewer's notes, sent by the user: "O modal do calendário tá pt enquanto o resto tá em ingles"; "tem algo no alinhamento mesmo do New Task com Clean filters e a barra do input"; "o nome da aplicação tá como Tasks, eu colocaria algo como Task Board"                                         |
| Context | `docs/SPEC.md` §3 (list filters, "less is more"); DECISIONS D-03 (English everywhere), D-14 (dates in local time after hydration), D-19 (release age), D-33 (no component library), D-34 (filters), D-37 (board look), D-40 (styled status list, checked days); `code-style.md` (Next.js and React) |

**Goal:** the creation-day filter picks its days from a calendar that is always English and drawn in the board's look; every date on the page is English; the app is called Task board; `New task` and `Clear filters` line up.

**Architecture:**

- **Calendar:** `react-day-picker` draws the month grid (keyboard, ARIA). A new `DayField` in `src/app/_components/day-field/` puts it in a panel under a button that looks like a field. `TaskFilters` uses two of them in place of the native date inputs.
- **No server change:** the filter's contract (`createdFrom`, `createdBefore` as ISO instants, D-34) and SSR stay as they are.

## Global constraints

- **Dependency:** `react-day-picker` `10.0.2`, pinned exactly in `dependencies`. It was published 2026-09-30, so it is older than the 7 days of D-19. It brings `date-fns` (`^4.1.0`) and `@date-fns/tz` (`^1.4.1`), resolved by pnpm within the release-age rule. Do not bypass `minimumReleaseAge`, and do not run `pnpm approve`.
  - `@daypicker/react`, the name the v10 docs use, only depends on `react-day-picker@10.0.2` (checked with `pnpm view`), so the plan installs `react-day-picker` and saves a package.
  - No `react-day-picker/style.css`: every part is styled through the `classNames` prop with the theme tokens.
- **Locale:** DayPicker's default, `en-US` (docs: "Localization"). The field and the card dates use `Intl.DateTimeFormat('en-US', …)`.
- **Accessible names:**
  - The day buttons are DayPicker's defaults: `labelDayButton` formats `PPPP`, which gives `Friday, November 20th, 2026`, with a `Today, ` prefix and a `, selected` suffix. The arrows are `Go to the Previous Month` and `Go to the Next Month`. A disabled day's button is `disabled` (read in `dist/esm/DayPicker.js`).
  - The field buttons are named `Created from <value>` and `Created to <value>`, where the value is `Nov 20, 2026` or `Pick a day`.
- **Phone:** at 390 px, no horizontal scroll. The From panel opens aligned to the left edge of its field, the To panel to the right edge of its field.

## Decisions with the user

| Question                                                    | Answer                                                                                                                | Date       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| Calendar in the browser's language                          | Replace the native date input with `react-day-picker`, styled like the page (not typed, picked)                       | 2026-11-26 |
| Header alignment                                            | `Clear filters` stays in the search row, as a bordered button whether or not a filter is set, aligned with `New task` | 2026-11-26 |
| App name                                                    | `Task board` (sentence case, like the rest of the UI): heading, tab title, README title                               | 2026-11-26 |
| Card dates in the browser's language (found while planning) | Proposed: `en-US` too, so the whole page is English (D-03). The user confirms on approving this plan                  | 2026-11-26 |

## Review focus

- **Closing the panel:** a click outside closes it. So do Escape and choosing a day, and both of those return the focus to the field button.
- **Tab leaving the panel:** focus leaving the panel closes it.
- **Clearing a day:** with a day set, the panel offers `Clear`. Without one, it offers nothing to clear. Clicking the chosen day again keeps it (`required`).
- **Range:** in From, the days after To are disabled; in To, the days before From are disabled. An inverted range can then only come from a hand-edited URL, and the server answers it with an empty list, as today.
- **Month shown on open:** the chosen day's month. Without one, To opens on From's month, and otherwise the panel opens on the current month.
- **Before hydration:** the fields show `Pick a day`, as the native ones showed empty. After it, they show the local days, so the server HTML and the first client render match (D-14).
- **Day boundaries:** a chosen day becomes the start of that local day for From, and the start of the next local day for To, as today (the existing tests keep their instants).

## Security

| Threat                                | How this plan handles it                                                                                                                    | Task and test                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Supply chain (new runtime dependency) | Exact pin, a release older than 7 days, the lockfile committed, no install scripts approved; DayPicker and date-fns are widely used and MIT | Task 2, `pnpm install` output |
| Input validation                      | Unchanged: the filter still goes through `taskListFilterSchema` on the server; the calendar only produces dates the schema already accepts  | existing router tests         |
| XSS                                   | No new rendered user text: the field shows a formatted date                                                                                 | —                             |
| Server code in the client             | `DayField` imports nothing from `src/server/`                                                                                               | `pnpm build`                  |

## Test plan

| Requirement or review-focus line           | Level     | Test name                                                                                                                                                                                                          | Task |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| Name                                       | component | `shows the heading` (existing, value `Task board`)                                                                                                                                                                 | 1    |
| Name                                       | e2e       | `home.spec.ts` heading, `task-form.spec.ts` heading (updated)                                                                                                                                                      | 1    |
| Field shows the day                        | component | `shows the chosen day in the field`                                                                                                                                                                                | 2    |
| Field without a day                        | component | `shows Pick a day without a day`                                                                                                                                                                                   | 2    |
| Month on open                              | component | `opens the calendar on the month of the chosen day`                                                                                                                                                                | 2    |
| Month on open (no day, earliest day)       | component | `opens the calendar on the month of the earliest day without a day`                                                                                                                                                | 2    |
| Focus into the grid                        | component | `moves the focus into the calendar when it opens`                                                                                                                                                                  | 2    |
| Choosing                                   | component | `chooses a day and closes the calendar`                                                                                                                                                                            | 2    |
| Focus back                                 | component | `returns the focus to the field after choosing a day`                                                                                                                                                              | 2    |
| Escape                                     | component | `closes the calendar with Escape and returns the focus`                                                                                                                                                            | 2    |
| Click outside                              | component | `closes the calendar when the user clicks outside`                                                                                                                                                                 | 2    |
| Tab leaving                                | component | `closes the calendar when the focus leaves it`                                                                                                                                                                     | 2    |
| Range                                      | component | `disables the days before the earliest day`, `disables the days after the latest day`                                                                                                                              | 2    |
| Clear                                      | component | `clears the day`, `offers no Clear without a day`                                                                                                                                                                  | 2    |
| Keep on second click                       | component | `keeps the day when it is chosen again`                                                                                                                                                                            | 2    |
| Filter conversion                          | component | `applies the start of the From day in local time`, `applies the start of the day after To in local time` (rewritten)                                                                                               | 3    |
| Filter shows URL days                      | component | `shows the search and the days of the filter` (rewritten)                                                                                                                                                          | 3    |
| Clear one day                              | component | `removes a date when it is cleared` (rewritten)                                                                                                                                                                    | 3    |
| Other filters kept                         | component | `keeps the other filters when a date changes` (rewritten)                                                                                                                                                          | 3    |
| Range in the filter                        | component | `keeps To from starting before From` (rewritten)                                                                                                                                                                   | 3    |
| List filtered by day                       | component | `filtered-task-list` tests that set `Created from` (rewritten to pick the day)                                                                                                                                     | 3    |
| Real browser                               | e2e       | `filters tasks by creation date` (picks the 1st of next month), the URL days test (button names)                                                                                                                   | 3    |
| Everything English in a Portuguese browser | e2e       | `shows the calendar and the dates in English in a Portuguese browser` (`test.use({ locale: 'pt-BR' })`: the card date starts with a month abbreviation such as `Nov`, the open grid is named like `November 2026`) | 3    |

- **Levels used and why:**
  - Component tests cover the calendar's behavior and the filter conversion.
  - The e2e tests prove the flow in Chromium.
  - No unit or router test: nothing changes on the server.
- **Test data:** `DayField` and `TaskFilters` tests freeze the date at `2026-11-26T12:00:00` local time. They use `vi.setSystemTime`, with fake `Date` only in `DayField`, so `userEvent` works. `TaskFilters` keeps its existing fake timers and uses `fireEvent`. The run's `TZ` is `America/Sao_Paulo`, so the existing instants (`2026-11-20T03:00:00.000Z`) keep their values.
- **Removed:** the native-input tests of D-40 have nothing left to test. These are the calendar on any click, the year cap, the typed-range and invalid-day errors, the early-year pad, and the e2e `keeps the typed year at four digits`. `src/test/show-picker.ts` goes too, and so does its line in `tests.md`.
- **Targets:** server coverage is unchanged (at least 90%). Every new test gets a sabotage check.
- **How to run:** `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`. Run them a few files at a time.

## Style deviations

None. `DayField` gets its own folder: it is used by one page, so it goes in that route's `_components/` (D-32). It is deep (panel, focus, closing and styling behind five props), which is not a shallow wrapper.

---

## Task 1: the Task board name and the header alignment

**Files:**

- Modify: `src/app/page.tsx` (`Task board` heading; `New task` gets `h-10 w-32`)
- Modify: `src/app/layout.tsx` (`metadata.title`: `Task board`)
- Modify: `src/app/_components/task-filters/index.tsx` (`Clear filters`: `button button-secondary h-10 w-32`, always bordered)
- Modify: `README.md` (title `# Task board`)
- Test: `src/app/_components/filtered-task-list/index.test.tsx`, `e2e/home.spec.ts`, `e2e/task-form.spec.ts` (heading `Task board`)

**Interfaces:** none.

- [ ] **Step 1:** change the expected heading in the three tests to `Task board` and watch them fail (`pnpm test src/app/_components/filtered-task-list`).
- [ ] **Step 2:** rename the heading and the title, and apply the classes.
  - `New task` and `Clear filters` have the same width (128 px) and height (40 px), so their left and right edges coincide.
  - The search keeps `flex-1`.
  - The list's `aria-label="Tasks"` stays: it names the list, not the app.
- [ ] **Step 3:** tests pass. A screenshot at 900 px and 390 px, light and dark, shows the two buttons aligned.

**Suggested commit:** `feat(web): name the app Task board and align the header buttons`

---

## Task 2: `DayField`, a calendar in the board's look

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml` (`react-day-picker` `10.0.2`)
- Create: `src/app/_components/day-field/index.tsx`, `src/app/_components/day-field/index.test.tsx`

**Interfaces:**

- Produces:

```ts
export function DayField(props: {
  label: string;
  day: Date | undefined;
  earliestDay?: Date;
  latestDay?: Date;
  align: 'start' | 'end';
  onDayChange: (day: Date | undefined) => void;
}): React.ReactElement;
```

`day` and the value passed to `onDayChange` are local midnights, as DayPicker gives them.

- [ ] **Step 1: write the failing tests** (names in the test plan). Values:
  - The field is `getByRole('button', { name: 'Created from Nov 20, 2026' })` with `day = new Date(2026, 10, 20)`, and `{ name: 'Created from Pick a day' }` without one.
  - The grid is `getByRole('grid', { name: 'November 2026' })`.
  - Choosing is a click on `Friday, November 20th, 2026`, which calls `onDayChange` with `new Date(2026, 10, 20)`, removes the panel (`queryByRole('dialog')` is null) and focuses the field.
  - With `earliestDay = new Date(2026, 10, 20)`, `Thursday, November 19th, 2026` is disabled. With `latestDay` the same, `Saturday, November 21st, 2026` is disabled.
  - `Clear` calls `onDayChange(undefined)`. A click on `document.body` closes the panel, and so does a `Tab` past the panel's last control.
- [ ] **Step 2:** install with `pnpm add react-day-picker@10.0.2 --save-exact`, run the tests, and watch them fail because `DayField` does not exist.
- [ ] **Step 3: implement `DayField`**:
  - **Field:** a wrapper `relative` holding a visible `<span id={labelId}>` with the label, and a `<button type="button" class="field …">`.
    - The button has `aria-labelledby="{labelId} {valueId}"`, `aria-haspopup="dialog"` and `aria-expanded`, and shows a calendar icon.
    - Its value is `new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(day)`, or `Pick a day` in `text-ink-muted`.
  - **Panel:** while open, a `div role="dialog" aria-labelledby={labelId}` (`card shadow-lg p-3 absolute top-full z-20 mt-1.5`, `left-0` or `right-0` by `align`) holds:
    - `<DayPicker mode="single" required selected={day} onSelect={…} disabled={…} defaultMonth={day ?? earliestDay} autoFocus />`. `disabled` gets `{ before: earliestDay }` and `{ after: latestDay }`, each only when given.
    - When a day is set, a `Clear` text button.
  - **Closing:** Escape on the panel, a `pointerdown` on the document outside the wrapper (a listener only while open), focus leaving the wrapper (`onBlur` with a `relatedTarget` outside it), and choosing or clearing a day. Escape and choosing return the focus to the button (a ref).
  - **Styling:** `classNames` with the tokens.
    - `month_caption`: the bold month.
    - `nav`, with `button_previous` and `button_next` as `icon-button` size 8 at the top right.
    - `weekday`: `text-ink-muted` `text-xs`.
    - `day_button`: `size-9 rounded-lg hover:bg-ink/5` with the focus outline.
    - `selected`: accent background and `accent-contrast` text.
    - `today`: `text-accent font-semibold`.
    - `disabled`: `opacity-40`, `cursor-not-allowed`.
    - `outside`: hidden (DayPicker's default `showOutsideDays={false}`).
- [ ] **Step 4:** tests pass, and every rule gets a sabotage check (no Escape handler, no outside listener, no `required`, no `disabled`, no focus return).

**Suggested commit:** `feat(web): add a day field with an English calendar`

---

## Task 3: the filters use `DayField`; English card dates; docs

**Files:**

- Modify: `src/app/_components/task-filters/index.tsx`
  - Remove `DateField`, `LAST_DAY`, the error constants, `dayRangeError`, `isInvalidDay` and `typedDays`.
  - `toLocalDay` becomes `toLocalDate(iso: string | undefined, msBefore: number): Date | undefined`, the local midnight of that instant.
  - `startOfLocalDay(day: Date, daysLater: number): Date`.
  - From is `<DayField label="Created from" day={fromDate} latestDay={toDate} align="start" />` and To is `<DayField label="Created to" day={toDate} earliestDay={fromDate} align="end" />`.
  - `onDayChange` sets `createdFrom` to the `startOfLocalDay(day, 0)` ISO and `createdBefore` to the `startOfLocalDay(day, 1)` ISO, or `undefined` without a day.
- Modify: `src/app/_components/task-date/index.tsx` (`Intl.DateTimeFormat('en-US', …)`)
- Delete: `src/test/show-picker.ts`, and its import in `src/test/setup-dom.ts`
- Test: `src/app/_components/task-filters/index.test.tsx`, `src/app/_components/filtered-task-list/index.test.tsx`, `e2e/list-page.spec.ts`, new `e2e/locale.spec.ts`. `src/app/_components/task-date/index.test.tsx` stays as is: jsdom's default locale is already `en-US`, so a component test could not fail before the change; only a browser set to another language proves it.
- Docs:
  - `docs/DECISIONS.md`: a new D-41, "An English calendar from react-day-picker", with D-40's "Days" and "Checked days" marked _Superseded by D-41_ and D-33 marked _Superseded in part by D-41_ (one library, for the calendar grid only).
  - `CLAUDE.md`: a stack row for `react-day-picker`.
  - `.claude/rules/tests.md`: drop `show-picker.ts`.
  - `README.md`: the Created from / Created to line.

**Interfaces:** consumes `DayField` (Task 2).

- [ ] **Step 1:** rewrite the date tests of the test plan and watch them fail.
  - They open the field (`fireEvent.click` on `Created from Pick a day`) and click a day (`Friday, November 20th, 2026`). They expect the same instants as today.
  - In `filtered-task-list`, the four `fireEvent.change` calls on `Created from` become the same two clicks.
  - `e2e/locale.spec.ts` (`test.use({ locale: 'pt-BR' })`) creates a task, opens the list, expects the card's `time` to match `/^[A-Z][a-z]{2} \d{1,2}, \d{4}/` and, after opening `Created from`, a grid named `/^[A-Z][a-z]+ \d{4}$/` (an English month, where pt-BR would give `novembro de 2026`). It fails before the `en-US` pin on the card date.
- [ ] **Step 2:** implement the changes. The tests pass, with sabotage checks on From's `latestDay` and To's `earliestDay` and on `startOfLocalDay(day, 1)`.
- [ ] **Step 3: e2e.**
  - `filters tasks by creation date` opens `Created from`, clicks `Go to the Next Month`, then clicks the day whose name matches `/ 1st, /`. The task created today disappears.
  - The test that loads days from the URL expects the buttons `Created from Nov 20, 2026` and `Created to Nov 20, 2026`.
  - Remove `keeps the typed year at four digits`.
  - Run `pnpm test:e2e`.
- [ ] **Step 4:** run the full suite, lint, typecheck and format. A screenshot at 900 px and 390 px, light and dark, with the From and To panels open.

**Suggested commit:** `feat(web): pick the creation days from an English calendar`

---

## Task 4: README media

**Files:** `docs/images/demo.gif`, `docs/images/list-light.png`, `docs/images/list-dark.png`

- [ ] Regenerate them with the same throwaway script and ffmpeg settings as before (800 px, about 14 s, 128 colors). The GIF adds one step: picking a day in `Created from`. Remove the script afterwards.
- [ ] Set this plan's status to "Done".

**Suggested commit:** `docs: refresh the README demo and screenshots`

---

## Review

| #   | Finding                                                                                                                                                                                                              | Source         | Accepted? | Reason                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Card dates also follow the browser's language (`Intl.DateTimeFormat(undefined, …)`)                                                                                                                                  | self-review    | Yes       | Added to Task 3 as a proposal the user confirms; the page would otherwise still mix languages                                                        |
| 2   | `@daypicker/react` is only a wrapper around `react-day-picker`                                                                                                                                                       | self-review    | Yes       | Install the real package, one fewer dependency                                                                                                       |
| 3   | The D-40 work is still uncommitted                                                                                                                                                                                   | self-review    | Yes       | Commit it first, so D-41 supersedes a recorded decision                                                                                              |
| 4   | A component test of the `en-US` card date passes before the change (jsdom is already `en-US`)                                                                                                                        | self-review    | Yes       | Proved by an e2e in a `pt-BR` browser instead                                                                                                        |
| 5   | While building: the outside click needs no `pointerdown` listener; the panel's `tabIndex={-1}` keeps a click inside it from moving the focus out, so the same `onBlur` that handles Tab also handles a click outside | implementation | Yes       | One closing path instead of two; `closes the calendar when the user clicks outside` and `closes the calendar when the focus leaves it` both cover it |

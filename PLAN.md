# PLAN.md — Уніфікація дизайну мобільного застосунку

Документ ведеться по ходу роботи: контекст, рішення, відкриті питання, прогрес.

## Контекст

Існує колізія між старою і новою архітектурою дизайну в **web** (`src/app/`) і **mobile** (`mobile/`) застосунках. У web вже частково виправлено — головний екран `/app/space` використовує **Liquid**-дизайн-систему (`LiquidCard`, `LiquidSwitcher`, `LiquidStatTile`, `LiquidTabs`, `LiquidInfoBubble`).

Мобільний аналог — **Glass**-система (`mobile/components/glass.tsx`): `GlassBg`, `GlassCard`, `GlassHeader`, `GlassPill`, `GlassTabs`, `GlassStatTile`.

Стара система — `mobile/components/ui.tsx`: `Card`, `Title`, `Body`, `Eyebrow`, `Metric`, `ActionButton`. Ще імпортується у 7 екранах.

## Інструменти

- **vexp-cli** (npx vexp-cli) — graph-RAG context engine. Ініціалізовано в корені проєкту. Корисні команди для цієї роботи:
  - `npx vexp-cli skeleton <file>` — токен-економний скелет файла (замість `Read` для великих файлів типу `workbench.tsx` на 3920 рядків).
  - `npx vexp-cli capsule "<task>"` — контекстна капсула для задачі (наприклад, "migrate workbench to Glass").
  - `npx vexp-cli impact <fqn>` — хто залежить від символу (важливо коли видаляємо/перейменовуємо).

## Архітектурні рішення

1. **Glass — канонічна мобільна дизайн-система.** Усі нові примітиви додаються в `glass.tsx`. Старий `ui.tsx` залишається тонким адаптером, щоб не ламати імпорти у 7 файлах.
2. **Один екран — одна відповідальність.** `home.tsx` НЕ дублює дашборд `workbench`/`management`/`learning`. Швидкі лічильники приладів/реагентів живуть у workbench, задачі — у management, тощо.
3. **`space.tsx` — головний таб.** Аналог веб `/app/space`. Містить workspace switcher + grid статистики + список проєктів. Звідти користувач переходить у конкретний проєкт.
4. **`projects.tsx` — legacy fallback.** Перевірити, чи дублює space — якщо так, видалити з табів.

## Прогрес

### ✅ Фаза 1 — Дизайн-система і головні екрани (готово 2026-05-16)

- [x] Розширено `mobile/components/glass.tsx`: додано `GlassSwitcher`, `GlassCTA`, `GlassSectionHeader`, `GlassItemCard`, `GlassEyebrow`. (~217 нових рядків)
- [x] Переписано `mobile/app/(tabs)/space.tsx`: додано greeting + meta, 4-card stats grid (Всього/Особисті/Інст./Ініціат.), розділи на Glass-компонентах. (416 рядків)
- [x] Переписано `mobile/app/(tabs)/home.tsx`: 1249 → 919 рядків. Видалено дублі з workbench/management (alerts, 2×2 stats, PieChart, BarChart, quick-actions, expiry warning, GLP reminder, generic metrics). Залишено: top bar (search + bell), Lab/Generic hero, MyDay, LabPulse, ActivityMini.
- [x] `mobile/components/ui.tsx` — переведено на тонкі обгортки над Glass. API збережено.
- [x] `tsc --noEmit` чистий.

### ✅ Фаза 2 — Решта табів (готово 2026-05-17)

#### Таб 1: `workbench.tsx` (3920 рядків)

- [x] Skeleton через `vexp-cli skeleton` — структура зрозуміла без читання всього файла.
- [x] **Висновок**: великий перепис не потрібен. Shell (`WorkbenchScreen`, `LabDashboard`, `GenericDashboard`, `LabModuleTile`) вже стилістично узгоджений: LinearGradient lab banner, grouped sections (Наука/Безпека/Аналітика/Документи), кольорові left-borders. Функціональні модулі (Inventory, Equipment, Experiments, GLP, Safety, etc.) працюють.
- [x] **Не дублює `home.tsx`**, бо для laboratory-проєктів _layout.tsx ховає home (`href: null`) і workbench — головний таб лабораторії; для non-lab — навпаки.
- [x] Виправлений системний баг: `ActionButton` приймав lucide-імена (`ArrowLeft`), але код подавав Feather kebab-case (`arrow-left`) → іконки взагалі не рендерилися. Додано `resolveIcon()` в `ui.tsx`, що нормалізує обидва формати. Це автоматично покрило workbench, management, learning і всі інші місця.

#### Таб 2: `management.tsx` (286 рядків)

- [x] Прибрано мертвий `TabButton`, невикористовувані стилі (`tab*`, `tabScroll*`, `subTabs/subTab*`), `ScrollView` вкладений у `Screen.ScrollView` (потенційний warning).
- [x] `PlanningView` під-таби (Задачі/Віхи) переведено з locale-стилів на `GlassTabs`.
- [x] Прибрано зайвий `style={{ marginBottom: 4 }}` на header GlassCard.

#### Таб 3: `learning.tsx` (621 рядок)

- [x] Прибрано мертвий `TabButton`, невикористовувані `tab*`, `tabScroll*`, `tabsSmall*` стилі.
- [x] CourseDetailView (Зміст/Оцінки) — внутрішні under-tabs замінено на `GlassTabs` з badge.
- [x] Прибрано зайвий header margin.

#### Таб 4: `profile.tsx` (273 рядки)

- [x] Вже на Glass — `GlassCard` + `GlassPill` + кастомні `StatCard/MenuItem` + gradient avatar ring + glass menu items. Зміна тільки одна: посилання "Змінити" workspace → `/space` замість legacy `/projects`.

### ✅ Фаза 3 — Entry-точки і деталі (готово 2026-05-17)

- [x] `mobile/app/projects.tsx` — конвертовано в redirect-екран на `/space` (3 рядки), щоб не зламати deep-link.
- [x] `mobile/app/login.tsx` — переписано: lucide-іконки замість Feather, glass-style input fields, show/hide password toggle, MotiView вхід, ArrowRight на CTA, перенаправляє на `/space` (не `/projects`).
- [x] `mobile/app/register.tsx` — те саме: glass inputs, show/hide password, MotiView, redirect to `/space`.
- [x] `mobile/app/index.tsx` (onboarding) — переписано: gradient blob backdrop, MotiView staggered animations, фічі-список, primary CTA + secondary "Створити акаунт" link.
- [x] `mobile/app/item/[id].tsx` — вже повністю на Glass-системі (`GlassCard`, `GlassPill`, LinearGradient hero, статусні pills, workspaces toggles, legacy hint, danger zone). Прибрано лише невикористовуваний імпорт `type Workspace`.

## Відкриті питання

- Чи `workbench.tsx` варто розбити на кілька файлів? 3920 рядків. На зараз — НІ: кожен модуль (InventoryModule, EquipmentModule, ExperimentsModule, GlpJournalModule, SafetyModule…) є самодостатнім і вони рідко перетинаються. Перенос у окремі файли — це окремий рефактор для окремого PR.
- Що робити з `home.tsx` (919 рядків), який прихований у табах (`href: null`)? Поки лишається як легасі-точка переходу з space.tsx (`legacyProjectId`). Видалення можна планувати після повної міграції legacy-проєктів на нову `WorkspaceItem` модель (фаза A3 — повний редактор).

## Фаза M — Item-first архітектура (готово 2026-05-17, "жорсткий" варіант)

**Передумова**: legacy таби (workbench/learning/management) пов'язані з `activeProjectId` (= legacy `MobileProject` id), а нові `WorkspaceItem` відкривалися лише через universal `/item/[id]` без deep UI. Користувач має ментальну модель: Простір=етап (Аспірантура), Проєкти=частини (Навчання/PhD/Лабораторія). Інтегрував.

### Архітектурне рішення

Замість міграції 30+ полів `projectId → itemId` (величезний рефактор з backend) — **derived adapter**:

- `activeWorkspaceItemId: string | null` — нове джерело істини в store. Item-first.
- `activeProjectId` — тепер **derived** через `useMemo` з активного Item:
  - якщо `item.legacyProjectId` є → `activeProjectId = item.legacyProjectId` (legacy fetch-функції продовжують працювати з API)
  - інакше → `activeProjectId = item.id` (новий Item використовує власний id як projectId; для нього API повертає пусто — це нормально, дані додаються)
- `activeWorkspaceItem: WorkspaceItem | null` — повний об'єкт; legacy MobileProjects, що ще не мають свого WorkspaceItem, обгортаються в ad-hoc Item з `id = "legacy_<projectId>"`.
- `setActiveWorkspaceItem(itemId, remember?)` — новий API.
- `setActiveProject(id, remember)` — backward-compat обгортка: знаходить item за legacyProjectId або падає на `legacy_<id>` формат.

AsyncStorage: новий ключ `research_navigator_mobile.active_workspace_item.v1`. На init: спочатку читається він, fallback — старий `ACTIVE_PROJECT_KEY` (мапиться в `legacy_<id>`).

### Кроки M1–M6

| Етап | Файли | Що зроблено |
|---|---|---|
| M1 | `mobile-store.tsx` | Додано `activeWorkspaceItemId` state + useMemo `activeWorkspaceItem` + useMemo `activeProjectId` (derived); новий `setActiveWorkspaceItem`; перероблено `setActiveProject` як обгортку; AsyncStorage init/persist. |
| M2 | `space.tsx` | `handleOpenItem` тепер викликає `setActiveWorkspaceItem(item.id, true)` і обирає таб за `item.type`: `laboratory → /workbench`, `course/phd/bachelor/master → /learning`, інші → `/item/[id]`. |
| M3 | `(tabs)/_layout.tsx` | Таби відображаються за `activeWorkspaceItem.type`, не за legacy `projectType`. `management` тепер показується для **всіх** типів (планування потрібне всім). |
| M4 | `home.tsx`, `workbench.tsx`, `management.tsx` | Замість `currentProject = projects.find(...)` — item-first з fallback на legacy. Title/acronym/BSL/roomNumber беруться з `item.title / item.tags[0] / item.fields.bslLevel / item.fields.roomNumber`. Поточні fetch-функції далі працюють із derived `activeProjectId`. |
| M5 | `item/[id].tsx` | Замість одного "Відкрити робочий простір" — кілька type-specific кнопок: "Дослідна панель" (laboratory→workbench), "PhD план"/"Курси та оцінки" (phd/course→learning), "Менеджмент" (всім→management), "Старий дашборд" (для legacy→home). Кожна викликає `setActiveWorkspaceItem` перед навігацією. |
| M6 | TS, PLAN, memory | `tsc --noEmit` EXIT=0. PLAN.md і memory оновлені. |

### Що тепер працює

1. Користувач створює Простір "Аспірантура" з template=education.
2. Створює Проєкти всередині: course / phd / laboratory.
3. Тиснучи на проєкт у space.tsx, потрапляє відразу в правильний таб:
   - Laboratory → Workbench (модулі: інвентар, обладнання, експерименти, GLP, safety)
   - PhD/Course → Learning (розклад, курси, нагадування, PhD план)
   - Management — доступний з будь-якого item.
4. Метадані (title, BSL, room) скрізь беруться з активного WorkspaceItem.
5. Legacy MobileProject продовжують працювати — обгортаються в ad-hoc `WorkspaceItem` з `id = "legacy_<projectId>"`.

### Залишки технічного боргу

- **Поки що нові WorkspaceItem-и (без `legacyProjectId`) показують пусті списки в workbench/learning/management**, бо їхній id не відомий backend API. Це очікувано — дані додаються (створення reagent, expedition, course тощо вже зберігаються з `projectId = item.id` локально через AsyncStorage; синхронізація з backend — окрема задача).
- **fetchLearningData / fetchPhdPlan / fetchProjectDetails** все ще роблять запит `?projectId=...` на legacy маршрути. Це нормально для legacy items; для нових — пусто. Можна або: (a) додати створення MobileProject-counterpart при створенні нового WorkspaceItem, (b) перевести backend на itemId-маршрути. Поза межами цього раунду.
- **home.tsx** залишається як backward-compat екран для legacy. Можна планувати видалення після повної міграції.

## Підсумок змін (фаза 2 + 3, 2026-05-17)

| Файл | Зміна |
|---|---|
| `mobile/components/ui.tsx` | Додано `resolveIcon()`: ActionButton/Metric тепер приймає і lucide PascalCase, і Feather kebab-case. |
| `mobile/app/(tabs)/management.tsx` | -19 рядків мертвого коду; підтаби → GlassTabs; вкладений ScrollView → View. |
| `mobile/app/(tabs)/learning.tsx` | Аналогічно; CourseDetailView внутрішні таби → GlassTabs з badge. |
| `mobile/app/(tabs)/profile.tsx` | "/projects" → "/space" у dropdown "Змінити". |
| `mobile/app/projects.tsx` | 162 → 11 рядків. Тепер це redirect → /space. |
| `mobile/app/login.tsx` | Glass input + show/hide pwd + MotiView + lucide icons; "/projects" → "/space". |
| `mobile/app/register.tsx` | Те саме. |
| `mobile/app/index.tsx` | Onboarding переписано — gradient blobs, фічі-список, staggered animations, secondary CTA. |
| `mobile/app/item/[id].tsx` | Прибрано unused import. Дизайн уже був товарний. |
| `vexp.toml`, `.vexp/`, hooks | Ініціалізовано vexp в корені проєкту, проіндексовано 320 файлів. |

**TS-перевірка**: `npx tsc --noEmit` — EXIT=0.

## 🗺 РОЗРОБКА ДАЛІ (план, 2026-05-17 вечір)

Зі скриншотів видно: користувач відкрив новий WorkspaceItem типу **phd** на `/uk/app/space/[id]`. Сторінка показує лише метадані (Огляд + Простори + Пов'язане). **Type-specific deep UI відсутній** — користувач не може створити модулі, етапи, експерименти.

Це і є наступна велика фаза: **type-specific contents всередині item detail page**.

### Фаза D1 — Критичні фікси (швидко, перед фічами)

- [ ] **Security: прибрати MongoDB host з sidebar** (`liquid-app-shell.tsx:152-154`, `app-shell.tsx:147-149`). Зараз показує `cluster1.u9bx2if.mongodb.net` у production frontend — це leak.
- [ ] **Dictionary.shell оновити**: `eyebrow: "Операційна система досліджень..."` → "Research Navigator · Дослідницький простір"; `title: "Робочий простір для природничих досліджень"` → коротше і продуктове.
- [ ] **Шрифти у production**: переконатися що Unbounded/Geologica справді завантажуються (на скриншоті не виглядає що Unbounded). Перевірити `next/font/google` для production build.
- [ ] **Прибрати "Соntent layer" іконку → це справді logo SVG** і він читається коректно.

### Фаза D2 — Type-specific deep UI у Item detail (КЛЮЧОВА)

Поточна `/space/[id]` показує: emoji + type + title + status + visibility + Огляд + Простори + Пов'язане. Треба додати: **TAB"detail-block"** залежно від `ITEM_TYPE_REGISTRY[type].detailBlock`.

| Item type        | detailBlock | Що показувати |
|---|---|---|
| `phd`            | `phd`         | PhD план (фази + етапи), milestone gantt, дисертаційна структура |
| `bachelor/master`| `thesis`      | Розділи дисертації, дедлайни захисту, керівник, фінальна оцінка |
| `course`         | `course`      | Модулі + теми (лекції/семінари/лаби), assessments, ECTS, прогрес |
| `laboratory`     | `lab`         | Інвентар, обладнання, експерименти, GLP-журнал, доступ BSL |
| `grant`          | `grant`       | Бюджет, deliverables, дедлайни, фандер, PI, co-investigators |
| `seminar`        | `seminar`     | Дата, спікер, реєстрація, recording URL, slides |
| `open_science`   | `open_science`| DOI, license, repository, methodology, citation |
| `collaboration`  | `collaboration`| Партнери, MoU, coordinator, scope |
| `study_group`    | `study_group` | Розклад, фасилітатор, max members, topic |
| `idea`           | `idea`        | Pitch, problem statement, stage (raw/forming/validated), votes |
| `research`/`individual_research` | `research` | Hypothesis, methodology, deliverables |

#### D2.1 — Спільна інфраструктура

- [ ] Створити `src/components/items/detail-blocks/` директорію з одним файлом на тип.
- [ ] Створити `ItemDetailBlock` диспетчер: `<ItemDetailBlock item={...} />` рендерить відповідний блок за `meta.detailBlock`.
- [ ] Спільні UI: `TabBar` (LiquidTabs), section headers, action chips.
- [ ] Аналогічно на mobile у `mobile/components/item-blocks/`.

#### D2.2 — Пріоритети (за частотою використання)

Робити в такому порядку:

1. **`lab`** — Лабораторія (вже є backend з labInventory / labEquipment / labExperiments → інтегрувати). Найбільший value, бо вже частково реалізовано на mobile.
2. **`phd`** — PhD план (phdPlan вже існує + PhdGanttChart). Перенести з legacy /learning у /space/[id].
3. **`course`** — Курси (courses + modules + topics + assessments). Інтегрувати з /learning.
4. **`thesis`** — bachelor/master (схоже на phd, але простіше).
5. **`grant`** — Бюджет + deliverables (інтегрувати з budgetSummary).
6. **Решта** (`seminar`, `open_science`, `collaboration`, `study_group`, `idea`, `research`) — простіші форми з полями.

#### D2.3 — Перехід data layer на itemId

Зараз: `tasks`, `courses`, `labInventory` etc. мають `projectId` (= legacy `MobileProject.id`). Тепер, що legacy auto-create вилучено, треба:

- [ ] Backend API маршрути: додати підтримку `?itemId=` як еквівалент `?projectId=`. На рівні `lib/projects.ts`, `lib/learning.ts`, `lib/laboratory.ts` — приймати **обидва** для backward compat.
- [ ] Mobile store: коли активний WorkspaceItem (без legacy), використовувати `item.id` як `projectId` у fetch (це вже зроблено через derived `activeProjectId`).
- [ ] Web: пробросити `itemId` через URL до /api/learning?itemId=... тощо.

### Фаза D3 — Розширені фічі (після D2)

- [ ] **Item creation form** — повний редактор для новий items: поля type-specific (BSL для lab, ECTS для course, deliverables для grant…). Зараз створення через `CreateItemSheet` з мінімальними полями.
- [ ] **Item editing** — повний редактор полів (zараз заглушка "Скоро — Фаза A3").
- [ ] **Item relations** — UI для зв'язків (parent_of, funded_by, references…). Заглушка є на `/space/[id]` ("Пов'язане: скоро").
- [ ] **Members management** — додати / видалити учасників Item з ролями.
- [ ] **Templates** — workspace template (`education`) з auto-seed items: при створенні Аспірантури автоматично з'являються 3 заглушки items (Навчання / Дисертація / Лабораторія).

### Фаза D4 — Auth + Profile + Verification

- [ ] **Email verification** — створити token + send email + verify endpoint + UI banner "Підтвердіть пошту".
- [ ] **SMS verification** — для phone field (Twilio або similar).
- [ ] **Forgot password** — реалізувати реальний flow (зараз UI є, backend заглушка).
- [ ] **Profile editing** — оновити форму додавши phone, дозволити редагування latin names.
- [ ] **Avatar upload** — наразі тільки ініціали.
- [ ] **2FA** — TOTP (Google Authenticator).

### Фаза D5 — Mobile parity

- [ ] **Mobile login UI** — додати "Залишений пароль" working flow.
- [ ] **Mobile item detail** з type-specific deep UI (паралельно D2 на web).
- [ ] **Mobile profile** — додати поле phone, дозволити редагувати.
- [ ] **Mobile create item flow** — повна форма залежно від type.
- [ ] **Pull-to-refresh** усюди (вже частково є).

### Фаза D6 — Open Science + Data export

- [ ] `/open-science` сторінка — оновити дизайн.
- [ ] DOI integration (через Zenodo API).
- [ ] ORCID OAuth.
- [ ] **Експорт** workspace/item у JSON/CSV/PDF (FAIR-compliant).
- [ ] **Імпорт** з інших систем (BibTeX, OpenScience).

### Фаза D7 — Колаборація і нотифікації

- [ ] Реальні **notifications** (зараз mock у store).
- [ ] **Email notifications** для дедлайнів, нових учасників.
- [ ] **Activity feed** на /space.
- [ ] **Team chat** для багатоучасникових items.
- [ ] **Comments** на items / tasks.

### Фаза D8 — Production readiness

- [ ] **Rate limiting** на login/register (зараз нічого).
- [ ] **CAPTCHA** на public форми.
- [ ] **Audit log** експорт.
- [ ] **GDPR**: export user data, delete account permanently.
- [ ] **Sentry** error tracking.
- [ ] **Analytics** (privacy-friendly).

---

## 🎓 Фаза L — Навчання як електронний деканат/журнал (план)

**Контекст:** користувач хоче `/learning` як справжній **електронний журнал** / **деканат** — а не просто список курсів.
Парадигма: легкий швидкий ввід пар, наочна таблиця "учасники × дати × attendance × grade", окремий студент-mode на mobile.

### Аудит існуючого

| Файл | Рядків | Роль |
|---|---|---|
| `src/lib/learning.ts` | 494 | Backend: courses, modules, topics, sessions, assessments, assignments. CRUD є. |
| `src/components/learning/learning-journal.tsx` | **1695** | Головний контейнер з вкладками "журнал/розклад/оцінки/завдання". Моноліт. |
| `src/components/learning/schedule-tab.tsx` | **1830** | Календар + список + recurring expansion. Великий і складний. |
| `src/components/learning/assignments-panel.tsx` | 790 | Управління завданнями. |
| `src/components/learning/learning-calendar.tsx` | 474 | Календарний рендер. |
| `src/components/learning/activity-diary.tsx` | 466 | Чек-ін діяльності. |
| `src/components/learning/diary-quick-widget.tsx` | 251 | Quick widget. |
| `mobile/app/(tabs)/learning.tsx` | ~600 | ScheduleView + CoursesListView + RemindersView + PhdPlanView. |

**Що відсутнє для "деканату":**
- 📋 **Журнал відвідуваності** (gradebook) — таблиця рядки=учасники, колонки=дати/сесії.
- 👥 **Учасники курсу** (members) — наразі курс не має списку студентів.
- ⚡ **Quick Add wizard** для пар — нинішня форма заплутана.
- 📊 **Аналітика по студенту** (середній бал, % присутності).
- 🎓 **Student mode** на mobile — мої оцінки, мій розклад.

### Підзадачі L1–L8

| ID | Опис |
|---|---|
| **L1** | Backend: `CourseMember` модель + API (`enroll`, `unenroll`, `list`). |
| **L2** | Backend: `AttendanceRecord` (sessionId × studentId → status + grade). |
| **L3** | Web: новий `LearningHub` shell (5 вкладок: Журнал · Розклад · Курси · Оцінки · Учасники). |
| **L4** | Web: **Quick Add Session** wizard — 3-крокова форма (тип → дата/час → тема/локація). |
| **L5** | Web: **Gradebook view** — table учасники × дати з inline-редагуванням attendance і grade. |
| **L6** | Web: спрощений Schedule view (заміна на новий календар з кращим UX). |
| **L7** | Mobile: **Student view** — мій розклад, мої оцінки, % присутності, дедлайни. |
| **L8** | Mobile: **Teacher view** — швидке marking attendance, додавання оцінок одним тапом. |

### Стратегія виконання

- Перші 2 кроки (L1–L2) — інкремент моделі (без злому). Старі views продовжать працювати.
- L3 — НОВИЙ `LearningHub` живе **поряд** зі старим `LearningJournal` (через feature-flag або просто новий маршрут `/learning/hub`). Потім замінимо.
- L4 — нова форма як модалка, що працює у будь-якій вкладці.
- L5 — найважливіший: серце журналу/деканату.
- Якщо лімітуємось у L3–L5 web → L7–L8 на mobile як окрема ітерація.

---

## 🏛 Фаза N — Навчальні заклади (Institutions)

**Концепція:** паралельна до User сутність — `Institution` (ЗВО). Має свою реєстрацію, dashboard, структуру. Звичайні Users можуть приєднуватися до Institution при створенні Workspace типу `bachelor/master/phd`.

### Модель даних

```
Institution {
  _id, name, shortName/abbreviation, type, email (унікальний),
  country, city, website, logoUrl, description,
  accreditation, isVerified, createdBy, createdAt, updatedAt
}

InstitutionUnit (Tree)         InstitutionMember             InstitutionProgram
- institutionId                - institutionId               - institutionId
- parentId                     - userId (опц.)               - title, code, specialty
- type: faculty/dept/lab        - displayName, email          - level: bachelor/master/phd
- name, head                   - role: dean/teacher/admin    - durationYears, language

InstitutionCourse              User.accountType
- institutionId, programId      - "personal" | "institution"
- title, code, ECTS,            (нове поле, default "personal")
- semester, instructor
- (шаблон, не gradebook)
```

### Auth flow

| Account type | Login | Реєстрація |
|---|---|---|
| **personal**     | `/login` → `/app/space`       | `/register` (firstName/lastName) |
| **institution**  | `/login` → `/app/institution` | `/register/institution` (institutionName + contactName) |

### Підзадачі

| ID | Опис |
|---|---|
| **N1** | Schema: institutionSchema + extended userSchema з `accountType`. |
| **N2** | Lib: `institutions.ts` (CRUD + findByEmail + isVerified). |
| **N3** | API `/api/institutions` + `/api/auth/register-institution`. Server action. |
| **N4** | UI `/register/institution` сторінка з 2-кроковою формою (Institution data → Admin contact). Link з `/register` "Реєстрація навчального закладу". |
| **N5** | Auth redirect logic: login → check accountType → redirect на `/app/space` або `/app/institution`. |
| **N6** | Institution dashboard `/app/institution`: Огляд (stats), Структура, Викладачі, Програми, Курси, Налаштування. |
| **N7** | `InstitutionUnit` (tree) + `InstitutionMember` + `InstitutionProgram` + `InstitutionCourse` — backend та UI. |
| **N8** | Інтеграція з User Workspace: при створенні bachelor/master/phd Простору — autocomplete institution з системи. |
| **N9** | Mobile: registration toggle + institution dashboard view (read-only). |

Цей раунд: **N1–N4** (foundation). Решта — у наступних раундах.

---

## Прийняті патерни

- **Кольори**: `colors.primary` (teal), `CATEGORY_META[cat].color` для category-tinted UI, `lab.*` для лабораторних інтерфейсів.
- **Анімації**: `MotiView from={{opacity: 0, translateY: 8}} animate={{opacity: 1, translateY: 0}} transition={{type: "spring", damping: 18}}` — стандарт.
- **Heroes**: `LinearGradient` із 2-3 темними кольорами, два декоративні `heroCircle1/2` блоби, `BlurView` для glass-tips.
- **Картки списків**: `GlassItemCard` із `emoji + emojiColor + title + typeLabel + meta + rightAction`.
- **CTA**: `GlassCTA` з градієнтом, `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` перед onPress.
- **Hapt-фідбек**: `selectionAsync` для дрібних взаємодій, `impactAsync(Medium)` для основних дій, `notificationAsync(Success)` для завершених.

# PROJECT_MAP — Learning Time Tracker

Останнє оновлення: 2026-08-24 — фіча "Час у TaskPanel" (таймер старт/стоп з auto-stop-and-switch, ручні записи, сесії й тотали) заапрувена після одного раунду review; `BE_TimeEntries`, `DB_TimeEntries`, `FE_TaskPanel` позначено `done`.

## Легенда

| Позначка | Клас | Значення |
|---|---|---|
| 🟩 | `done` | FE + BE + БД (де застосовно) реалізовано і пройшло code review |
| 🟨 | `progress` | частково реалізовано (напр. UI без ендпоінта, або ендпоінт без UI) |
| ⬜ | `planned` | ще не почато, лише зафіксовано в специфікації як цільовий обсяг |

Карта розбита на три рядки за функціональними групами (Auth/Infra/Settings; Boards/Sharing; Task panel/Attachments/Team view) — у кожному рядку всі зв'язки замикаються всередині нього, тому стрілки між рядками не перетинаються.

## Рядок 1 — Auth, i18n, Infra

```mermaid
graph TD
  classDef done fill:#2e7d32,color:#ffffff,stroke:#1b5e20,stroke-width:2px;
  classDef progress fill:#f9a825,color:#1a1a1a,stroke:#f57f17,stroke-width:2px;
  classDef planned fill:#37474f,color:#cfd8dc,stroke:#263238,stroke-width:1px,stroke-dasharray: 3 3;

  subgraph FE["Frontend"]
    FE_i18n["🟩 FE_i18n<br/>locales/en+uk.json,<br/>I18nProvider, плюралізація"]
    FE_Auth["🟩 FE_Auth<br/>/auth: email+пароль,<br/>Google popup"]
    FE_Settings["⬜ FE_Settings<br/>профіль, перемикач мови"]
  end

  subgraph BE["Backend (Node.js REST /api/v1)"]
    BE_Health["🟩 BE_Health<br/>GET /health"]
    BE_AuthMw["🟩 BE_AuthMw<br/>auth middleware,<br/>верифікація Firebase ID token"]
    BE_UsersMe["🟩 BE_UsersMe<br/>GET /users/me (upsert),<br/>GET /auth/provider-hint (rate-limited)"]
  end

  subgraph DB["PostgreSQL"]
    DB_Users["🟩 DB_Users<br/>users (+ locale,<br/>last_sign_in_provider)"]
  end

  subgraph Infra["Infra"]
    Infra_Docker["🟩 Infra_Docker<br/>docker-compose:<br/>db/minio/backend/frontend"]
    Infra_FirebaseAuth["🟩 Infra_FirebaseAuth<br/>Firebase Auth Spark,<br/>email+пароль+Google"]
    Infra_MinIO["🟩 Infra_MinIO<br/>сховище вкладень"]
    Infra_ProdDeploy["⬜ Infra_ProdDeploy<br/>Cloud Run + Hosting<br/>+ Neon + R2/Blaze"]
  end

  FE_Auth --> FE_i18n
  FE_Settings --> FE_i18n
  FE_Auth --> BE_AuthMw
  FE_Auth --> BE_UsersMe
  FE_Auth --> Infra_FirebaseAuth
  BE_AuthMw --> Infra_FirebaseAuth
  BE_UsersMe --> DB_Users
  Infra_Docker --> BE_Health
  Infra_Docker --> Infra_MinIO
  Infra_Docker -.план деплою.-> Infra_ProdDeploy

  class FE_i18n,FE_Auth,BE_Health,BE_AuthMw,BE_UsersMe,DB_Users,Infra_Docker,Infra_FirebaseAuth,Infra_MinIO done;
  class FE_Settings,Infra_ProdDeploy planned;
```

## Рядок 2 — Boards, Board view, шеринг борду

```mermaid
graph TD
  classDef done fill:#2e7d32,color:#ffffff,stroke:#1b5e20,stroke-width:2px;
  classDef progress fill:#f9a825,color:#1a1a1a,stroke:#f57f17,stroke-width:2px;
  classDef planned fill:#37474f,color:#cfd8dc,stroke:#263238,stroke-width:1px,stroke-dasharray: 3 3;

  subgraph FE["Frontend"]
    FE_Boards["🟩 FE_Boards<br/>Boards overview:<br/>сітка, create/rename/delete"]
    FE_Shared["⬜ FE_Shared<br/>Shared with me"]
    FE_BoardView["🟩 FE_BoardView<br/>Board view: 3 колонки,<br/>drag-and-drop + a11y select"]
  end

  subgraph BE["Backend (Node.js REST /api/v1)"]
    BE_Boards["🟩 BE_Boards<br/>/boards CRUD"]
    BE_BoardMembers["⬜ BE_BoardMembers<br/>/boards/:id/members"]
    BE_Tasks["🟩 BE_Tasks<br/>/boards/:id/tasks CRUD<br/>+ статус/позиція"]
  end

  subgraph DB["PostgreSQL"]
    DB_Boards["🟩 DB_Boards<br/>boards"]
    DB_BoardMembers["⬜ DB_BoardMembers<br/>board_members"]
    DB_Tasks["🟩 DB_Tasks<br/>tasks"]
  end

  FE_Boards --> FE_Shared
  FE_Boards --> BE_Boards
  BE_Boards --> DB_Boards
  FE_BoardView --> BE_BoardMembers
  BE_BoardMembers --> DB_BoardMembers
  BE_BoardMembers --> DB_Boards
  FE_BoardView --> BE_Tasks
  BE_Tasks --> DB_Tasks
  BE_Tasks --> DB_Boards

  class FE_Boards,FE_BoardView,BE_Boards,BE_Tasks,DB_Boards,DB_Tasks done;
  class FE_Shared,BE_BoardMembers,DB_BoardMembers planned;
```

## Рядок 3 — Task panel (час, шеринг таски, вкладення, team view)

```mermaid
graph TD
  classDef done fill:#2e7d32,color:#ffffff,stroke:#1b5e20,stroke-width:2px;
  classDef progress fill:#f9a825,color:#1a1a1a,stroke:#f57f17,stroke-width:2px;
  classDef planned fill:#37474f,color:#cfd8dc,stroke:#263238,stroke-width:1px,stroke-dasharray: 3 3;

  subgraph FE["Frontend"]
    FE_TaskPanel["🟩 FE_TaskPanel<br/>таймер + сесії<br/>+ ручні записи"]
    FE_Attachments["🟩 FE_Attachments<br/>файли/посилання/нотатки<br/>(visibility picker: planned)"]
    FE_TeamView["⬜ FE_TeamView<br/>team view тотали"]
  end

  subgraph BE["Backend (Node.js REST /api/v1)"]
    BE_TimeEntries["🟩 BE_TimeEntries<br/>/tasks/:id/time-entries"]
    BE_TaskShares["⬜ BE_TaskShares<br/>/tasks/:id/shares"]
    BE_Attachments["🟩 BE_Attachments<br/>/tasks/:id/attachments<br/>+ signed URL"]
    BE_TeamView["⬜ BE_TeamView<br/>агрегація team view"]
  end

  subgraph DB["PostgreSQL"]
    DB_TimeEntries["🟩 DB_TimeEntries<br/>time_entries"]
    DB_TaskShares["⬜ DB_TaskShares<br/>task_shares"]
    DB_Attachments["🟩 DB_Attachments<br/>attachments"]
    DB_AttachmentViewers["⬜ DB_AttachmentViewers<br/>attachment_viewers"]
  end

  subgraph Infra["Infra"]
    Infra_MinIO["🟩 Infra_MinIO<br/>сховище вкладень"]
  end

  FE_TaskPanel --> BE_TimeEntries
  BE_TimeEntries --> DB_TimeEntries
  FE_TaskPanel --> BE_TaskShares
  BE_TaskShares --> DB_TaskShares
  FE_TaskPanel --> FE_Attachments
  FE_Attachments --> BE_Attachments
  BE_Attachments --> DB_Attachments
  BE_Attachments --> DB_AttachmentViewers
  BE_Attachments --> Infra_MinIO
  FE_TeamView --> BE_TeamView
  BE_TeamView --> DB_TimeEntries

  class FE_TaskPanel,FE_Attachments,BE_TimeEntries,BE_Attachments,DB_TimeEntries,DB_Attachments,Infra_MinIO done;
  class BE_TaskShares,BE_TeamView,DB_TaskShares,DB_AttachmentViewers,FE_TeamView planned;
```

## Схема БД (таблиці горизонтально, FK-звʼязки вертикально)

```mermaid
graph TD
  classDef done fill:#2e7d32,color:#ffffff,stroke:#1b5e20,stroke-width:2px;
  classDef progress fill:#f9a825,color:#1a1a1a,stroke:#f57f17,stroke-width:2px;
  classDef planned fill:#37474f,color:#cfd8dc,stroke:#263238,stroke-width:1px,stroke-dasharray: 3 3;

  DB_BoardMembers["⬜ board_members<br/>board_id, user_id, role"]
  DB_TaskShares["⬜ task_shares<br/>task_id, user_id, role"]
  DB_AttachmentViewers["⬜ attachment_viewers<br/>attachment_id, user_id"]

  DB_Users["🟩 users<br/>id, email, display_name,<br/>locale, last_sign_in_provider"]
  DB_Attachments["🟩 attachments<br/>task_id, kind, title,<br/>storage_path/url, visibility"]
  DB_TimeEntries["🟩 time_entries<br/>task_id, user_id,<br/>started_at, ended_at"]

  DB_Tasks["🟩 tasks<br/>board_id, title,<br/>status, position"]

  DB_Boards["🟩 boards<br/>title, description,<br/>accent, owner_id"]

  DB_BoardMembers -->|FK| DB_Boards
  DB_BoardMembers -->|FK| DB_Users
  DB_TaskShares -->|FK| DB_Tasks
  DB_TaskShares -->|FK| DB_Users
  DB_TimeEntries -->|FK| DB_Tasks
  DB_TimeEntries -->|FK| DB_Users
  DB_AttachmentViewers -->|FK| DB_Attachments
  DB_AttachmentViewers -->|FK| DB_Users
  DB_Attachments -->|FK| DB_Tasks
  DB_Tasks -->|FK| DB_Boards

  class DB_Users,DB_Tasks,DB_Boards,DB_Attachments,DB_TimeEntries done;
  class DB_BoardMembers,DB_TaskShares,DB_AttachmentViewers planned;
```

## Відомі прогалини / follow-ups (не блокери, залоговано для пізніше)

- **Orphaned Firebase account при мережевому збої під час signup** (стосується `FE_Auth` / `BE_UsersMe`). Якщо мережа падає між створенням акаунту в Firebase Auth і успішним upsert-запитом до `users`, а користувач перезавантажує сторінку саме в цей момент — акаунт у Firebase лишається без відповідного рядка в `users`, і зараз немає retry/self-heal логіки, яка б це виправила при наступному вході. Виявлено на code review `/auth` (approved with comments), не блокер для мержу. Потребує окремої фічі: або retry upsert при кожному logon, якщо `users` row відсутній, або фонова звірка Firebase Auth ↔ `users`.
- **Task rename UI (`FE_TaskPanel`) додано в обхід звичайного review pipeline.** На явний запит користувача (маленька, добре зрозуміла UI-правка: дзеркалить уже заапрувлений патерн board-rename з `BoardsPage.jsx`, використовує вже протестований і concurrency-safe BE-ендпоінт `PATCH /tasks/:id` без жодних змін на бекенді) — крок tester/code-reviewer цього разу пропущено. Зміни: `frontend/src/components/TaskPanel.jsx` (inline rename-форма: лейбл назви, save/cancel, client-side валідація) + `frontend/src/pages/BoardViewPage.jsx` (синхронізація заголовка картки таски після rename у панелі); нові локалі `task.rename.cta`, `task.rename.titleLabel`, `task.rename.validation.titleRequired`, `task.rename.validation.titleTooLong` — EN/UK повні. Користувач особисто перевірив наживо (успішний rename, валідація пустого/задовгого заголовка, 403 для не-власника), тестові дані прибрано вручну після переривання сесії агента. Статуси вузлів на карті **не змінені**: title-редагування вже неявно охоплювалось описом done-вузлів `BE_Tasks`/`DB_Tasks` ("CRUD"), а `FE_TaskPanel` лишається `progress` (вузол означає секцію "Час", не rename). Рекомендовано провести code-review pass, коли буде зручно — до того часу ця конкретна зміна має нижчу впевненість верифікації, ніж решта `done`-роботи на карті.

## Примітки

- `BE_Health` (`GET /health`) винесений окремим вузлом у BE-шарі Рядка 1, зʼєднаний з `Infra_Docker` — техендпоінт готовності сервісу backend-контейнера, не бізнес-фіча.
- `Infra_MinIO` показаний і в Рядку 1 (піднято в `docker-compose`), і в Рядку 3 (куди `BE_Attachments` писатиме файли) — це один і той самий вузол інфраструктури, повторений у двох діаграмах для наочності, не два різні сховища.
- Секції "Поза межами цього етапу" з CLAUDE.md (публічні посилання, коментарі, нотифікації, календар, складні графіки) свідомо не винесені на карту — вони поза скоупом продукту, не просто "ще не зроблено".
- З фічі Boards/Board view/Task CRUD (2026-08-24): у проєкті зʼявилась перша автоматизована тест-інфраструктура — `vitest` проти окремої тестової Postgres-БД, `backend/test/concurrency/` (6 сценаріїв). Спільні locking-хелпери `backend/src/lib/db.js` (`lockRow`/`lockedUpdate`) і `backend/src/lib/authz.js` (`getOwnedBoard`) — це деталі реалізації всередині вже done-вузлів `BE_Boards`/`BE_Tasks`, окремих вузлів на карті не заведено, щоб не подрібнювати BE-шар нижче рівня ендпоінтів; згадано тут як доступна для наступних фіч база (regression-покриття конкурентних сценаріїв).
- З фічі Task attachments (2026-08-24): `FE_TaskPanel` позначений 🟨 `progress`, не `done` — цей вузол на карті означає саме секцію "Час" (таймер, сесії, ручні записи; звʼязки лишились `FE_TaskPanel --> BE_TimeEntries` і `--> BE_TaskShares`, обидва ще planned). У цій фічі вперше зʼявився сам компонент `TaskPanel` (бічна панель таски) як контейнер, і в ньому повністю реалізовано й заапрувено вкладення — тому додано нову стрілку `FE_TaskPanel --> FE_Attachments`, а `FE_Attachments` позначений `done` окремо. Секція "Час" у цій панелі ще не будувалась. `attachment_viewers`/visibility-picker (`private`/`shared`/`selected`) свідомо не реалізовувались цього разу — зараз усі вкладення `private` за замовчуванням, без UI вибору; `DB_AttachmentViewers` лишається ⬜ до фічі шерингу. `image/svg+xml` виключено зі списку дозволених типів файлів (FE + BE) як вектор stored-XSS — виправлено до approve, не є прогалиною.
- З фічі "Час у TaskPanel" (2026-08-24, US10-US12): `FE_TaskPanel` дороблено до 🟩 `done` — секцію "Час" додано (таймер старт/стоп, живий лічильник, банер auto-stop-and-switch при переключенні активної таски, форма ручного запису, список сесій з edit/delete). `BE_TimeEntries` (6 ендпоінтів: `POST start`, `POST stop`, `POST manual`, `PATCH :entryId`, `DELETE :entryId`, `GET list` на `/tasks/:id/time-entries`) і `DB_TimeEntries` (таблиця `time_entries` + міграція `20260824110000_create_time_entries_table.js`, partial unique index `time_entries_one_active_per_user` на `(user_id) WHERE ended_at IS NULL` — гарантує один активний таймер на користувача на рівні БД) також `done`. Тотали часу додані на `GET /boards/:id/tasks` (`totalSeconds` на тасці, `columnTotals`, `boardTotalSeconds`) і на `GET /boards` (`totalSeconds`, `thisWeekSeconds`, заміна заглушки `board.card.totalTimePlaceholder`) — це розширення контракту вже done-вузлів `BE_Boards`/`BE_Tasks`, окремих вузлів не заведено (той самий принцип, що й для попередніх CRUD-розширень). `thisWeekSeconds` рахується від понеділка 00:00 UTC, фіксовано явно, без локального часу користувача. Приватність: `time_entries` завжди фільтруються `WHERE user_id = requester`; PATCH/DELETE чужого чи неіснуючого запису дають однаковий 404 (anti-enumeration, ніколи 403) — перевірено tester'ом прямим SQL-інсертом "чужого" рядка. Один раунд code review (Request changes → Approve): виправлено race-баг у retry-логіці `startTimer` (ліміт 2 спроби не витримував 3+ одночасних гонщиків) — збільшено до `MAX_START_ATTEMPTS=8` з чесним `errors.timeEntry.startConflict` замість оманливого коду помилки; побічно виправлено баг у `scripts/i18n-check.js` (шлях був `frontend/locales/` замість `frontend/src/locales/` — гейт локалізації мовчки нічого не перевіряв), тепер гейт коректно розрізняє відсутні в EN ICU plural-категорії (`few`/`many`) від справжніх пропусків перекладу. Новий тестовий файл `backend/test/concurrency/timeEntries.concurrency.test.js` (4 сценарії: подвійний старт таймера з двох вкладок, PATCH-vs-DELETE, DELETE-vs-DELETE на той самий запис) — разом з попередніми доводить concurrency-покриття до 12 сценаріїв (боарди/таски/вкладення/час).

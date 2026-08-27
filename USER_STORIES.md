# User Stories — Learning Time Tracker

> Бэклог усіх user stories від агента `business-analyst`. Кожна нова фіча одразу з'являється тут — не тільки в чаті.

**Статуси:** 📝 Уточнено (готово до розробки) · 🔧 У розробці · ✅ Готово (пройшло code review)

| ID | Story | Статус | Дата | Карта |
|----|-------|--------|------|-------|
| AUTH-001 | Реєстрація через email + пароль | ✅ Готово (пройшло code review) | 2026-08-23 | FE_Auth, BE_AuthMw, BE_UsersMe, DB_Users, Infra_FirebaseAuth |
| AUTH-002 | Вхід через email + пароль | ✅ Готово (пройшло code review) | 2026-08-23 | FE_Auth, BE_AuthMw, BE_UsersMe, DB_Users, Infra_FirebaseAuth |
| AUTH-003 | Вхід/реєстрація через Google | ✅ Готово (пройшло code review) | 2026-08-23 | FE_Auth, BE_AuthMw, BE_UsersMe, DB_Users, Infra_FirebaseAuth |
| US-001 | Перегляд списку тем навчання (Boards overview) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_Boards, BE_Boards, DB_Boards |
| US-002 | Створення теми навчання (борду) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_Boards, BE_Boards, DB_Boards |
| US-003 | Перейменування борду | ✅ Готово (пройшло code review) | 2026-08-24 | FE_Boards, BE_Boards, DB_Boards |
| US-004 | Видалення борду | ✅ Готово (пройшло code review) | 2026-08-24 | FE_Boards, BE_Boards, DB_Boards, Infra_MinIO |
| US-005 | Перегляд картки навчання на борді (Board view) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_BoardView, BE_Tasks, DB_Tasks |
| US-006 | Створення картки навчання (таски) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_BoardView, BE_Tasks, DB_Tasks |
| US-007 | Видалення картки навчання | ✅ Готово (пройшло code review) | 2026-08-24 | FE_BoardView, BE_Tasks, DB_Tasks, Infra_MinIO |
| US-008 | Зміна статусу drag-and-drop + фолбек-контрол | ✅ Готово (пройшло code review) | 2026-08-24 | FE_BoardView, BE_Tasks, DB_Tasks |
| US-009 | Додавання вкладення до картки (файл/зображення/посилання/нотатка) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_Attachments, BE_Attachments, DB_Attachments, Infra_MinIO |
| US-010 | Таймер: старт/стоп з auto-stop-and-switch | ✅ Готово (пройшло code review) | 2026-08-24 | FE_TaskPanel, BE_TimeEntries, DB_TimeEntries |
| US-011 | Ручне додавання та корекція запису часу | ✅ Готово (пройшло code review) | 2026-08-24 | FE_TaskPanel, BE_TimeEntries, DB_TimeEntries |
| US-012 | Список сесій і тотали (таска → колонка → борд → this week) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_TaskPanel, FE_Boards, BE_TimeEntries, BE_Boards, BE_Tasks, DB_TimeEntries |
| US-013 | Owner ділиться цілим бордом (board_members) | ✅ Готово (пройшло code review) | 2026-08-24 | BE_BoardMembers, DB_BoardMembers, FE_SharePanel |
| US-014 | Owner ділиться окремою таскою (task_shares) | ✅ Готово (пройшло code review) | 2026-08-24 | BE_TaskShares, DB_TaskShares, FE_SharePanel |
| US-015 | Collaborator редагує вміст спільного борду | ✅ Готово (пройшло code review) | 2026-08-24 | BE_Tasks, BE_Attachments, BE_BoardMembers |
| US-016 | Viewer має read-only доступ і приватний трекінг часу | ✅ Готово (пройшло code review) | 2026-08-24 | FE_TaskPanel, BE_TimeEntries, BE_BoardMembers |
| US-017 | Цілісність даних і edge cases шерингу | ✅ Готово (пройшло code review) | 2026-08-24 | BE_BoardMembers, BE_TaskShares, DB_BoardMembers, DB_TaskShares |
| AUTH-004 | Перегляд/редагування профілю — публічне ім'я (public_name) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_ProfilePage, BE_UsersMe, DB_Users |
| AUTH-005 | Додавання компетенцій з передвизначеного списку | ✅ Готово (пройшло code review) | 2026-08-24 | FE_ProfilePage, BE_Competencies, DB_Competencies, DB_UserCompetencies |
| AUTH-006 | Довільна компетенція вручну (custom competency) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_ProfilePage, BE_Competencies, DB_UserCompetencies |
| AUTH-007 | Перемикач готовності викладати (per-competency) | ✅ Готово (пройшло code review) | 2026-08-24 | FE_ProfilePage, BE_Competencies, DB_UserCompetencies |
| AUTH-008 | Перемикач мови (EN/UK) у верхньому меню | ✅ Готово (пройшло code review) | 2026-08-24 | FE_AppHeader, FE_i18n, FE_ProfilePage, BE_UsersMe, DB_Users |
| US-018 | Bug fix: розгортання повного тексту вкладення-нотатки | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Attachments |
| US-019 | Коментарі до таски | ✅ Готово (пройшло code review) | 2026-08-25 | FE_TaskPanel, BE_TaskComments, DB_TaskComments |
| US-020 | Оцінений (запланований) час на тасці | ✅ Готово (пройшло code review) | 2026-08-25 | FE_TaskPanel, FE_BoardView, BE_Tasks, DB_Tasks |
| US-021 | Категорія борду (з довідника competencies) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Boards, BE_Boards, BE_Competencies, DB_Boards |
| US-022 | Публічна видимість борду (read-only без запрошення) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Boards, FE_BoardView, BE_Boards, BE_Tasks, BE_Attachments, BE_TaskComments, DB_Boards |
| US-023 | Мови борду (мультиселект, довідник languages) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Boards, BE_Boards, BE_Languages, DB_Languages, DB_BoardLanguages |
| US-024 | Boards overview: секції "Мої дошки"/"Public Boards" + фільтри | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Boards, BE_Boards |
| US-025 | Пошук профілів за компетентністю (готові викладати) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_PeopleSearch, BE_UserSearch, BE_Competencies |
| US-026 | Перегляд чужого профілю (публічні дані + запуск DM) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_UserProfile, BE_UserSearch, DB_Users |
| US-027 | DM-чат за парою користувач+компетенція (реалтайм) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Chat, BE_DmThreads, DB_DmThreads, DB_DmMessages, Infra_WebSocket |
| US-028 | Груповий чат компетенції (спільна кімната на competency_id) | ✅ Готово (пройшло code review) | 2026-08-25 | FE_Chat, BE_CompetencyChat, DB_CompetencyChatMessages, Infra_WebSocket |
| US-029 | Інфраструктура WebSocket (автентифікація Firebase ID token) | ✅ Готово (пройшло code review) | 2026-08-25 | BE_Websocket, Infra_WebSocket |
| US-030 | Чат на кожну компетенцію — вже реалізовано (без нового коду) | ✅ Готово (реалізовано в US-028, коду не потребує) | 2026-08-26 | FE_Chat, BE_CompetencyChat |
| US-031 | Персистентне членство в чаті компетенції (Join/Leave) | ✅ Готово (пройшло code review) | 2026-08-26 | FE_Chat, BE_CompetencyChat, DB_CompetencyChatMembers |
| US-032 | Екран "Знайти чати" (пошук і приєднання) | ✅ Готово (пройшло code review) | 2026-08-26 | FE_Chat, BE_CompetencyChat |
| US-033 | Розділ "Повідомлення": секція приєднаних чатів компетенцій | ✅ Готово (пройшло code review) | 2026-08-26 | FE_Chat, BE_CompetencyChat, BE_DmThreads |
| US-034 | Відповіді на коментарі таски (3 рівні вкладеності, flatten) | ✅ Готово (пройшло code review) | 2026-08-27 | FE_TaskPanel, BE_TaskComments, DB_TaskComments |
| US-035 | Відповідь (quote-style) на повідомлення в чаті (DM + компетенція) | ✅ Готово (пройшло code review) | 2026-08-27 | FE_Chat, FE_ChatConversation, BE_DmThreads, BE_CompetencyChat, DB_DmMessages, DB_CompetencyChatMessages, Infra_WebSocket |
| US-036 | Форвард повідомлень (лише з чату компетенції, заборонено з DM) | ✅ Готово (пройшло code review) | 2026-08-27 | FE_Chat, FE_ChatConversation, FE_ForwardMessageModal, BE_ChatForwards, BE_DmThreads, BE_CompetencyChat, DB_DmMessages, DB_CompetencyChatMessages |
| US-037 | Імпорт дошки з файлу: транзакційне створення на бекенді | ✅ Готово (пройшло code review) | 2026-08-27 | FE_Boards, BE_BoardImport, BE_Boards, BE_Competencies, BE_Languages, DB_Boards, DB_Tasks, DB_Attachments |
| US-038 | Імпорт дошки з файлу: точка входу і клієнтський флоу | ✅ Готово (пройшло code review) | 2026-08-27 | FE_BoardImport, FE_Boards, BE_BoardImport |
<!-- business-analyst додає рядки сюди після кожної нової story -->

---

## Деталі (Acceptance Criteria по кожній US)

<!-- business-analyst додає повний блок нижче для кожної US: user story, acceptance criteria, локалізація, відповідність scope -->

**AUTH-001…AUTH-003 — походження.** Ці три stories виникли із запиту користувача побудувати екран `/auth` з підтримкою входу/реєстрації через email+пароль і Google. Перед реалізацією ухвалено два рішення: (1) CLAUDE.md на момент запиту фіксував для `/auth` лише email+пароль — Google-вхід був явним розширенням scope, і CLAUDE.md оновлено, щоб задокументувати Google-провайдер і додати колонку `locale` до таблиці `users`; (2) Google-вхід реалізовано через popup-флоу (`signInWithPopup`), не через redirect, — свідомий технічний вибір. Усі три пройшли повний цикл business-analyst → fullstack-developer → tester → code-reviewer (два раунди фіксів безпеки — enumeration-oracle ендпоінт, race-condition/orphaned-account edge case) → map-keeper і хронологічно передують US-001…US-009.

### AUTH-001 — Реєстрація через email + пароль

```
## User Story
Як новий користувач (незалогінений відвідувач), я хочу зареєструватися за допомогою email та пароля, щоб отримати акаунт і почати трекати час навчання.

## Acceptance Criteria
1. Given валідний email + пароль (мін. 8 символів) + збіжне підтвердження пароля, When "Create account", Then Firebase Auth створює акаунт, FE отримує ID token, BE верифікує й апсертить `users` (display_name = дефолт з email), редірект на `/`.
2. Given email вже зареєстрований через email+пароль, When повторна реєстрація, Then `auth.error.emailAlreadyInUse`, дубль не створюється.
3. Given email вже зареєстрований через Google, When спроба email-реєстрації тим самим email, Then локалізована помилка з пропозицією увійти через Google — без автоматичного лінкування акаунтів.
4. Given email без "@" або порожній, Then інлайн-валідація блокує сабміт, запит на BE не йде.
5. Given пароль <8 символів, Then `auth.validation.passwordMinLength`.
6. Given паролі не збігаються, Then `auth.validation.passwordsMustMatch`.
7. Given мережева помилка, Then `auth.error.networkError`, форма не втрачає введені дані.
8. Given успішна реєстрація, When повторний виклик з тим самим UID (напр. подвійний сабміт або ретрай після мережевого збою), Then ідемпотентний апсерт `users`, без дублів рядків.

## Локалізація
- `auth.title` — en: "Sign in — Learning Time Tracker", uk: "Вхід — Learning Time Tracker"
- `auth.description` — en: "Sign in or create an account to track your learning time.", uk: "Увійдіть або створіть акаунт, щоб відстежувати час навчання."
- `auth.tabs.signup` — en: "Sign up", uk: "Зареєструватися"
- `auth.email.label` / `.placeholder` — en: "Email" / "you@example.com", uk: "Емейл" / "you@example.com"
- `auth.password.label` / `.placeholder` — en: "Password" / "Enter your password", uk: "Пароль" / "Введіть пароль"
- `auth.confirmPassword.label` — en: "Confirm password", uk: "Підтвердіть пароль"
- `auth.submit.signup` — en: "Create account", uk: "Створити акаунт"
- `auth.switchToSignin` — en: "Already have an account? Sign in", uk: "Вже маєте акаунт? Увійти"
- `auth.validation.emailRequired` — en: "Email is required", uk: "Вкажіть емейл"
- `auth.validation.emailInvalid` — en: "Enter a valid email address", uk: "Введіть коректний емейл"
- `auth.validation.passwordRequired` — en: "Password is required", uk: "Вкажіть пароль"
- `auth.validation.passwordMinLength` — en: "Password must be at least 8 characters", uk: "Пароль має містити щонайменше 8 символів"
- `auth.validation.passwordsMustMatch` — en: "Passwords do not match", uk: "Паролі не збігаються"
- `auth.error.emailAlreadyInUse` — en: "This email is already registered. Try signing in instead.", uk: "Цей емейл вже зареєстровано. Спробуйте увійти."
- `auth.error.useGoogleInstead` — en: "This email is already registered with Google. Continue with Google to sign in.", uk: "Цей емейл вже зареєстровано через Google. Увійдіть через Google."
- `auth.error.networkError` — en: "Network error. Please check your connection and try again.", uk: "Помилка мережі. Перевірте з'єднання та спробуйте ще раз."
- `auth.error.generic` — en: "Something went wrong. Please try again.", uk: "Щось пішло не так. Спробуйте ще раз."

## Відповідність scope
В межах. Email+пароль реєстрація — базовий сценарій екрана `/auth` з розділу "Екрани" CLAUDE.md; апсерт `users` при першому вході відповідає розділу "Дані" ("синхронізується з Firebase Auth при першому вході").

## Примітка (доповнення після code review, поза початковим API-surface AC)
AC AUTH-001.3 ("email вже зареєстрований через Google") на реальному Firebase-проєкті не можна надійно визначити на клієнті через `fetchSignInMethodsForEmail` — Firebase Email Enumeration Protection блокує цей шлях. Щоб виконати AUTH-001.3 безпечно, за результатами першого раунду code review додано вузький ендпоінт `GET /api/v1/auth/provider-hint?email=...` (10 req/год per IP, 5 req/год per email, timing-safe відповідь), який відповідає на це питання лише в контексті вже відомого конфлікту — тобто лише після того, як Firebase вже розкрив факт існування email через власний код помилки `EMAIL_EXISTS` під час спроби реєстрації. Ендпоінта не було в початковому API-surface AC цієї story; занесено сюди заднім числом як фактично реалізовану частину AUTH-001.3. Локалізація помилки перевищення ліміту — `errors.auth.rateLimited` (en: "Too many requests. Please try again later.", uk: "Забагато запитів. Спробуйте пізніше.") — вже існуючий загальний ключ, повторно використаний, новий ключ під це не заводився.
```

### AUTH-002 — Вхід через email + пароль

```
## User Story
Як зареєстрований користувач, я хочу увійти за допомогою email та пароля, щоб продовжити роботу зі своїми бордами.

## Acceptance Criteria
1. Given правильні email+пароль, When "Sign in", Then Firebase автентифікує, редірект на `/`.
2. Given неправильний пароль АБО неіснуючий email, Then однакове повідомлення `auth.error.wrongPassword` для обох випадків (anti-enumeration за задумом — і додатково підтверджено на реальному проєкті: Firebase Email Enumeration Protection сам повертає ідентичний код помилки для обох випадків).
3. Given акаунт існує лише через Google (без пароля), When спроба email-входу, Then пропозиція увійти через Google (`auth.error.useGoogleInstead`).
4. Given вже активна сесія, When відкриваю `/auth` напряму, Then редірект на `/` без показу форми.
5. Given форма в стані завантаження, Then кнопка дизейблена (`auth.submit.loading`), повторний клік ігнорується.

## Локалізація
- `auth.tabs.signin` — en: "Sign in", uk: "Увійти"
- `auth.submit.signin` — en: "Sign in", uk: "Увійти"
- `auth.submit.loading` — en: "Signing in…", uk: "Виконується вхід…"
- `auth.switchToSignup` — en: "Don't have an account? Sign up", uk: "Немає акаунту? Зареєструватися"
- `auth.error.wrongPassword` — en: "Incorrect email or password.", uk: "Неправильний емейл або пароль."
- `auth.error.useGoogleInstead` — en: "This email is already registered with Google. Continue with Google to sign in.", uk: "Цей емейл вже зареєстровано через Google. Увійдіть через Google."
- `errors.auth.tokenMissing` — en: "You need to sign in to continue.", uk: "Щоб продовжити, увійдіть в акаунт."
- `errors.auth.tokenInvalid` — en: "Your session has expired. Please sign in again.", uk: "Термін дії сесії закінчився. Увійдіть ще раз."

## Відповідність scope
В межах. Email+пароль вхід через Firebase client SDK з верифікацією ID token на BE — точно за розділами "Екрани" (`/auth`) і "Архітектура" CLAUDE.md ("BE тільки верифікує токен, не зберігає паролі").
```

### AUTH-003 — Вхід/реєстрація через Google

```
## User Story
Як новий або наявний користувач, я хочу увійти одним кліком через Google, щоб не запам'ятовувати окремий пароль для сервісу.

## Acceptance Criteria
1. Given клік "Continue with Google", When `signInWithPopup` успішний, Then той самий шлях верифікації токена й апсерту `users`, що й для email — BE не має розгалужень за провайдером.
2. Given перший вхід через Google, When апсерт, Then `display_name` = `name`-клейм токена, якщо є, інакше дефолт з email.
3. Given email вже зареєстрований через email+пароль, When спроба Google-входу тим самим email, Then Firebase повертає `auth/account-exists-with-different-credential` → FE показує пропозицію увійти через email+пароль (`auth.error.useEmailInstead`).
4. Given користувач закриває Google popup, Then `auth.error.popupClosed`, форма повертається в звичайний стан без крашу.
5. Given повторний вхід через Google (не перший), Then `display_name` НЕ перезаписується значенням з токена при кожному вході — лише при створенні рядка `users`.
6. Given вже активна сесія, When `/auth` напряму, Then те саме, що AUTH-002 п.4 — редірект на `/` без показу форми.

## Локалізація
- `auth.google.button` — en: "Continue with Google", uk: "Продовжити з Google"
- `auth.divider.or` — en: "or", uk: "або"
- `auth.error.useEmailInstead` — en: "This email is already registered with a password. Sign in with your email and password instead.", uk: "Цей емейл вже зареєстровано з паролем. Увійдіть за допомогою емейлу та пароля."
- `auth.error.popupClosed` — en: "Google sign-in was cancelled.", uk: "Вхід через Google скасовано."

## Спільна поведінка (обидва провайдери — email+пароль і Google)
- ID token завжди передається як `Authorization: Bearer`, ідентично для обох провайдерів.
- BE верифікує токен через Firebase Admin SDK без гілкування за провайдером.
- Мова визначається з browser locale при першому відвідуванні `/auth` (акаунту ще немає); після логіну — з `users.locale`.
- Жодна сира помилка Firebase (`error.message`) ніколи не показується користувачу — тільки локалізований ключ, `auth.error.generic` як останній fallback.
- Route-level head metadata (title/description/og) через `auth.title`/`auth.description`.

## Відповідність scope
В межах як розширення scope, узгоджене з командою до реалізації: початкова версія CLAUDE.md фіксувала для `/auth` лише email+пароль, Google-вхід був явним доповненням запиту користувача — CLAUDE.md оновлено до реалізації, щоб задокументувати Google-провайдер і додати `locale` до `users`. Popup-флоу (`signInWithPopup`, не redirect) — узгоджений технічний вибір, не порушення архітектури з CLAUDE.md (FE все одно ніколи не звертається до БД напряму, BE верифікує лише ID token).
```

**US-001…US-009 — походження.** Ці дев'ять stories виникли із запиту користувача: "Тема вивчення (напр. PHP) → Картки вивчення (PHP Syntax), з можливістю прикріпити файли/картинки/текст до кожної картки, drag-n-drop зміна статусу To learn/In progress/Done." Перед реалізацією ухвалено два продуктові рішення: (1) лейбли колонок лишені у формулюванні CLAUDE.md ("Planned"/"In Progress"/"Done — PR merged", не "To learn"), ідентичні в EN і UK — свідоме рішення, не пропуск локалізації; (2) усі три типи вкладень (file/link/note) включені в перший прохід, відповідно до вже зафіксованої в CLAUDE.md схеми `attachments`. Усі дев'ять пройшли повний цикл business-analyst → fullstack-developer → tester → code-reviewer (кілька раундів — concurrency-фікси на US-001…US-008, security-фікси на US-009) → map-keeper, і заапрувлені.

### US-001 — Перегляд списку тем навчання (Boards overview)

```
## User Story
Як власник борду, я хочу бачити сітку своїх тем навчання на головному екрані, щоб швидко орієнтуватись, над чим я працюю.

## Acceptance Criteria
1. Given я авторизований і маю ≥1 борд, When я відкриваю `/`, Then бачу сітку карток бордів з назвою, акцентним кольором, лічильником тасок і сумарним часом.
2. Given у мене поки немає жодного time_entry, When я бачу картку борду, Then сумарний час відображається як "0"/"—", без помилки.
3. Given у мене немає жодного борду, When я відкриваю `/`, Then бачу порожній стан із локалізованим закликом створити перший борд.
4. Given борди, якими зі мною поділились (поза скоупом цього проходу), When я на `/`, Then секція "Shared with me" не показується взагалі (не навіть як заглушка).

## Локалізація
- `board.overview.heading` — en: "Your boards", uk: "Ваші дошки"
- `board.overview.loading` — en: "Loading boards…", uk: "Завантаження дошок…"
- `board.overview.empty` — en: "You don't have any boards yet. Create your first one to start tracking learning time.", uk: "У вас ще немає дошок. Створіть першу, щоб почати відстежувати час навчання."
- `board.card.totalTime` — en: "Total: {duration}", uk: "Всього: {duration}"
- `board.card.thisWeek` — en: "This week: {duration}", uk: "За цей тиждень: {duration}"
- `board.card.noTimeYet` — en: "No time logged yet", uk: "Ще немає записаного часу"
- `board.card.taskCount` (ICU plural) — en: one "{count} task" / other "{count} tasks"; uk: one "{count} таска" / few "{count} таски" / many "{count} тасок" / other "{count} таски"

## Відповідність scope
В межах. Секція "Shared with me" явно винесена поза межі цього проходу (реалізується пізніше окремою фічею на базі `board_members`/`task_shares`, вже зафіксованої в CLAUDE.md як цільова схема); порожній стан і нульові тотали відповідають вимогам CLAUDE.md до Boards overview.
```

### US-002 — Створення теми навчання (борду)

```
## User Story
Як власник борду, я хочу створити нову тему навчання (напр. "PHP"), щоб згрупувати картки навчання під нею.

## Acceptance Criteria
1. Given я на `/`, When я створюю борд з валідною назвою, Then новий борд з'являється у сітці, `owner_id` = мій user id, нульові лічильники.
2. Given порожня назва, When сабміт, Then локалізована помилка валідації, борд не створюється.
3. Given борд успішно створений, When відповідь повертається з BE, Then FE одразу оновлює сітку без ручного перезавантаження.
4. Given опційне поле опису (до 2000 символів), When я вказую опис при створенні борду, Then він зберігається в `boards.description` і показується на картці борду (2-рядковий preview). Given опис довший за 2000 символів, When сабміт, Then локалізована помилка валідації, борд не створюється. *(додано 2026-08-24, фіча "Board/task description у FE", коміт `18fc643` — поле `description` у схемі існувало й раніше, але не мало UI до цієї фічі.)*

## Локалізація
- `board.create.cta` — en: "Create board", uk: "Створити дошку"
- `board.create.titleLabel` — en: "Title", uk: "Назва"
- `board.create.descriptionLabel` — en: "Description", uk: "Опис"
- `board.create.descriptionPlaceholder` — en: "What is this board for?", uk: "Для чого ця дошка?"
- `board.create.accentLabel` — en: "Accent color", uk: "Колір акценту"
- `board.create.saving` — en: "Creating…", uk: "Створення…"
- `board.create.validation.titleRequired` — en: "Board title is required", uk: "Вкажіть назву дошки"
- `board.create.validation.titleTooLong` — en: "Board title must be 100 characters or fewer", uk: "Назва дошки має містити не більше 100 символів"
- `board.create.validation.descriptionTooLong` — en: "Description must be 2000 characters or fewer", uk: "Опис має містити не більше 2000 символів" *(додано 2026-08-24)*

## Відповідність scope
В межах. Створення борду з назвою й акцентним кольором — базовий CRUD-екран, прямо описаний у CLAUDE.md ("Boards overview... Створення/перейменування/видалення борду"). Опис — колонка `boards.description` з розділу "Дані" CLAUDE.md, лише не мала UI до 2026-08-24.
```

### US-003 — Перейменування борду

```
## User Story
Як власник борду, я хочу перейменувати тему навчання, щоб назва відповідала актуальному змісту.

## Acceptance Criteria
1. Given я власник борду, When редагую й зберігаю назву, Then назва оновлюється без зміни id/статусів тасок.
2. Given я не власник борду, When намагаюсь редагувати напряму через API, Then отримую 403 з локалізованим ключем помилки.
3. Given я власник борду, When редагую й зберігаю опис (до 2000 символів, опційно), Then `boards.description` оновлюється, картка й заголовок Board view показують нове значення. Given опис довший за 2000 символів, When сабміт, Then локалізована помилка валідації, зміни не зберігаються. *(додано 2026-08-24, фіча "Board/task description у FE", коміт `18fc643`.)*

## Локалізація
- `board.card.rename` — en: "Rename", uk: "Перейменувати"
- `board.rename.validation.titleRequired` — en: "Board title is required", uk: "Вкажіть назву дошки"
- `board.rename.validation.titleTooLong` — en: "Board title must be 100 characters or fewer", uk: "Назва дошки має містити не більше 100 символів"
- `board.rename.validation.descriptionTooLong` — en: "Description must be 2000 characters or fewer", uk: "Опис має містити не більше 2000 символів" *(додано 2026-08-24)*
- `errors.board.ownerOnly` — en: "Only the board owner can do this.", uk: "Це може зробити лише власник дошки."

## Відповідність scope
В межах. Перейменування — частина базового CRUD борду з CLAUDE.md; авторизаційна перевірка (owner-only) відповідає вимозі "перевірка ролі... відбувається в сервісному шарі BE перед кожним запитом до БД". Редагування опису — той самий inline-form UX, розширений на колонку `boards.description`.
```

### US-004 — Видалення борду

```
## User Story
Як власник борду, я хочу видалити тему навчання, яка більше не потрібна, щоб прибрати її зі свого списку разом з усім вмістом.

## Acceptance Criteria
1. Given я власник борду, When підтверджую видалення (незворотна дія), Then борд, усі його таски й вкладення видаляються каскадно.
2. Given борд містить вкладення, When видалення відбувається, Then файли вкладень також прибираються зі сховища (MinIO) — без осиротілих обʼєктів.
3. Given я не власник борду, When викликаю delete API напряму, Then отримую 403.

## Локалізація
- `board.card.delete` — en: "Delete", uk: "Видалити"
- `board.delete.confirmTitle` — en: "Delete board?", uk: "Видалити дошку?"
- `board.delete.confirmMessage` — en: "This will permanently delete \"{title}\" and all of its tasks. This cannot be undone.", uk: "Це остаточно видалить «{title}» і всі її таски. Дію не можна скасувати."
- `board.delete.confirmButton` — en: "Delete board", uk: "Видалити дошку"

## Відповідність scope
В межах. Каскадне видалення борду/тасок/вкладень і очищення файлів у сховищі — пряма вимога CLAUDE.md до архітектури файлового сховища (MinIO через BE, без осиротілих обʼєктів) та до базового CRUD борду.
```

### US-005 — Перегляд картки навчання на борді (Board view)

```
## User Story
Як власник борду, я хочу бачити три колонки статусу зі своїми картками навчання, щоб розуміти прогрес по темі.

## Acceptance Criteria
1. Given я відкриваю `/boards/:id` свого борду, Then бачу три колонки з лейблами "Planned"/"In Progress"/"Done — PR merged" (ідентично в EN і UK — продуктове рішення, зафіксоване вище).
2. Given таска має вкладення, When картка рендериться, Then бейдж кількості вкладень; якщо 0 — бейдж не показується.
3. Given трекінг часу ще не побудований на момент цієї фічі, When картка рендериться, Then сумарний час на картці не показується взагалі (не "0").
4. Given `/boards/:id` чужого борду, When перехід за прямим URL, Then локалізована сторінка помилки 403/404.

## Локалізація
- `boardView.column.planned` — en: "Planned", uk: "Planned"
- `boardView.column.inProgress` — en: "In Progress", uk: "In Progress"
- `boardView.column.done` — en: "Done / PR merged", uk: "Done / PR merged"
- `boardView.column.empty` — en: "No tasks yet", uk: "Ще немає тасок"
- `task.card.attachmentCount` (ICU plural) — en: one "{count} attachment" / other "{count} attachments"; uk: one "{count} вкладення" / few "{count} вкладення" / many "{count} вкладень" / other "{count} вкладення"
- `boardView.error.forbiddenTitle` — en: "You don't have access to this board", uk: "У вас немає доступу до цієї дошки"
- `boardView.error.notFoundTitle` — en: "Board not found", uk: "Дошку не знайдено"

## Відповідність scope
В межах. Три колонки й картки тасок з бейджами вкладень — точно за розділом "Екрани" CLAUDE.md (Board view). Однакові лейбли колонок EN/UK — свідоме продуктове рішення, а не порушення вимоги локалізації: рядок перекладається (ключ існує в обох словниках), просто обидва значення збігаються за змістом.
```

### US-006 — Створення картки навчання (таски)

```
## User Story
Як власник борду, я хочу додати нову картку навчання в колонку "Planned", щоб зафіксувати наступний крок вивчення теми.

## Acceptance Criteria
1. Given валідна назва, When створюю таску, Then вона з'являється в колонці "Planned" (`status=planned`), `position` — в кінці колонки, `created_by` = я.
2. Given порожня назва, When сабміт, Then локалізована помилка, таска не створюється.
3. Given опційне поле опису (до 2000 символів), When я вказую опис при створенні таски, Then він зберігається в `tasks.notes` і показується в секції опису `TaskPanel`. Given опис довший за 2000 символів, When сабміт, Then локалізована помилка валідації, таска не створюється. *(додано 2026-08-24, фіча "Board/task description у FE", коміт `18fc643` — реюзає вже наявну колонку `tasks.notes`, релейблену "Description" в UI, не нова колонка.)*

## Локалізація
- `task.create.cta` — en: "Add task", uk: "Додати таску"
- `task.create.titlePlaceholder` — en: "Task title", uk: "Назва таски"
- `task.create.descriptionLabel` — en: "Description", uk: "Опис"
- `task.create.descriptionPlaceholder` — en: "Add a description (optional)", uk: "Додайте опис (необов'язково)"
- `task.create.saving` — en: "Adding…", uk: "Додавання…"
- `task.create.validation.titleRequired` — en: "Task title is required", uk: "Вкажіть назву таски"
- `task.create.validation.titleTooLong` — en: "Task title must be 200 characters or fewer", uk: "Назва таски має містити не більше 200 символів"
- `task.create.validation.descriptionTooLong` — en: "Description must be 2000 characters or fewer", uk: "Опис має містити не більше 2000 символів" *(додано 2026-08-24)*
- `task.notes.label` / `.placeholder` / `.empty` / `.edit` / `.add` — секція опису в `TaskPanel` (перегляд/редагування, дзеркалить UX title-rename) *(додано 2026-08-24)*

## Відповідність scope
В межах. Створення таски в колонці Planned — базовий CRUD, прямо описаний у розділі "Екрани" CLAUDE.md ("додавання/видалення тасок"). Опис — колонка `tasks.notes` з розділу "Дані" CLAUDE.md, лише не мала UI до 2026-08-24.
```

### US-007 — Видалення картки навчання

```
## User Story
Як власник борду, я хочу видалити картку навчання, яка більше не актуальна, щоб прибрати її з борду разом з усіма вкладеннями.

## Acceptance Criteria
1. Given підтвердження видалення, Then таска й усі її вкладення видаляються каскадно, файли прибираються зі сховища.
2. Given таска не моя, When delete API напряму, Then отримую 403.

## Локалізація
- `task.delete.cta` — en: "Delete", uk: "Видалити"
- `task.delete.confirmTitle` — en: "Delete task?", uk: "Видалити таску?"
- `task.delete.confirmMessage` — en: "This will permanently delete \"{title}\". This cannot be undone.", uk: "Це остаточно видалить «{title}». Дію не можна скасувати."
- `task.delete.confirmButton` — en: "Delete task", uk: "Видалити таску"

## Відповідність scope
В межах. Каскадне видалення таски й очищення файлів вкладень зі сховища — той самий принцип, що й US-004, вимога CLAUDE.md до архітектури файлового сховища.
```

### US-008 — Зміна статусу drag-and-drop + фолбек-контрол

```
## User Story
Як власник борду, я хочу перетягнути картку навчання між колонками статусу або скористатись контролом статусу без drag, щоб оновити прогрес будь-яким зручним способом.

## Acceptance Criteria
1. Given перетягування картки між колонками, When drop завершується, Then `status` і `position` оновлюються на BE, картка рендериться миттєво (optimistic UI).
2. Given користування клавіатурою/screen reader, When відкриваю картку, Then доступний явний не-drag контрол (dropdown/кнопки) з тим самим ефектом, керований Tab+Enter.
3. Given drag у межах тієї ж колонки (реордер), Then оновлюється лише `position`, без зміни `status`.
4. Given мережевий запит провалюється, When drop/клік невдалий, Then картка візуально повертається в попередній стан, і показується локалізована помилка — UI ніколи не розходиться з BE мовчки.
5. Given таска чужого борду, When PATCH статусу напряму через API, Then отримую 403.

## Локалізація
- `boardView.card.statusLabel` — en: "Status", uk: "Статус"
- `errors.task.invalidStatus` — en: "Invalid task status.", uk: "Некоректний статус таски."
- `errors.task.positionConflict` — en: "This board changed while you were working. Please try again.", uk: "Дошка змінилася, поки ви працювали. Спробуйте ще раз."
- `errors.task.forbidden` — en: "You don't have access to this task.", uk: "У вас немає доступу до цієї таски."

## Відповідність scope
В межах. Drag-and-drop зміна статусу — пряма вимога і з початкового запиту користувача, і з розділу "Board view" CLAUDE.md ("переміщення таски між колонками (drag або контрол статусу)"); a11y-фолбек і optimistic-UI з відкатом — необхідна умова коректної, доступної реалізації цієї ж вимоги, не розширення scope.
```

### US-009 — Додавання вкладення до картки (файл/зображення/посилання/нотатка)

```
## User Story
Як власник борду, я хочу додати файл, зображення, посилання або нотатку до картки навчання, щоб зберегти при собі навчальні матеріали.

## Acceptance Criteria
1. Given файл або зображення обрано, When я завантажую вкладення, Then файл іде через BE в MinIO (FE не звертається до сховища напряму), у панелі з'являється чіп з назвою, для зображень — превʼю.
2. Given непідтримуваний тип файлу або файл завеликий, When я намагаюсь завантажити, Then локалізована помилка, вкладення не створюється.
3. Given нове вкладення будь-якого типу успішно створене, Then `visibility='private'` за замовчуванням (picker видимості — поза межами цього проходу), `created_by` = я.
4. Given заголовок і URL заповнені, When я додаю посилання, Then обидва поля обов'язкові, URL валідується, чіп зʼявляється в групі "Links", відкривається в новій вкладці.
5. Given короткий текст введено, When я додаю нотатку, Then чіп зʼявляється в групі "Notes" з обрізаним превʼю тексту.
6. Given вкладення різних типів на тасці, When панель вкладень рендериться, Then чіпи згруповані по типу (Files/Links/Notes) з лічильником у кожній групі.
7. Given я власник таски, When видаляю вкладення (з підтвердженням), Then рядок і файл (якщо є) прибираються зі сховища.
8. Given я не власник таски, When викликаю будь-яку дію над вкладенням напряму через API, Then отримую 403.

## Локалізація
- `attachment.panel.title` — en: "Attachments", uk: "Вкладення"
- `attachment.group.files` / `.links` / `.notes` — en: "Files"/"Links"/"Notes", uk: "Файли"/"Посилання"/"Нотатки"
- `attachment.add.file` / `.link` / `.note` — en: "Add file"/"Add link"/"Add note", uk: "Додати файл"/"Додати посилання"/"Додати нотатку"
- `attachment.file.hint` — en: "Images, PDF, Word documents, or plain text — up to 25MB.", uk: "Зображення, PDF, документи Word або звичайний текст — до 25МБ."
- `attachment.link.titleLabel` / `.urlLabel` — en: "Title"/"URL", uk: "Заголовок"/"URL"
- `attachment.note.bodyLabel` — en: "Note", uk: "Нотатка"
- `attachment.delete.confirmTitle` — en: "Delete attachment?", uk: "Видалити вкладення?"
- `errors.attachment.invalidFileType` — en: "This file type isn't supported.", uk: "Цей тип файлу не підтримується."
- `errors.attachment.fileTooLarge` — en: "File is too large. Maximum size is 25MB.", uk: "Файл завеликий. Максимальний розмір — 25МБ."
- `errors.attachment.urlInvalid` — en: "Enter a valid URL starting with http:// or https://.", uk: "Введіть коректний URL, що починається з http:// або https://."

## Відповідність scope
В межах — усі три типи вкладень (file/link/note) прямо описані в розділі "Task panel" CLAUDE.md і збігаються зі схемою `attachments` (`kind enum file | link | note`). Picker видимості (`shared`/`selected`, `attachment_viewers`) свідомо не входить у цей прохід — усі вкладення `private` за замовчуванням без UI вибору; це не суперечить scope, а відкладена частина тієї ж фічі (`DB_AttachmentViewers` лишається запланованою на карті проєкту).
```

**US-010…US-012 — походження.** Наступний крок після завершення Boards/Tasks/Attachments — секція "Час" у Task Panel, яку CLAUDE.md описує в розділі "Екрани" п.4 ("Час: таймер старт/стоп + список сесій, форма ручного додавання/корекції запису") і в розділі "Поведінка" ("Таймер — на рівні таски, лише один активний на користувача. Час рахується від збереженого `started_at`... Зупинка — запит до BE, який пише рядок сесії"). Продуктове рішення **auto-stop-and-switch** (старт таймера на іншій тасці автоматично зупиняє попередній активний, а не блокує дію) ухвалено самостійно business-analyst-ом, оскільки CLAUDE.md фіксує лише інваріант "один активний", не поведінку при конфлікті — обрано автоматичну дію замість блокуючої відмови, щоб прогрес ніколи не губився мовчки. Усі три пройшли повний цикл business-analyst → fullstack-developer → tester → code-reviewer (один раунд Request changes → фікс retry-логіки в race-сценарії з 3+ одночасними стартами → Approve) → map-keeper, заапрувлені, `PROJECT_MAP.md` оновлено.

### US-010 — Таймер: старт/стоп з auto-stop-and-switch

```
## User Story
Як власник борду, я хочу запускати й зупиняти таймер на конкретній тасці з Task Panel, щоб час навчання рахувався від збереженого на сервері моменту старту, а не губився при закритті вкладки.

## Acceptance Criteria
1. Given таска без активного таймера користувача, When "Почати таймер", Then BE створює `time_entries` (task_id, user_id, started_at=now(), ended_at=null), FE рахує від started_at, не від локального нуля.
2. Given таймер іде на тасці A, When "Почати таймер" на тасці B (той самий юзер), Then BE в одній транзакції закриває запис A (ended_at=now(), duration_seconds рахується) і створює новий активний запис B; відповідь містить `{startedEntry, autoStoppedEntry}`, FE показує нотифікацію "Таймер на іншій тасці зупинено".
3. Given таймер іде на тасці A, When відкриваю Task Panel цієї таски, Then `GET /tasks/:id/time-entries` повертає `activeEntry`, лічильник рахує від збереженого started_at.
4. Given активний таймер, When "Зупинити таймер" (опційна нотатка), Then ended_at=now(), duration_seconds рахується, сесія одразу в списку.
5. Given немає активного таймера на цій тасці, When запит на зупинку, Then 409 `errors.timeEntry.noActiveTimer`.
6. Given дві (і більше) одночасні спроби старту з різних вкладок того самого юзера, When запити летять паралельно, Then гарантовано не лишається двох активних записів одночасно, без 500 — покрито concurrency-тестом (`timeEntries.concurrency.test.js`).
7. Given не власник борду цієї таски, When старт/стоп, Then 403 `errors.task.forbidden`.
8. Given невалідний/неіснуючий taskId, When старт/стоп, Then 404 `errors.task.notFound`.

## Локалізація
- `timeEntry.section.title` — en: "Time", uk: "Час"
- `timeEntry.timer.start` — en: "Start timer", uk: "Почати таймер"
- `timeEntry.timer.stop` — en: "Stop timer", uk: "Зупинити таймер"
- `timeEntry.timer.running` — en: "Running — {duration}", uk: "Триває — {duration}"
- `timeEntry.timer.switchedNotice` — en: "Started this timer — stopped the one running on another task.", uk: "Запущено цей таймер — зупинено той, що йшов на іншій тасці."
- `timeEntry.timer.stopNoteLabel` — en: "Note (optional)", uk: "Нотатка (необовʼязково)"
- `errors.timeEntry.noActiveTimer` — en: "No timer is running on this task.", uk: "На цій тасці не запущено таймер."
- `errors.timeEntry.startConflict` — en: "Couldn't start the timer due to a conflicting request. Please try again.", uk: "Не вдалося запустити таймер через конфліктний запит. Спробуйте ще раз." (доданий під час code review — див. примітку нижче)

## Відповідність scope
В межах. Таймер один-на-застосунок, рахується від served `started_at` — пряма вимога CLAUDE.md ("Поведінка"). Owner-only авторизація — той самий гейт, що вже діє для tasks/attachments, розширення до ролей collaborator/viewer винесено окремо в US-016.

## Примітка (доповнення після code review, поза початковим API-surface AC)
Реалізація retry-логіки старту таймера спершу витримувала лише рівно 2 одночасних гонщики (AC6 сформульовано як "з двох вкладок"); code-reviewer виявив, що 3+ одночасні перші-старти від того самого юзера могли впасти в сирий 500 замість чистого auto-stop-and-switch. Виправлено збільшенням ліміту спроб до 8 і заміною мертвого fallback-коду помилки на новий, чесно названий `errors.timeEntry.startConflict` (замість оманливого `noActiveTimer`) — задокументовано як `409` у `openapi.yaml`. Побічно виявлено й виправлено баг у `scripts/i18n-check.js` (невірний шлях до словників мовчки вимикав перевірку локалізації) — не частина AC цієї US, зафіксовано тут як технічний борг, закритий у процесі.
```

### US-011 — Ручне додавання та корекція запису часу

```
## User Story
Як власник борду, я хочу додати або відкоригувати запис часу вручну (хвилини + опційна нотатка), щоб врахувати навчання, яке я забув затаймити, або виправити помилковий запис.

## Acceptance Criteria
1. Given хвилини (ціле, 1–1440) + опційна нотатка (trim, ≤500 символів), When сабміт, Then BE створює завершений запис: duration_seconds=minutes*60, ended_at=now(), started_at=ended_at-duration_seconds.
2. Given хвилини не вказано/0/від'ємне/не ціле, When сабміт, Then 400 `errors.timeEntry.minutesInvalid`.
3. Given хвилини > 1440, When сабміт, Then 400 `errors.timeEntry.minutesTooLarge`.
4. Given нотатка > 500 символів, When сабміт, Then 400 `errors.timeEntry.noteTooLong`.
5. Given завершений (не активний) власний запис, When редагування хвилин/нотатки, Then BE оновлює duration_seconds/note, перераховує ended_at, started_at лишається незмінним.
6. Given запис активний (ended_at IS NULL), When PATCH через форму корекції, Then 404 `errors.timeEntry.notFound` — активний редагується лише через stop-флоу.
7. Given запис належить іншому користувачу, When PATCH/DELETE, Then 404 `errors.timeEntry.notFound`, НІКОЛИ 403 (anti-enumeration для приватності прогресу — той самий підхід, що вже застосований для sign-in AUTH-002).
8. Given будь-який власний запис, When "Видалити" й підтвердження в ConfirmDialog, Then запис видаляється; якщо був активним — таймер скасовується без збереження часу.
9. Given дві одночасні PATCH/DELETE на той самий запис, When паралельні запити, Then один успіх, другий чистий 404, без 500.

## Локалізація
- `timeEntry.manual.cta` — en: "Add manual entry", uk: "Додати запис вручну"
- `timeEntry.manual.minutesLabel` — en: "Minutes", uk: "Хвилини"
- `timeEntry.manual.notePlaceholder` — en: "What did you work on? (optional)", uk: "Над чим працювали? (необовʼязково)"
- `timeEntry.manual.submit` / `.saving` — en: "Add entry" / "Adding…", uk: "Додати запис" / "Додавання…"
- `timeEntry.edit.cta` / `.submit` — en: "Edit" / "Save changes", uk: "Редагувати" / "Зберегти зміни"
- `timeEntry.delete.cta` / `.confirmTitle` / `.confirmMessage` / `.confirmButton` — en: "Delete" / "Delete this entry?" / "This will permanently delete this time entry. This cannot be undone." / "Delete entry", uk: "Видалити" / "Видалити цей запис?" / "Це остаточно видалить цей запис часу. Дію не можна скасувати." / "Видалити запис"
- `errors.timeEntry.minutesInvalid` — en: "Enter a whole number of minutes greater than 0.", uk: "Введіть ціле число хвилин, більше за 0."
- `errors.timeEntry.minutesTooLarge` — en: "A single entry can't exceed 24 hours (1440 minutes).", uk: "Один запис не може перевищувати 24 години (1440 хвилин)."
- `errors.timeEntry.noteTooLong` — en: "Note must be 500 characters or fewer.", uk: "Нотатка має містити не більше 500 символів."
- `errors.timeEntry.notFound` — en: "Time entry not found.", uk: "Запис часу не знайдено."

## Відповідність scope
В межах. Ручне додавання/корекція (хвилини + опційна нотатка) — пряма вимога CLAUDE.md ("форма ручного додавання/корекції запису"). Anti-enumeration (404, не 403, для чужих записів) — застосування вимоги "Прогрес завжди приватний" на найгранулярнішому рівні.
```

### US-012 — Список сесій і тотали (таска → колонка → борд → this week)

```
## User Story
Як власник борду, я хочу бачити список своїх сесій по тасці та сумарний час на рівні таски/колонки/борду і за цей тиждень на Boards overview, щоб розуміти, скільки часу я вже інвестував.

## Acceptance Criteria
1. Given відкрита Task Panel, When секція "Час" завантажується, Then `GET /tasks/:id/time-entries` повертає лише сесії ЦЬОГО користувача (найновіші зверху), тривалість — locale-aware формат.
2. Given та сама відповідь, Then `totalSeconds` = сума завершених записів + живий `now()-started_at` активного, якщо є.
3. Given будь-який запит до цього ендпоінту, Then BE ніколи не повертає рядки `time_entries` інших користувачів — `WHERE user_id=requester` завжди, без винятків (закріплено як контракт-інваріант в `openapi.yaml`).
4. Given картка таски на Board view, When список тасок завантажується, Then `GET /boards/:id/tasks` повертає `totalSeconds` на кожній тасці, бейдж часу на картці (не показується при 0).
5. Given та сама відповідь, Then BE додатково повертає `columnTotals: {planned, in_progress, done}` і `boardTotalSeconds`.
6. Given Boards overview, When список бордів завантажується, Then `GET /boards` повертає `totalSeconds` (all-time) і `thisWeekSeconds` (з понеділка 00:00 UTC) на кожному борді — замінює заглушку `board.card.totalTimePlaceholder`.
7. Given борд без жодного запису часу, When рендериться картка, Then `board.card.noTimeYet` замість "0г 0хв".
8. Given переміщення таски між колонками, Then `time_entries` не видаляються і не обнуляються.

## Локалізація
- `timeEntry.sessions.title` / `.empty` / `.total` — en: "Sessions" / "No sessions logged yet" / "Total: {duration}", uk: "Сесії" / "Ще немає записаних сесій" / "Разом: {duration}"
- `task.card.timeBadge` — en/uk: "{duration}"
- `board.card.totalTime` — en: "{duration} total", uk: "{duration} загалом"
- `board.card.thisWeek` — en: "{duration} this week", uk: "{duration} цього тижня"
- `board.card.noTimeYet` — en: "No time logged yet", uk: "Ще немає записаного часу"
- `time.unit.hoursMinutes` / `.minutes` / `.hours` — en: "{hours}h {minutes}m" / "{minutes}m" / "{hours}h", uk: "{hours}год {minutes}хв" / "{minutes}хв" / "{hours}год" (одиниці свідомо не відмінюються за числом, як "5 кг" — ICU-плюралізація тут не застосовна, продуктове рішення, не пропуск)

## Відповідність scope
В межах. Тотали таска → колонка → борд → "this week" — пряма вимога CLAUDE.md ("Поведінка": "Тотали: таска → колонка → борд, плюс this week на boards overview — рахує BE"). Межа тижня зафіксована як понеділок 00:00 UTC (не локальний час користувача — per-user timezone не існує на `users`). Явно поза межами: team view тотали по учасниках (`FE_TeamView`/`BE_TeamView`) — залежить від `board_members`/`task_shares`, яких на момент цієї US ще не було; рольова диференціація доступу — авторизація лишається owner-only.
```

**US-013…US-017 — походження.** Наступний крок після "Часу" — шеринг борду й окремої таски (`board_members`, `task_shares`), фундамент, від якого залежать "Shared with me" (`FE_Shared`) і team view (`FE_TeamView`/`BE_TeamView`), обидва свідомо поза цим проходом. CLAUDE.md дає лише часткову матрицю прав ("collaborator може додавати таски/вкладення", "viewer тільки читання") — business-analyst ухвалив і зафіксував явно кілька рішень, яких бракувало: повний перелік дозволів collaborator (edit/delete таски й вкладень дозволено, керування доступом і видалення борду — ні, за контрастною побудовою фрази CLAUDE.md), keeping час-трекінг доступним навіть viewer'у (приватність прогресу — per-user гарантія, не привілей ролі), 404 (не 403) при спробі поділитись з незареєстрованим email (узгоджено з "Поза межами цього етапу": без auto-invite), і правило "вища роль перемагає" при співіснуванні board-level і task-level доступу. **Станом на момент внесення цього запису до `USER_STORIES.md`** у робочій директорії вже присутні незакомічені файли реалізації (нові міграції `board_members`/`task_shares`/`attachment_viewers`, сервіси `boardMembers.service.js`/`taskShares.service.js`, тест `sharing.test.js`, розширення `authz.js`/`boards.route.js`/`tasks.route.js`) — судячи з обсягу змін, це не порожні заглушки, тому статус нижче виставлено 🔧 У розробці, а не 📝 Уточнено. Ця реалізація ще не проходила tester/code-reviewer у межах цієї розмови.

### US-013 — Owner ділиться цілим бордом

```
## User Story
Як власник борду, я хочу надати іншому зареєстрованому користувачу роль viewer або collaborator на весь борд за його email, щоб він міг переглядати (і опційно редагувати) мої таски без передачі права власності.

## Acceptance Criteria
1. Given я власник борду B і email вже зареєстрований, When `POST /api/v1/boards/:id/members` `{email, role:"viewer"}`, Then створюється `board_members(board_id=B, user_id, role=viewer)`, 201.
2. Given те саме з `role:"collaborator"`, Then 201, роль collaborator.
3. Given я маю будь-яку роль на борді, When `GET /api/v1/boards/:id/members`, Then 200 зі списком учасників (owner не фігурує як окремий рядок — власність окреме поле `ownerId`).
4. Given учасник вже є на борді, When `PATCH /api/v1/boards/:id/members/:userId` `{role}`, Then роль оновлюється, 200.
5. Given учасник є на борді, When `DELETE /api/v1/boards/:id/members/:userId`, Then 204; наступний запит видаленого користувача → 403 `errors.board.forbidden`.
6. Given email не зареєстрований, When POST з цим email, Then 404 `errors.sharing.emailNotFound` (навмисно — без auto-invite, узгоджено з "Поза межами цього етапу").
7. Given я collaborator/viewer (не owner), When будь-яка мутація членства, Then 403 `errors.board.ownerOnly`.
8. Given я не маю доступу до борду взагалі, When GET/мутація членства, Then 404 `errors.board.notFound`.
9. Given роль відмінна від viewer/collaborator, When POST/PATCH, Then 400 `errors.sharing.invalidRole`.
10. Given відсутній email або role в тілі, Then 400 `errors.sharing.emailRequired`/`errors.sharing.roleRequired`.

## Локалізація
- `sharing.board.manageAccess` — en: "Manage access", uk: "Керування доступом"
- `sharing.board.membersEmpty` — en: "No one has access to this board yet.", uk: "Поки що ніхто не має доступу до цього борду."
- `sharing.emailLabel` / `.roleLabel` — en: "Email" / "Role", uk: "Email" / "Роль"
- `sharing.role.viewer` / `.collaborator` / `.owner` — en: "Viewer" / "Collaborator" / "Owner", uk: "Переглядач" / "Співавтор" / "Власник"
- `sharing.addCta` / `.removeCta` / `.removeConfirm` — en: "Add" / "Remove" / "Remove {email} from this board?", uk: "Додати" / "Прибрати" / "Прибрати {email} з цього борду?"
- `errors.sharing.emailRequired` / `.roleRequired` / `.invalidRole` / `.emailNotFound` — en: "Enter an email address." / "Choose a role." / "Role must be viewer or collaborator." / "No account found for this email.", uk: "Введіть email." / "Оберіть роль." / "Роль має бути viewer або collaborator." / "Акаунт з таким email не знайдено."
- `errors.boardMembers.alreadyShared` / `.notFound` — en: "This person already has access to the board." / "This person no longer has access.", uk: "Ця людина вже має доступ до борду." / "Ця людина вже не має доступу."
- `errors.board.ownerOnly` — en: "Only the board owner can do this.", uk: "Це може зробити лише власник борду."

## Відповідність scope
В межах. Роль viewer/collaborator, email-based шеринг — пряма вимога CLAUDE.md ("Шеринг": "Можна поділитись цілим бордом... Роль: viewer... collaborator"). Auto-invite незареєстрованих email навмисно виключено ("Поза межами цього етапу").
```

### US-014 — Owner ділиться окремою таскою

```
## User Story
Як власник борду, я хочу дати доступ до однієї конкретної таски (viewer або collaborator), не відкриваючи решту борду, щоб контролювати гранулярність доступу.

## Acceptance Criteria
1. Given я власник борду, якому належить таска T, When `POST /api/v1/tasks/:id/shares` `{email, role}`, Then створюється `task_shares(task_id=T, user_id, role)`, 201.
2. Given у мене є доступ до T (board- або task-level), When `GET /api/v1/tasks/:id/shares`, Then 200 зі списком.
3. Given власник борду, When `PATCH`/`DELETE /api/v1/tasks/:id/shares/:userId`, Then дзеркалить US-013.4-5.
4. **Критичний AC — межа доступу.** Given користувач має ЛИШЕ `task_shares` на T (без `board_members` на батьківський борд), When `GET /api/v1/boards/:boardId/tasks` (повний список тасок борду), Then 403 `errors.board.forbidden` — доступ до однієї таски не розкриває решту борду; при цьому доступ до самої T (time-entries, attachments) дозволений за роллю з US-015/US-016.
5. Given email не зареєстрований / не-owner борду керує / невалідна роль / порожні поля, Then ті самі коди помилок, що US-013.6-7,9-10, з ключами `errors.taskShares.*`.

## Локалізація
- `sharing.task.manageAccess` — en: "Share this task", uk: "Поділитись цією таскою"
- `sharing.task.sharesEmpty` — en: "This task hasn't been shared individually.", uk: "Цю таску окремо ще ні з ким не поділено."
- `errors.taskShares.alreadyShared` / `.notFound` — en: "This person already has access to the task." / "This access no longer exists.", uk: "Ця людина вже має доступ до таски." / "Цього доступу вже немає."

## Відповідність scope
В межах. "Можна поділитись... окремою таскою" — пряма вимога CLAUDE.md ("Шеринг"), схема `task_shares` вже зафіксована в розділі "Дані". Межа доступу (не розкриває решту борду) — застосування принципу найменших привілеїв, узгоджено з описом "шеринг окремої таски без усього борду".
```

### US-015 — Collaborator редагує вміст спільного борду

```
## User Story
Як collaborator спільного борду, я хочу створювати/редагувати/переміщати таски та додавати/видаляти вкладення, щоб реально співпрацювати над навчальним матеріалом.

## Acceptance Criteria
1. Given я collaborator борду B (через board_members або task_shares), When `POST /boards/:id/tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `POST/DELETE /tasks/:id/attachments`, Then усі проходять як для власника.
2. Given я collaborator, When `PATCH/DELETE /boards/:id` або будь-яка мутація `board_members`/`task_shares`, Then 403 `errors.board.ownerOnly`.
3. Given collaborator змінює статус таски, When власник/інший collaborator читає `GET /boards/:id/tasks`, Then бачить оновлений статус — один спільний стан на всіх.
4. Given я collaborator лише через `task_shares` на T (без board-level доступу), When `POST /boards/:boardId/tasks` (нова таска на весь борд), Then 403 `errors.board.forbidden`.

## Локалізація
Без нових ключів — використовує вже наявні `errors.board.ownerOnly`, `errors.board.forbidden` з US-013/US-003/US-008.

## Відповідність scope
В межах. "Роль... collaborator (може додавати таски/вкладення)" — пряма вимога CLAUDE.md. Межі заборон (delete борду, керування доступом) виведені явним рішенням business-analyst-а через контрастну побудову фрази CLAUDE.md.
```

### US-016 — Viewer має read-only доступ і приватний трекінг часу

```
## User Story
Як viewer спільного борду/таски, я хочу бачити таски, статуси й вкладення, і при цьому вести власний облік часу, не маючи можливості змінювати чужий контент.

## Acceptance Criteria
1. Given я viewer борду B, When `GET /boards/:id`, `GET /boards/:id/tasks`, `GET /tasks/:id/attachments`, Then 200 з повними даними для читання.
2. Given я viewer, When `POST/PATCH/DELETE` тасок або вкладень, Then 403 `errors.board.readOnlyAccess` (відрізняється від `forbidden`, щоб FE показав правильне повідомлення "маєте доступ лише для перегляду" замість "немає доступу взагалі").
3. Given я viewer на таску T, When start/stop таймера, ручний запис, edit/delete власного запису, Then усі проходять 200/201/204 — рівно як для owner/collaborator.
4. Given viewer і owner обидва мають time-entries на T, When viewer викликає `GET /tasks/:id/time-entries`, Then відповідь містить лише рядки viewer-а плюс агреговані тотали — жодного чужого рядка (регресійна перевірка, що розширення ролей не відкрило обхідний шлях).
5. Given я viewer, When відкриваю Board view, Then кнопки "Add task"/"Delete board"/"Manage access"/edit-delete тасок і вкладень приховані/задизейблені за полем `myRole` з BE; таймер і форма ручного запису лишаються активними.

## Локалізація
- `sharing.viewerBanner` — en: "You have view-only access to this board.", uk: "Ви маєте доступ лише для перегляду цього борду."
- `errors.board.readOnlyAccess` — en: "You have view-only access — this action isn't available.", uk: "У вас доступ лише для перегляду — ця дія недоступна."
- `errors.task.readOnlyAccess` — en: "You have view-only access to this task.", uk: "У вас доступ лише для перегляду цієї таски."

## Відповідність scope
В межах. "Роль: viewer (тільки читання)" + "Прогрес завжди приватний. Записи часу... видно лише тому, хто їх залогував" — обидві вимоги з розділу "Шеринг" CLAUDE.md, продуктове рішення business-analyst-а — дозволити viewer власний трекінг часу, бо приватність прогресу сформульована як per-user гарантія, не привілей ролі.
```

### US-017 — Цілісність даних і edge cases шерингу

```
## User Story
Як система, я гарантую, що шеринг не створює суперечливих або небезпечних станів доступу.

## Acceptance Criteria
1. Given власник намагається поділитись бордом/таскою з власним email, When POST, Then 422 `errors.sharing.cannotShareWithSelf`; симетрично `errors.sharing.cannotIncludeOwner`, якщо email резолвиться в `boards.owner_id`.
2. Given email вже є в `board_members`/`task_shares`, When POST з тим самим email повторно, Then 409 `errors.boardMembers.alreadyShared`/`errors.taskShares.alreadyShared` — POST не апсертить роль мовчки, зміна лише через PATCH; гонка двох одночасних POST мапиться в той самий 409 через DB unique-constraint `(board_id, user_id)`/`(task_id, user_id)`, не 500.
3. Given DELETE і POST того самого email одночасно, When паралельні запити, Then детермінований фінальний стан (видалено АБО присутній з нововказаною роллю), без порушення unique-constraint, без 500.
4. Given борд видаляється, When транзакція комітиться, Then усі `board_members` борду і всі `task_shares` його тасок видаляються каскадно (FK ON DELETE CASCADE) — жодного осиротілого рядка доступу.
5. Given користувач X має `board_members(viewer)` на борді B і `task_shares(collaborator)` на тасці T цього борду, When X редагує T, Then дозволено (ефективна роль = max(viewer, collaborator) = collaborator); When X редагує іншу таску того ж борду, Then 403 `errors.board.readOnlyAccess` — task-level доступ ніколи не поширюється на інші таски й не понижує board-level роль.
6. Given роль у `task_shares` вказана як "owner", When POST/PATCH, Then 400 `errors.sharing.invalidRole` — task_shares ніколи не приймає owner.
7. Given PATCH і DELETE того самого доступу одночасно, When паралельні запити, Then один успіх, другий чистий 404 `errors.boardMembers.notFound`, без 500.

## Локалізація
- `errors.sharing.cannotShareWithSelf` — en: "You can't share with yourself.", uk: "Не можна поділитись із самим собою."
- `errors.sharing.cannotIncludeOwner` — en: "The board owner already has full access.", uk: "Власник борду вже має повний доступ."

## Відповідність scope
В межах — цілісність даних доступу є невід'ємною частиною коректної реалізації US-013/US-014, не окремим розширенням. Concurrency-покриття (`boardMembers.concurrency.test.js`, `taskShares.concurrency.test.js`) — той самий стандарт якості, що вже застосований до attachments/tasks/time-entries.

## Примітка щодо поточного стану
US-013…US-017 позначені ✅ Готово (2026-08-24): пройшли повний цикл fullstack-developer → tester (2 раунди, обидва фінально PASS) → code-reviewer (2 раунди — перший Request changes через reindex-leak, другий Approve, закомічено як `02de849`) → map-keeper. `PROJECT_MAP.md` оновлено відповідно.
```

**AUTH-004…AUTH-007 — походження.** Ці чотири stories виникли із запиту користувача створити профіль користувача з публічним ім'ям, компетенціями (з передвизначеного списку або введеними вручну) і перемикачем готовності викладати обрані компетенції. На момент запиту CLAUDE.md узагалі не описував профіль користувача як екран, і схема `users` не мала полів під це — свідоме розширення scope, узгоджене до реалізації (той самий прецедент, що й AUTH-003 для Google-входу): CLAUDE.md оновлено одночасно з фіксацією цих stories (розділи "Екрани" — новий п.5 "User profile"; "Дані" — `users.public_name`, нові таблиці `competencies`/`user_competencies`). Перед розбиттям на окремі stories ухвалено чотири продуктові рішення:
1. **`public_name` — нове окреме поле в `users`, не редагування наявного `display_name`.** `display_name` за вже реалізованим і затестованим контрактом AUTH-001…003 системний і незмінний після створення (береться з Google-профілю/email і "надалі не перезаписується при повторних входах"). Зробити його редагованим означало б зламати цей інваріант заднім числом. Натомість `public_name` — опційне поле, яке користувач редагує напряму з екрана профілю; FE показує його замість `display_name` скрізь, де мене бачить інший користувач (списки учасників борду, шеринг), з фолбеком на `display_name`, якщо `public_name` не задане.
2. **Компетенції — довідник у БД (`competencies`), не хардкод-список у коді FE/BE.** Список професій/навичок буде рости й потребує адміністрування окремо від релізів коду. Кожен запис має стабільний `slug`, а відображувана назва — locale-ключ `competency.<slug>` в `en.json`/`uk.json`, за тим самим патерном, що вже застосований до лейблів колонок статусу таски (`boardView.column.*`) — це узгоджується з вимогами CLAUDE.md "ніде в коді не повинно бути мовно-специфічної логіки" і "ключі перекладів — за змістом", а не з ідеєю зберігати білінгвальний текст прямо в рядку довідника.
3. **Довільна компетенція (custom) — вільний текст, без автоматичного запису в довідник `competencies`.** Зберігається як є в `user_competencies.custom_label`, не перекладається — так само, як назва борду чи таски (user-generated контент, не UI-рядок). Поповнення офіційного довідника `competencies` новими slug'ами — окремий адміністративний процес поза цим проходом, не автоматика з введеного тексту.
4. **Готовність викладати — прапорець на рівні кожної обраної компетенції, не один загальний перемикач на профіль.** Формулювання запиту ("перемикач, чи готовий користувач бути вчителем **з обраних компетенцій**") прямо вказує на прив'язку до конкретної компетенції, тож `willing_to_teach` — булеве поле на рядку `user_competencies`, не на `users`. Директорія/пошук вчителів за компетенціями свідомо не входить у цей прохід — лише збереження й показ прапорця у власному профілі.

### AUTH-004 — Перегляд/редагування профілю — публічне ім'я (public_name)

```
## User Story
Як зареєстрований користувач, я хочу переглянути й відредагувати своє публічне ім'я на екрані профілю, щоб контролювати, яке ім'я бачать інші учасники спільних бордів — незалежно від системного імені, згенерованого при реєстрації.

## Acceptance Criteria
1. Given я авторизований, When відкриваю `/profile`, Then бачу поле "Публічне ім'я" з поточним значенням `public_name` (порожнє, якщо не задане) і поруч — `display_name` як read-only довідкове значення з поясненням, що воно не редагується.
2. Given валідне ім'я (1–100 символів після trim), When натискаю "Зберегти", Then `PATCH /api/v1/users/me` оновлює `public_name`, форма показує підтвердження збереження.
3. Given я очищаю поле повністю й зберігаю, Then `public_name` встановлюється в NULL (свідомий скид до фолбеку на `display_name`) — не помилка валідації.
4. Given ім'я довше за 100 символів, When зберігаю, Then 400 `errors.profile.publicNameTooLong`, запит не проходить.
5. Given `public_name` не задане (NULL), When інший користувач бачить мене в списку учасників борду (`sharing.board.manageAccess` з US-013) або в шерингу таски, Then показується `display_name`.
6. Given `public_name` задане, When інший користувач бачить мене в тих самих контекстах, Then показується `public_name`, не `display_name`.
7. Given неавторизований запит, When `GET`/`PATCH /api/v1/users/me`, Then 401 (та сама гарантія, що вже діє для існуючого `GET /users/me`).
8. Given `PATCH` викликається без поля `public_name` у тілі (напр. запит оновлює лише `locale`), Then `public_name` лишається незмінним — часткове оновлення, не заміна всього профілю.

## Локалізація
- `profile.title` — en: "Profile", uk: "Профіль"
- `profile.publicName.label` — en: "Public name", uk: "Публічне ім'я"
- `profile.publicName.placeholder` — en: "How others see you on shared boards", uk: "Як вас бачать інші на спільних бордах"
- `profile.publicName.hint` — en: "Shown to people you share boards or tasks with, instead of your account name.", uk: "Показується людям, з якими ви ділитесь бордами чи тасками, замість імені акаунту."
- `profile.displayName.readonlyLabel` — en: "Account name (not editable)", uk: "Ім'я акаунту (не редагується)"
- `profile.save.cta` / `.saving` / `.saved` — en: "Save" / "Saving…" / "Saved", uk: "Зберегти" / "Збереження…" / "Збережено"
- `errors.profile.publicNameTooLong` — en: "Public name must be 100 characters or fewer.", uk: "Публічне ім'я має містити не більше 100 символів."

## Відповідність scope
Виходить за межі початкового CLAUDE.md на момент запиту — свідоме розширення, узгоджене до реалізації (прецедент AUTH-003). CLAUDE.md оновлено: `users.public_name` додано до розділу "Дані", `/profile` додано до "Екрани" як новий п.5. Не суперечить розділу "Поза межами цього етапу" — жоден пункт звідти не зачіпається.
```

### AUTH-005 — Додавання компетенцій з передвизначеного списку

```
## User Story
Як зареєстрований користувач, я хочу додати до свого профілю одну чи кілька компетенцій із запропонованого списку (напр. "Математик", "Бізнес-аналітик", "Розробник Java"), щоб показати, у чому я розбираюсь.

## Acceptance Criteria
1. Given я на `/profile`, When відкриваю секцію "Компетенції", Then бачу список/мультиселект активних записів `competencies` (`is_active=true`), кожен підписаний через locale-ключ `competency.<slug>`.
2. Given я обираю компетенцію зі списку, When натискаю "Додати", Then `POST /api/v1/users/me/competencies` `{competencyId}` створює `user_competencies(user_id, competency_id, is_custom=false, willing_to_teach=false)`, 201, компетенція одразу зʼявляється в моєму профілі.
3. Given ця компетенція вже додана мною раніше, When намагаюсь додати ту саму `competencyId` повторно, Then 409 `errors.competency.alreadyAdded`, дубль не створюється.
4. Given компетенція в моєму профілі, When натискаю "Прибрати", Then `DELETE /api/v1/users/me/competencies/:id`, 204, рядок видаляється (і, якщо `willing_to_teach` було true, прапорець зникає разом з рядком — не існує окремо від компетенції).
5. Given `competencyId` не існує, When POST, Then 400 `errors.competency.notFound`.
6. Given `competencyId` існує, але `is_active=false` (вивели з довідника), When POST, Then 400 `errors.competency.inactive` — не можна додати неактивну компетенцію (вже додані раніше неактивні лишаються видимими в профілі, без каскадного видалення).
7. Given у мене додано ≥1 компетенцію, When секція рендериться, Then лічильник "Компетенції ({count})" — ICU plural.
8. Given у мене немає жодної компетенції, When секція рендериться, Then порожній стан із закликом додати першу.

## Локалізація
- `profile.competencies.title` — en: "Competencies", uk: "Компетенції"
- `profile.competencies.count` (ICU plural) — en: one "{count} competency" / other "{count} competencies"; uk: one "{count} компетенція" / few "{count} компетенції" / many "{count} компетенцій" / other "{count} компетенції"
- `profile.competencies.empty` — en: "You haven't added any competencies yet.", uk: "Ви ще не додали жодної компетенції."
- `profile.competencies.addCta` / `.removeCta` — en: "Add" / "Remove", uk: "Додати" / "Прибрати"
- `profile.competencies.picker.placeholder` — en: "Choose a competency…", uk: "Оберіть компетенцію…"
- `competency.mathematician` — en: "Mathematician", uk: "Математик"
- `competency.business_analyst` — en: "Business Analyst", uk: "Бізнес-аналітик"
- `competency.java_developer` — en: "Java Developer", uk: "Розробник Java"
- `errors.competency.alreadyAdded` — en: "You've already added this competency.", uk: "Ви вже додали цю компетенцію."
- `errors.competency.notFound` — en: "This competency doesn't exist.", uk: "Такої компетенції не існує."
- `errors.competency.inactive` — en: "This competency is no longer available to add.", uk: "Цю компетенцію більше не можна додати."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — свідоме розширення, узгоджене до реалізації разом з AUTH-004 (спільний абзац "походження" вище). CLAUDE.md оновлено: таблиця `competencies` додана до розділу "Дані". Початковий сід довідника (`mathematician`/`business_analyst`/`java_developer` — приклади з запиту користувача, розширюваний список) — частина міграції, не хардкод у коді застосунку.
```

### AUTH-006 — Довільна компетенція вручну (custom competency)

```
## User Story
Як зареєстрований користувач, я хочу ввести свою компетенцію вручну, якщо потрібної немає в передвизначеному списку, щоб точно описати свою експертизу.

## Acceptance Criteria
1. Given потрібної компетенції немає в списку, When обираю опцію "Інше" в піклері й вводжу текст, Then `POST /api/v1/users/me/competencies` `{customLabel}` (без `competencyId`) створює `user_competencies(is_custom=true, custom_label=trim(text), willing_to_teach=false)`, 201.
2. Given `customLabel` порожній або складається лише з пробілів, When POST, Then 400 `errors.competency.customLabelRequired`.
3. Given `customLabel` довший за 100 символів, When POST, Then 400 `errors.competency.customLabelTooLong`.
4. Given custom-компетенція відображається в профілі, Then показується рівно введений користувачем текст, без спроби перекладу чи прогону через `competency.<slug>` — це user-generated контент, не UI-рядок.
5. Given в тілі запиту передані одночасно і `competencyId`, і `customLabel` (або жодного з двох), When POST, Then 400 `errors.competency.invalidPayload` — рівно одне з двох поле має бути заповнене.
6. Given custom-компетенція додана, When видаляю, Then той самий `DELETE /api/v1/users/me/competencies/:id`, що й для компетенцій з довідника (AUTH-005.4) — єдиний ендпоінт видалення для обох видів.
7. Given я додаю кілька custom-компетенцій з однаковим (або по-різному капіталізованим) текстом, When POST повторно, Then дублікат дозволений — вільний текст свідомо не унікалізується (на відміну від `competencyId` з AUTH-005.3), бо різні користувачі й навіть один користувач можуть по-різному сформулювати те саме.

## Локалізація
- `profile.competencies.picker.customOption` — en: "Other (type your own)", uk: "Інше (введіть свою)"
- `profile.competencies.custom.inputPlaceholder` — en: "e.g. Data visualization", uk: "напр. Візуалізація даних"
- `errors.competency.customLabelRequired` — en: "Enter a competency.", uk: "Введіть компетенцію."
- `errors.competency.customLabelTooLong` — en: "Competency must be 100 characters or fewer.", uk: "Компетенція має містити не більше 100 символів."
- `errors.competency.invalidPayload` — en: "Choose a competency from the list or enter your own — not both.", uk: "Оберіть компетенцію зі списку або введіть свою — не обидва варіанти одночасно."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — свідоме розширення, узгоджене до реалізації разом з AUTH-004/AUTH-005 (спільний абзац "походження" вище). Не суперечить розділу "Поза межами цього етапу". Рішення не переносити custom-текст автоматично в довідник `competencies` — свідомий вибір бізнес-аналітика (пункт 3 в абзаці "походження"), щоб довідник лишався контрольованим і locale-ready, а не засмічувався дублікатами вільного тексту.
```

### AUTH-007 — Перемикач готовності викладати (per-competency)

```
## User Story
Як зареєстрований користувач із доданими компетенціями, я хочу позначити, з якої саме компетенції я готовий викладати як вчитель, щоб ця готовність була зафіксована окремо для кожного напрямку, а не для всього профілю разом.

## Acceptance Criteria
1. Given у мене є компетенція в списку профілю (з довідника або custom), When вмикаю перемикач "Готовий викладати" біля неї, Then `PATCH /api/v1/users/me/competencies/:id` `{willingToTeach:true}` оновлює `user_competencies.willing_to_teach`, 200.
2. Given перемикач увімкнено, When вимикаю, Then `willing_to_teach` оновлюється в `false` — сама компетенція й далі лишається в профілі, видалення не відбувається.
3. Given `:id` належить `user_competencies` іншого користувача, When я викликаю PATCH цього id, Then 404 `errors.competency.notFound` (не 403) — anti-enumeration, той самий підхід, що вже застосований до чужих `time_entries` (US-011.7) і до sign-in (AUTH-002.2).
4. Given компетенція custom (`is_custom=true`), When вмикаю перемикач, Then дозволено так само, як для компетенції з довідника — прапорець не залежить від походження компетенції.
5. Given у мене кілька компетенцій, з яких частина позначена `willing_to_teach=true`, When рендериться профіль, Then кожна така компетенція має візуальний індикатор "Вчитель", і над списком — лічильник "Готовий викладати: {count} з {total}" (ICU plural на `{count}`).
6. Given жодна компетенція не позначена `willing_to_teach`, When рендериться профіль, Then жодного вчительського індикатора не показується — нейтральний стан, не помилка.
7. Given директорія/пошук вчителів за компетенціями, Then явно поза межами цього проходу — прапорець лише зберігається на BE й показується у власному профілі користувача; будь-який публічний список/пошук вчителів — окрема майбутня фіча.

## Локалізація
- `profile.competencies.willingToTeach.label` — en: "Available to teach", uk: "Готовий викладати"
- `profile.competencies.willingToTeach.badge` — en: "Teacher", uk: "Вчитель"
- `profile.competencies.willingToTeach.summary` (ICU plural на `{count}`) — en: one "Available to teach {count} of {total}" / other "Available to teach {count} of {total}"; uk: one "Готовий викладати {count} з {total}" / few "Готовий викладати {count} з {total}" / many "Готовий викладати {count} з {total}" / other "Готовий викладати {count} з {total}"
- `errors.competency.notFound` — реюз ключа з AUTH-005 (`errors.competency.notFound`), новий ключ не заводиться.

## Відповідність scope
Виходить за межі початкового CLAUDE.md — свідоме розширення, узгоджене до реалізації разом з AUTH-004…AUTH-006 (спільний абзац "походження" вище). Рішення "per-competency, не глобальний перемикач" — явно ухвалене продуктове рішення бізнес-аналітика на основі буквального формулювання запиту користувача (пункт 4 в абзаці "походження"), не інтерпретація за замовчуванням. Директорія/пошук вчителів свідомо винесені за межі цього проходу — новий пункт, якого раніше не було в розділі "Поза межами цього етапу" CLAUDE.md явно, але він логічно продовжує вже наявний принцип цього розділу (не будувати механізми відкриття/пошуку контенту для сторонніх у цьому релізі).
```

**AUTH-008 — походження.** Перемикач мови був зафіксований у CLAUDE.md як вимога ще з самого початку проєкту (розділ "Локалізація": "Перемикач мови — в налаштуваннях користувача (профіль)") і повторно згаданий у щойно доданому п.5 "User profile" розділу "Екрани" разом з рештою stories профілю (AUTH-004…AUTH-007) — але сам перемикач так і не був реалізований в жодному з чотирьох проходів: `frontend/src/pages/ProfilePage.jsx` не містить відповідного UI. Це зафіксовано як прогалина code-reviewer-ом при Approve with comments для AUTH-004…AUTH-007 (закомічено `fdc7421`) і явно позначено map-keeper-ом у `PROJECT_MAP.md` як `(перемикач мови: planned)` на вузлі `FE_ProfilePage`. Користувач, замовляючи реалізацію цієї прогалини, одночасно ЯВНО ЗМІНИВ раніше задокументоване рішення про розміщення: не всередині `/profile`, а у верхньому меню (шапці, `AppHeader`) поруч з посиланням на профіль. Це зміна вже задокументованого в CLAUDE.md рішення, той самий прецедент, що й AUTH-003 (розширення екрана `/auth` на Google-вхід) і AUTH-004…AUTH-007 (додавання екрана `/profile`, якого раніше не існувало) — CLAUDE.md оновлено одночасно з фіксацією цієї story: розділ "Локалізація" тепер описує перемикач як елемент шапки, а п.5 "User profile" звільнено від згадки перемикача мови, щоб опис екрана знову відповідав реальному обсягу. Продуктове рішення, як саме персистить вибір мови, ухвалено самостійно business-analyst-ом, спираючись на вже наявний контракт: CLAUDE.md з початку проєкту вимагає "збережений вибір персистить у `users`" (розділ "Локалізація") і "`locale` — збережений вибір мови" (розділ "Дані") — це не нова вимога, а частина оригінального контракту, яку новий UI нарешті реалізує. Обраний спосіб — розширити вже наявний частково-оновлюваний `PATCH /api/v1/users/me` (зараз приймає лише `publicName`, AUTH-004) опційним полем `locale`, а не заводити окремий ендпоінт — той самий ресурс профілю, той самий частковий-апдейт патерн, що вже діє для `publicName` (AUTH-004 AC8: поле, відсутнє в тілі запиту, не чіпається).

### AUTH-008 — Перемикач мови (EN/UK) у верхньому меню

```
## User Story
Як авторизований користувач, я хочу перемикати мову інтерфейсу (EN/UK) з верхнього меню на будь-якому екрані, щоб змінювати мову одразу, без переходу на окремий екран профілю, і щоб цей вибір зберігався для наступних сесій.

## Acceptance Criteria
1. Given я авторизований, When рендериться будь-який автентифікований екран (Boards overview, Board view, Profile і будь-який майбутній екран, що використовує спільний `AppHeader`), Then у шапці поруч з посиланням на профіль показується перемикач мови з опціями EN/UK, і поточна активна мова візуально позначена.
2. Given перемикач рендериться, Then він будується з реєстру підтримуваних локалей (той самий, що живить `locales/{code}.json`), а не з хардкоджених `if`-гілок на дві конкретні мови — відповідає вимозі розширюваності з розділу "Локалізація" CLAUDE.md (додавання майбутньої мови не повинно вимагати змін у цьому компоненті).
3. Given я на EN, When клацаю опцію UK (або навпаки), Then усі рядки на поточному екрані оновлюються миттєво, без перезавантаження сторінки і без очікування мережевої відповіді, що блокує рендер.
4. Given перемикання відбулось на клієнті, Then FE асинхронно викликає `PATCH /api/v1/users/me` з `{locale: "uk"}` (або `"en"`), BE оновлює `users.locale`; вибір іншого поля (`publicName`), якщо воно не передане в цьому запиті, лишається незмінним — той самий частковий-апдейт контракт, що вже діє для `publicName` (AUTH-004 AC8).
5. Given `PATCH /api/v1/users/me` з `locale` провалюється (мережа/5xx), Then мова, обрана в UI, лишається активною для поточної сесії (без відкату), і показується ненав'язливе локалізоване попередження, що вибір може не зберегтися на наступну сесію.
6. Given значення `locale` поза списком підтримуваних кодів, When `PATCH`, Then 400 `errors.profile.localeInvalid`, `users.locale` не змінюється.
7. Given я раніше обрав UK через перемикач, When я виходжу і повторно заходжу (нова сесія, той самий акаунт), Then застосунок застосовує мову зі збереженого `users.locale` (отриманого через `GET /api/v1/users/me`), а НЕ browser locale повторно — browser locale використовується лише один раз, при первинному апсерті рядка `users`, як уже зафіксовано в openapi.yaml і розділі "Локалізація" CLAUDE.md.
8. Given я новий користувач і `users.locale` щойно засіяний з browser locale (перший вхід), When відкриваю будь-який автентифікований екран, Then перемикач одразу показує цю мову як активну — без розбіжності між збереженим станом і тим, що показує UI.
9. Given перемикач у фокусі клавіатурою (Tab), When Enter/Space (або стрілки, якщо реалізовано як keyboard-групу), Then мова перемикається ідентично кліку мишею; кожна опція має видимий focus-indicator і `aria-label`, що описує дію локалізовано в обох мовах.
10. Given неавторизований відвідувач на `/auth`, Then перемикач у шапці не показується — `AppHeader` рендериться лише для автентифікованих маршрутів; мова на `/auth` і надалі визначається за browser locale, без змін відносно вже зафіксованої поведінки AUTH-003.
11. Given той самий користувач відкрив застосунок у двох вкладках, When перемикає мову в одній, Then друга вкладка не зобов'язана оновитись синхронно без перезавантаження — real-time синхронізація між вкладками явно поза межами цієї story (кожна вкладка застосує збережений `users.locale` при наступному власному завантаженні/запиті `GET /users/me`).

## API-поверхня
- Розширити `PATCH /api/v1/users/me`: додати опційне поле `locale` (enum з реєстру підтримуваних кодів, зараз `en`/`uk`) до вже наявного тіла запиту (поряд з `publicName`, AUTH-004) — той самий ендпоінт, частковий апдейт, нова помилка валідації `errors.profile.localeInvalid` при непідтримуваному значенні. Нового ендпоінта не потрібно; схема відповіді `User` вже містить поле `locale` (з моменту AUTH-003).

## Локалізація
- `app.header.language.groupLabel` — en: "Language", uk: "Мова"
- `app.header.language.switchTo` (параметризований, `{language}`) — en: "Switch to {language}", uk: "Переключити на {language}"
- `app.header.language.en` — en: "English", uk: "Англійська"
- `app.header.language.uk` — en: "Ukrainian", uk: "Українська"
- `app.header.language.syncError` — en: "Couldn't save your language preference. It will stay active for this session.", uk: "Не вдалося зберегти вибір мови. Він залишиться активним для цієї сесії."
- `errors.profile.localeInvalid` — en: "Unsupported language.", uk: "Непідтримувана мова."

## Відповідність scope
В межах — і водночас зміна раніше задокументованого рішення про розміщення, узгоджена до реалізації (той самий прецедент, що й AUTH-003/AUTH-004…007, див. абзац "походження" вище). Сам перемикач мови не є новою вимогою: CLAUDE.md фіксував його з першого релізу (розділ "Локалізація": "Перемикач мови — в налаштуваннях користувача", розділ "Дані": `users.locale`) — ця story закриває прогалину, явно позначену code-reviewer-ом і map-keeper-ом як `planned`. Розміщення в шапці замість `/profile` — свідома зміна scope на прохання користувача; CLAUDE.md оновлено одночасно (розділи "Локалізація" і "Екрани" п.5 "User profile"), щоб документ відповідав фактичному рішенню. Не суперечить розділу "Поза межами цього етапу" — жоден пункт звідти не зачіпається.
```

**US-018…US-020 — походження.** Три нотатки із ручного тестування застосунку користувачем (a.sukhorukova@gmail.com), уточнені окремо business-analyst-ом:
1. **US-018** — виявлений баг у вже завершеній фічі US-009 (вкладення): чіп нотатки обрізає текст без способу розгорнути. Presentation-only фікс, BE не зачіпається — тіло нотатки вже повністю зберігається й повертається API, обрізання відбувається лише в рендері FE.
2. **US-019** — свідоме розширення scope, явно підтверджене користувачем: "коментарі/обговорення" раніше стояли в розділі CLAUDE.md "Поза межами цього етапу"; за прямим запитом користувача пункт прибрано звідти, і фічу побудовано повноцінно (той самий прецедент, що AUTH-003/AUTH-004…008 — зміна раніше задокументованого рішення до реалізації). Ключове продуктове рішення: коментарі спільні для всіх з доступом до таски/борду (як статус таски), а не приватні (як `time_entries`); viewer коментарі лише читає, не додає — застосовано визначення ролі viewer як read-only з розділу "Шеринг" без додаткового винятку (на відміну від трекінгу часу, де приватність per-user явно скасовує рольове обмеження). MVP — без edit/delete власного коментаря, найпростіший узгоджений варіант.
3. **US-020** — нове опційне поле `tasks.planned_minutes`, підтверджене користувачем: просте зіставлення "оцінено / залоговано" без прогрес-бару чи індикатора over/under (свідомо простіше за "графіки складніші за прості тотали" з розділу "Поза межами цього етапу" — ця story не суперечить тому пункту, бо є буквально простим тоталом, не графіком). Формат вводу — два числових поля (години + хвилини), обране як найпростіший UX, узгоджений з уже наявним патерном ручного запису часу (US-011), розширеним під ширший діапазон, доречний для оцінки (а не одиничної сесії).

CLAUDE.md оновлено одночасно з фіксацією цих трьох stories: розділ "Поза межами цього етапу" більше не містить "коментарі/обговорення"; розділ "Екрани" п.4 "Task panel" доповнено описом секцій "Оцінка часу" й "Коментарі"; розділ "Дані" доповнено `tasks.planned_minutes` і новою таблицею `task_comments`.

### US-018 — Bug fix: розгортання повного тексту вкладення-нотатки

```
## User Story
Як власник борду (або будь-хто з доступом до таски), я хочу розгорнути повний текст вкладення-нотатки по кліку, щоб прочитати її цілком, коли текст не вміщається в чіп.

## Acceptance Criteria
1. Given нотатка (`attachment.kind=note`), чиє тіло довше за поріг видимого превʼю чіпа, When чіп рендериться в групі "Notes", Then текст показується обрізаним (превʼю) і під ним — контрол "Показати більше".
2. Given обрізаний чіп нотатки, When клацаю "Показати більше", Then чіп розгортається інлайн на повний збережений текст `body`, контрол змінюється на "Показати менше" — без переходу на інший екран і без модалки.
3. Given розгорнутий чіп, When клацаю "Показати менше", Then чіп повертається до обрізаного превʼю.
4. Given тіло нотатки коротше за поріг превʼю, When чіп рендериться, Then показується повний текст одразу, без контролу "Показати більше" взагалі (не порожній/задизейблений контрол — його немає в DOM).
5. Given розгортання/згортання чіпа, Then жодного нового мережевого запиту не виконується — `body` вже присутній у вже завантажених даних вкладення (BE не змінюється, це суто рендер-фікс).
6. Given користувач керує клавіатурою (Tab до контролу, Enter/Space), Then розгортання/згортання спрацьовує ідентично кліку; контрол має видимий focus-indicator і `aria-expanded`, що відповідає поточному стану.
7. Given нотатка з будь-яким `visibility` (`private`/`shared`/`selected`), Then поведінка розгортання ідентична незалежно від видимості — фікс суто презентаційний, логіку видимості вкладень не зачіпає.
8. Given нотатка, яку я не можу бачити взагалі (немає доступу до таски), Then поведінка ендпоінта видачі вкладень не змінюється цим фіксом — це той самий існуючий гейт з US-009/US-016, тут лише виправляється рендер уже дозволених даних.

## API-поверхня
Без змін BE. Це фікс рендеру існуючого, вже повністю повертаного полем `body` тексту нотатки (US-009) — жодного нового чи зміненого ендпоінта не потрібно.

## Локалізація
- `attachment.note.showMore` — en: "Show more", uk: "Показати більше"
- `attachment.note.showLess` — en: "Show less", uk: "Показати менше"
- `attachment.note.expandAriaLabel` — en: "Show full note text", uk: "Показати повний текст нотатки"
- `attachment.note.collapseAriaLabel` — en: "Collapse note text", uk: "Згорнути текст нотатки"

## Відповідність scope
В межах — це виправлення бага у вже завершеній і прийнятій фічі US-009 (вкладення-нотатки), не нова фіча й не розширення scope. Не суперечить жодному пункту "Поза межами цього етапу".
```

### US-019 — Коментарі до таски

```
## User Story
Як власник борду або collaborator, я хочу залишити коментар на тасці, щоб обговорити прогрес з іншими учасниками спільного борду прямо в контексті таски; як viewer, я хочу бачити ці коментарі, щоб бути в курсі обговорення, навіть без права редагувати чи додавати щось на борді.

## Acceptance Criteria
1. Given я маю будь-який доступ на перегляд таски (owner/collaborator/viewer, board-level або task-level), When відкриваю Task Panel, Then бачу секцію "Коментарі" зі списком усіх коментарів таски в хронологічному порядку (найстаріший — зверху), кожен з автором (`public_name`, фолбек на `display_name` — той самий патерн, що AUTH-004.5-6) і locale-aware таймстампом.
2. Given я owner або collaborator (будь-якого джерела доступу — `board_members` чи `task_shares`), When вводжу текст (1–2000 символів після trim) і сабмічу форму, Then `POST /api/v1/tasks/:id/comments` створює `task_comments(task_id, author_id=я, body, created_at=now())`, 201, коментар одразу зʼявляється в списку.
3. Given я viewer, When відкриваю секцію "Коментарі", Then список коментарів видно повністю, але форма додавання прихована/задизейблена — пряма спроба `POST` через API повертає 403 `errors.task.readOnlyAccess` (реюз ключа з US-016, той самий read-only гейт).
4. Given порожній або лише з пробілів текст, When сабміт, Then 400 `errors.comment.bodyRequired`, форма блокує сабміт ще до запиту.
5. Given текст довший за 2000 символів, When сабміт, Then 400 `errors.comment.bodyTooLong`.
6. Given я не маю жодного доступу до таски (ні board-level, ні task-level), When `GET`/`POST /tasks/:id/comments`, Then 403 `errors.task.forbidden` (реюз існуючого ключа авторизації таски).
7. Given коментар додано на спільній тасці, When інший учасник з доступом (owner/collaborator/viewer) відкриває ту саму таску, Then бачить той самий коментар — підтверджує, що коментарі спільні (як статус таски), не приватні (на відміну від `time_entries`).
8. Given велика кількість коментарів на тасці, When список завантажується, Then MVP повертає повний список без пагінації — пагінація свідомо поза межами цього проходу, не недогляд.
9. Given таска видаляється (US-007), When транзакція комітиться, Then усі `task_comments` цієї таски видаляються каскадно (FK `task_id` ON DELETE CASCADE) — жодного осиротілого коментаря.
10. Given MVP-рішення "лише перегляд і додавання", When будь-хто (включно з автором) намагається відредагувати чи видалити вже надісланий коментар, Then такої дії немає в UI, і відповідного ендпоінта не існує в цьому проході — явне свідоме обмеження, а не недороблена фіча.

## API-поверхня
- `GET /api/v1/tasks/:id/comments` — список коментарів таски (авторизація: той самий `can_view_task`, що вже використовується для attachments/time-entries).
- `POST /api/v1/tasks/:id/comments` — створення коментаря (авторизація: owner/collaborator; viewer отримує 403). Без `PATCH`/`DELETE` у цьому проході.

## Локалізація
- `taskPanel.comments.title` — en: "Comments", uk: "Коментарі"
- `taskPanel.comments.empty` — en: "No comments yet.", uk: "Коментарів ще немає."
- `taskPanel.comments.bodyPlaceholder` — en: "Write a comment…", uk: "Напишіть коментар…"
- `taskPanel.comments.submit` / `.saving` — en: "Post" / "Posting…", uk: "Надіслати" / "Надсилання…"
- `taskPanel.comments.viewerBanner` — en: "You have view-only access — you can read comments but not post new ones.", uk: "У вас доступ лише для перегляду — ви можете читати коментарі, але не додавати нові."
- `errors.comment.bodyRequired` — en: "Enter a comment.", uk: "Введіть текст коментаря."
- `errors.comment.bodyTooLong` — en: "Comment must be 2000 characters or fewer.", uk: "Коментар має містити не більше 2000 символів."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — "коментарі/обговорення" були explicit пунктом розділу "Поза межами цього етапу". Свідома зміна scope, явно підтверджена користувачем перед реалізацією (той самий прецедент, що AUTH-003/AUTH-004…008): CLAUDE.md оновлено одночасно — пункт прибрано з "Поза межами цього етапу", додано опис секції "Коментарі" в розділі "Екрани" п.4 і таблицю `task_comments` у розділі "Дані". Авторизаційна модель нова логіка не вводить — reuse `can_view_task` для читання, той самий owner/collaborator-гейт, що вже діє для tasks/attachments (US-015/US-016), для запису.
```

### US-020 — Оцінений (запланований) час на тасці

```
## User Story
Як власник борду або collaborator, я хочу вказати оцінений час на тасці (напр. "2 год 30 хв"), щоб порівнювати його з фактично залогованим часом і розуміти, наскільки я вклався в очікування.

## Acceptance Criteria
1. Given я owner або collaborator таски, When відкриваю форму редагування оцінки в секції "Час" Task Panel, Then бачу два числові поля — "Години" і "Хвилини" — попередньо заповнені поточним `planned_minutes` (розкладеним на год/хв), або порожні, якщо оцінка не задана.
2. Given я вказую години і/або хвилини (сумарно принаймні 1 хвилина), When зберігаю, Then `PATCH /api/v1/tasks/:id` `{plannedMinutes: hours*60+minutes}` оновлює `tasks.planned_minutes`, 200, і одразу поруч із фактично залогованим часом показується "Оцінено: {estimated} / Залоговано: {logged}".
3. Given години=0 і хвилини=0 (або обидва поля залишені порожніми), When зберігаю, Then трактується як свідомий скид — `planned_minutes` встановлюється в NULL, рядок "Оцінено:" зникає з відображення (не помилка валідації, той самий підхід, що очищення `public_name` в AUTH-004.3).
4. Given хвилини введено поза діапазоном 0–59 або будь-яке з полів відʼємне чи не ціле, When зберігаю, Then 400 `errors.task.plannedMinutesInvalid`, зміни не застосовуються.
5. Given сумарна оцінка перевищує 9999 хвилин (~166 годин), When зберігаю, Then 400 `errors.task.plannedMinutesTooLarge`.
6. Given `planned_minutes` не задане (NULL), When Task Panel або картка таски рендериться, Then показується лише фактично залогований час, без плейсхолдера оцінки.
7. Given `planned_minutes` задане, Then порівняння "оцінено / залоговано" показується як простий текст — без прогрес-бару чи over/under-індикатора (свідомо поза цим проходом, підтверджено користувачем); точний UI-вигляд — деталь frontend-developer.
8. Given я viewer, When намагаюсь редагувати оцінку, Then поле недоступне для редагування (read-only) в UI; пряма мутація через API повертає 403 `errors.task.readOnlyAccess` (реюз ключа US-016) — той самий гейт, що вже діє для інших полів таски.
9. Given таска, до якої я не маю доступу, When `PATCH` напряму через API, Then 403 `errors.task.forbidden` (реюз існуючого ключа).
10. Given картка таски на Board view, When `GET /boards/:id/tasks` завантажується і `planned_minutes` задане, Then відповідь містить `plannedMinutes` поруч із уже наявним `totalSeconds` (US-012) — досить для показу компактного індикатора оцінки на картці; сам вигляд індикатора — деталь frontend-developer, не AC цієї story.

## API-поверхня
- Розширити `PATCH /api/v1/tasks/:id` (уже існує для перейменування/notes, US-003/US-006): додати опційне поле `plannedMinutes` (integer, 0–9999, `null` — скид) до тіла часткового оновлення.
- Розширити відповіді `GET /api/v1/tasks/:id`, `GET /api/v1/boards/:id/tasks` полем `plannedMinutes` (nullable).

## Локалізація
- `taskPanel.plannedTime.label` — en: "Estimated time", uk: "Оцінений час"
- `taskPanel.plannedTime.hoursLabel` / `.minutesLabel` — en: "Hours" / "Minutes", uk: "Години" / "Хвилини"
- `taskPanel.plannedTime.summary` — en: "Estimated: {estimated} / Logged: {logged}", uk: "Оцінено: {estimated} / Залоговано: {logged}"
- `taskPanel.plannedTime.clear` — en: "Clear estimate", uk: "Прибрати оцінку"
- `errors.task.plannedMinutesInvalid` — en: "Enter a valid estimate (0–59 minutes, whole numbers).", uk: "Введіть коректну оцінку (0–59 хвилин, цілі числа)."
- `errors.task.plannedMinutesTooLarge` — en: "Estimate can't exceed 9999 minutes (~166 hours).", uk: "Оцінка не може перевищувати 9999 хвилин (~166 годин)."

## Відповідність scope
В межах — підтверджено користувачем як просте зіставлення "оцінено / залоговано" без прогрес-бару чи графіків. Не суперечить пункту "графіки складніші за прості тотали" з розділу "Поза межами цього етапу" CLAUDE.md: це буквально простий тотал (два числа поруч), не графік і не візуальний індикатор прогресу. CLAUDE.md оновлено: `tasks.planned_minutes` додано до розділу "Дані", опис оцінки часу додано до розділу "Екрани" п.4 "Task panel".
```

**US-021…US-024 — походження.** Запит користувача: "Для борда зроби категорії, додай категорії в фільтри і в форму додавання борди (Категорія співпадає з компетентністю). Для борда зроби поле Language (мультіселект) для фільтрації і пошуку по публічних бордах (перевір чи є така область видимості для борда, якщо ні — додай) і зроби фільтр по мові на сторінці зі списком бордів. На сторінці з бордами треба показати Мої дошки, Public Boards." Перед розбиттям на stories business-analyst уточнив (AskUserQuestion) три архітектурні рішення, зафіксовані як прийняті, без права перегляду в межах цього проходу:
1. **"Публічний" борд** = новий, окремий від `board_members` рівень видимості: видимий і відкривається в **read-only** режимі будь-якому автентифікованому користувачу без запрошення (як viewer), без потреби бути в `board_members`. Редагування/додавання лишається виключно за реальним membership (owner/collaborator) — публічність не підвищує роль і не замінює наявну модель шерингу, а додає базовий read-доступ поверх неї.
2. **Категорія борду** = перевикористання наявного довідника `competencies` (той самий, що для `user_competencies`, AUTH-005/006/007) — `boards.category_id` nullable FK, рендериться тими самими ключами `competency.<slug>`. Без нової таблиці.
3. **Мови борду** = НОВИЙ довідник `languages` (id, slug, is_active) за патерном `competencies` + junction-таблиця `board_languages` (мультиселект, борд може мати декілька мов) — locale-ключі `language.<slug>`.

Додатково, там де запит і рішення №1-3 залишали неоднозначність, business-analyst ухвалив і задокументував такі рішення (без повторного уточнення в користувача, за аналогією з прецедентами AUTH-008/US-019/US-020):
- **Редагування категорії/видимості/мов борда — owner-only.** Board-level `PATCH /boards/:id` вже й до цього був owner-only для будь-якого поля борда (US-003 AC2, явно підтверджено в US-015 AC2: `errors.board.ownerOnly` навіть для collaborator, який інакше може редагувати таски/вкладення) — нові поля (`categoryId`, `visibility`, `languageIds`) підпорядковані тому самому, вже наявному гейту, а не новому "owner/collaborator" правилу.
- **`myRole="public"`** — нове, окреме від `"viewer"` значення поля `myRole` на `Board`-відповіді для відвідувача без реального membership на публічному борді. Права ідентичні viewer (read-only), але значення відрізняється, щоб FE показував точний банер ("це публічний борд" замість "вас запросили як viewer") і щоб авторизаційний код explicit розрізняв джерело доступу. Реальне членство (owner/collaborator/viewer через `board_members` чи `task_shares`) завжди переважає над публічним базовим доступом — той самий принцип "вища роль перемагає", вже зафіксований в US-013…US-017 для board-level vs task-level доступу.
- **Приватність `time_entries` абсолютна й тут** — публічний read-only доступ не відкриває жодного чужого рядка `time_entries` навіть в агрегованому вигляді "чужих" сум; ця гарантія з розділу "Шеринг" CLAUDE.md явно поширена на нову область видимості, не послаблена нею.
- **Фільтр категорії — в обох секціях Boards overview** ("Мої дошки" і "Public Boards"), фільтр мови — **тільки в "Public Boards"**. Рішення виведене з буквального тексту запиту: мова згадана саме в контексті "для фільтрації і пошуку по публічних бордах", тоді як категорія згадана окремо, без такого обмеження ("додай категорії в фільтри" — загальний фільтр сторінки бордів).
- **Дедублікація "Мої дошки" / "Public Boards"** — публічний борд, яким я вже владію (`owner_id` = я), показується лише в "Мої дошки", не дублюється в "Public Boards" (`GET /boards/public` явно виключає `owner_id = caller`). Борд, де я лише `board_members`/`task_shares`-учасник (не owner), може з'явитися і в "Public Boards" — прийнятний наслідок того, що концепція "Shared with me" досі не реалізована (винесена поза межі ще в US-001 і повторно в US-013…US-017), ця серія stories її не закриває і свідомо не змішує з новою концепцією публічності.
- **`GET /api/v1/boards` (список "Мої дошки") лишається без змін семантики** — і надалі виключно борди, де `owner_id` = я, як зафіксовано в `openapi.yaml` (`listBoards`: "Still scoped strictly to boards owned by the caller"). Ця серія не розширює його на `board_members`-борди.
- **Без пагінації і без вільного текстового пошуку в MVP** для `GET /boards/public` — той самий свідомий підхід "просто, без зайвого", що вже застосований до `task_comments` (US-019 AC8); фільтри категорія/мова — єдиний механізм звуження списку публічних бордів у цьому проході.

CLAUDE.md (текстові зміни підготовлені, САМ ФАЙЛ НЕ РЕДАГУЄТЬСЯ цим проходом — за прямою вказівкою в запиті на цю серію stories, на відміну від прецеденту AUTH-008/US-018…US-020, де business-analyst оновлював CLAUDE.md одразу; застосування цих правок узгоджується окремо):
- Розділ **"Дані"**: `boards` доповнити `category_id` (nullable FK → `competencies`) і `visibility` (enum `private | public`, default `private`); нова таблиця `languages` (id, slug унікальний, is_active) за патерном `competencies`; нова таблиця `board_languages` (board_id, language_id) за патерном `board_members`.
- Розділ **"Шеринг"**: додати абзац про новий, третій рівень доступу — публічна видимість борда (`visibility=public`) як read-only доступ для будь-якого автентифікованого користувача без membership, окремий від і додатковий до моделі `board_members`/`task_shares`; явно зазначити, що приватність `time_entries` і правила `visibility` вкладень (`private`/`shared`/`selected`) незмінні й для публічного відвідувача.
- Розділ **"Екрани" п.2 "Boards overview"**: описати дві секції — "Мої дошки" (без змін семантики, лише борди у владінні) і "Public Boards" (нова секція, борди з `visibility=public`, де я не owner); фільтри "Категорія" (обидві секції) і "Мова" (лише "Public Boards"); форму створення/редагування борда доповнити полями "Категорія" (select з довідника `competencies`) і "Мови" (мультиселект з довідника `languages`) та перемикачем "Видимість" (owner-only).

### US-021 — Категорія борду (з довідника competencies)

```
## User Story
Як власник борду, я хочу призначити борду категорію зі спільного довідника компетенцій, щоб класифікувати дошку за темою навчання; як будь-який автентифікований користувач, я хочу фільтрувати список бордів за категорією, щоб швидше знаходити потрібні дошки.

## Acceptance Criteria
1. Given форма створення борду (US-002), When рендериться, Then містить опційне поле "Категорія" — select з усіма активними (`is_active=true`) записами `competencies`, кожен підписаний через locale-ключ `competency.<slug>` (той самий довідник і рендер-патерн, що вже в `/profile`, AUTH-005), плюс опція "Без категорії" за замовчуванням.
2. Given я вказав категорію при створенні, When сабміт, Then `POST /api/v1/boards` приймає опційне `categoryId`, зберігає в `boards.category_id`, 201 з `categoryId` у відповіді.
3. Given я власник борду, When відкриваю форму редагування борду (той самий inline-form, що для назви/опису, US-003), Then можу змінити або скинути категорію через `PATCH /api/v1/boards/:id` `{categoryId: value|null}` — той самий owner-only гейт, що вже діє для будь-якого поля борда (`errors.board.ownerOnly` для collaborator/viewer, `errors.board.forbidden` за відсутності доступу взагалі — reuse US-003/US-015).
4. Given `categoryId` не переданий у тілі PATCH, Then поле не чіпається — частковий апдейт, той самий патерн, що `publicName` (AUTH-004 AC8) і `plannedMinutes` (US-020 AC3).
5. Given `categoryId` вказує на неіснуючий запис, When POST/PATCH, Then 400 `errors.board.categoryInvalid`.
6. Given `categoryId` вказує на компетенцію з `is_active=false`, When POST/PATCH, Then 400 `errors.board.categoryInactive`; борд, якому категорію вже призначено, поки вона була активною, зберігає її і після деактивації, без каскадного очищення — той самий підхід, що AUTH-005 AC6 для `user_competencies`.
7. Given борд має категорію, When картка борду на Boards overview або заголовок Board view рендериться, Then показується бейдж категорії через `competency.<slug>`.
8. Given борд без категорії, Then бейдж категорії відсутній у DOM (не порожній плейсхолдер).
9. Given список бордів (обидві секції Boards overview, US-024), When я обираю значення у фільтрі "Категорія", Then список звужується до бордів з відповідним `category_id`; опція "Усі категорії" (дефолт) знімає фільтр.
10. Given я не власник борду (viewer/collaborator), When бачу поле категорії в UI, Then воно показується як read-only лейбл без можливості редагувати — той самий owner-only UI-гейт, що вже діє для назви/опису борда.

## API-поверхня
- Розширити `POST /api/v1/boards`, `PATCH /api/v1/boards/:id`: опційне поле `categoryId` (nullable, FK → `competencies.id`), owner-only на PATCH.
- Розширити схему `Board` (`GET /boards`, `GET /boards/:id`, `GET /boards/public` з US-024): поле `categoryId` (nullable); довідник резолвиться через уже наявний `GET /api/v1/competencies` (AUTH-005) — нового ендпоінта для довідника не потрібно.
- Новий query-параметр `categoryId` на `GET /api/v1/boards` і `GET /api/v1/boards/public` (US-024).

## Локалізація
- `board.form.category.label` — en: "Category", uk: "Категорія"
- `board.form.category.placeholder` — en: "No category", uk: "Без категорії"
- `board.filters.category.label` — en: "Category", uk: "Категорія"
- `board.filters.category.all` — en: "All categories", uk: "Усі категорії"
- `errors.board.categoryInvalid` — en: "This category doesn't exist.", uk: "Такої категорії не існує."
- `errors.board.categoryInactive` — en: "This category is no longer available to assign.", uk: "Цю категорію більше не можна призначити."
- Бейдж категорії на картці рендериться напряму через уже наявний `competency.<slug>` (AUTH-005) — новий ключ-обгортка не потрібен.

## Відповідність scope
В межах — пряме застосування рішення користувача №2 (перевикористання `competencies`, без нової таблиці). Owner-only редагування — не нове правило, а застосування вже наявного гейту (US-003/US-015) до нового поля. Не суперечить розділу "Поза межами цього етапу" CLAUDE.md.
```

### US-022 — Публічна видимість борду (read-only без запрошення)

```
## User Story
Як власник борду, я хочу зробити борд публічним, щоб будь-який автентифікований користувач міг переглянути його вміст у режимі лише читання без запрошення; як автентифікований користувач без членства в борді, я хочу відкрити публічний борд і побачити його вміст, щоб оцінити навчальний матеріал, не маючи змоги його редагувати.

## Acceptance Criteria
1. Given я власник борду, When відкриваю налаштування борду, Then бачу перемикач "Видимість" з опціями "Приватний" (дефолт, поточна поведінка без змін) і "Публічний"; той самий owner-only гейт, що для інших полів борда — `PATCH /api/v1/boards/:id` `{visibility: 'private'|'public'}`, 403 `errors.board.ownerOnly` для collaborator/viewer, 403 `errors.board.forbidden` за відсутності доступу взагалі.
2. Given борд перемкнено на `visibility=public`, When будь-який автентифікований користувач без запису в `board_members` і не власник відкриває `GET /boards/:id`, Then 200 (замість попереднього 403 `errors.board.forbidden`) з повними даними для читання; `myRole` у відповіді набуває нового значення `"public"`, окремого від `"viewer"`.
3. Given `myRole="public"`, Then UI-гейти читання-only ідентичні вже наявним для viewer (US-016 AC5): "Add task"/"Delete board"/"Manage access"/edit-delete тасок і вкладень приховані/задизейблені; будь-яка пряма `POST/PATCH/DELETE` мутація повертає 403 `errors.board.readOnlyAccess` (board-рівень) чи `errors.task.readOnlyAccess` (task-рівень) — reuse ключів з US-016, нових не потрібно.
4. Given публічний борд, When `myRole="public"`-користувач відкриває `GET /tasks/:id/attachments`, Then бачить лише вкладення з `visibility=shared`, і `visibility=selected` — лише якщо він явно є в `attachment_viewers` цього вкладення; `visibility=private` і невключений `selected` лишаються прихованими — той самий `can_view_attachment`-гейт, що вже діє для viewer, без винятків для публічного доступу.
5. Given публічний борд, Then `time_entries` НІКОЛИ не повертаються публічному відвідувачу, навіть в агрегованому вигляді чужих сум — приватність часу абсолютна й не залежить від видимості борда (пряма вимога розділу "Шеринг" CLAUDE.md); `GET /tasks/:id/time-entries` публічним відвідувачем повертає лише його власні (нульові) рядки/тотали, як для будь-якого користувача без власних записів.
6. Given публічний борд, Then статус таски й коментарі видно ідентично поточній read-поведінці спільного борду (той самий принцип "спільний стан для всіх з доступом"); додати коментар публічний відвідувач не може — 403 `errors.task.readOnlyAccess` (той самий гейт, що viewer, US-019 AC3).
7. Given у мене вже є реальне членство на публічному борді (owner/collaborator/viewer через `board_members`, або доступ через `task_shares`), Then `myRole` відображає це реальне членство, НЕ `"public"` — реальне членство завжди переважає публічний базовий доступ (той самий принцип "вища роль перемагає", US-013…US-017).
8. Given `visibility` не переданий у тілі PATCH, Then поле не чіпається — частковий апдейт, той самий патерн, що інші поля борда.
9. Given значення `visibility` поза `{private, public}`, When PATCH, Then 400 `errors.board.visibilityInvalid`.
10. Given борд перемкнули назад на `private` після того, як був публічним, Then усі попередні "публічні" відвідувачі без реального членства миттєво втрачають доступ — наступний їхній `GET /boards/:id` повертає 403 `errors.board.forbidden`.
11. Given неавтентифікований відвідувач (без Firebase ID token), When намагається відкрити публічний борд, Then 401 — публічність поширюється лише на автентифікованих користувачів (рішення користувача №1), не на анонімний доступ; публічних посилань для незареєстрованих не існує (узгоджено з "Поза межами цього етапу" CLAUDE.md).
12. Given борд публічний, When він рендериться в списку публічних бордів (`GET /boards/public`, US-024), Then елемент списку показує лише дані, дозволені будь-кому (title, description, accent, категорія, мови, taskCount) — без чужих time_entries чи прихованих вкладень; той самий гейт видимості застосований і на рівні списку, не лише деталі борда.

## API-поверхня
- Розширити `PATCH /api/v1/boards/:id`: опційне поле `visibility` (enum `private`/`public`, owner-only).
- Розширити схему `Board`: поле `visibility` (завжди присутнє, дефолт `private`); `myRole` — нове можливе значення `public` (окрім наявних `owner`/`collaborator`/`viewer`).
- Авторизаційний сервіс `can_view_board` (і похідні `can_view_task`/`can_view_attachment`) розширюється: `visibility=public` дає read-доступ будь-якому автентифікованому користувачу без запису в `board_members`/`task_shares`, з пріоритетом реального членства. Мутаційні ендпоінти (tasks/attachments/comments/members) без змін у правилах — публічність їх не відкриває.

## Локалізація
- `board.form.visibility.label` — en: "Visibility", uk: "Видимість"
- `board.form.visibility.private` — en: "Private", uk: "Приватний"
- `board.form.visibility.public` — en: "Public", uk: "Публічний"
- `board.form.visibility.publicHint` — en: "Anyone signed in can view this board (read-only). Editing still requires an invite.", uk: "Будь-хто з акаунтом може переглядати цей борд (лише читання). Для редагування все одно потрібне запрошення."
- `sharing.publicViewerBanner` — en: "This is a public board — you have view-only access.", uk: "Це публічний борд — у вас доступ лише для перегляду."
- `errors.board.visibilityInvalid` — en: "Invalid visibility value.", uk: "Некоректне значення видимості."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — до цього запиту в розділі "Шеринг" не існувало концепції публічного (без запрошення) доступу взагалі, лише `board_members`/`task_shares`. Свідоме розширення, явно узгоджене з користувачем через AskUserQuestion до реалізації (рішення №1) — той самий прецедент зміни/доповнення scope, що AUTH-003/US-019. Приватність `time_entries` і правила `visibility` вкладень лишаються незмінними й повністю чинними для нового рівня доступу (AC4-5) — ключова гарантія розділу "Шеринг" не послаблюється. Публічні посилання для НЕЗАРЕЄСТРОВАНИХ користувачів (AC11) залишаються поза межами цього етапу, як і раніше.
```

### US-023 — Мови борду (мультиселект, довідник languages)

```
## User Story
Як власник борду, я хочу вказати одну чи кілька мов навчального матеріалу борду, щоб інші користувачі могли знайти цей борд серед публічних за потрібною мовою.

## Acceptance Criteria
1. Given форма створення/редагування борду, When рендериться, Then містить опційне поле "Мови" — мультиселект з усіма активними (`is_active=true`) записами нового довідника `languages`, кожен підписаний через locale-ключ `language.<slug>` — той самий рендер-патерн, що категорія (US-021)/компетенції (AUTH-005).
2. Given я власник борду, When обираю ≥0 мов і зберігаю, Then `PATCH /api/v1/boards/:id` (або `POST /api/v1/boards` при створенні) приймає опційний масив `languageIds`, повністю замінює вміст `board_languages` для цього борда на новий набір (idempotent full-replace, не diff/append) — той самий owner-only гейт, що для категорії/видимості.
3. Given `languageIds` не переданий у тілі запиту, Then наявний набір мов борда не чіпається — поле, відсутнє в тілі, не інтерпретується як "очистити список" (той самий частковий-апдейт принцип, що publicName/plannedMinutes).
4. Given `languageIds` переданий як порожній масив `[]`, Then трактується як явний скид — усі рядки `board_languages` для борда видаляються.
5. Given один з `languageIds` вказує на неіснуючий або `is_active=false` запис, When PATCH/POST, Then 400 `errors.board.languageInvalid`, жодна зміна не застосовується (все-або-нічого, не часткове збереження валідних значень).
6. Given борд має ≥1 мову, When картка борду або заголовок Board view рендериться, Then показуються бейджі мов через `language.<slug>`.
7. Given борд без жодної мови, Then бейджі мов відсутні в DOM.
8. Given секція "Public Boards" на Boards overview (US-024), When я обираю одну чи кілька мов у фільтрі "Мова", Then список звужується до бордів, що мають БУДЬ-ЯКУ з обраних мов (OR, не AND); фільтр мови застосовується ТІЛЬКИ до секції "Public Boards" — рішення business-analyst-а, узгоджене з буквальним формулюванням запиту користувача ("для фільтрації і пошуку по публічних бордах"), на відміну від категорії, згаданої без такого обмеження.
9. Given фільтр мови без жодної обраної опції (дефолт), Then усі публічні борди показуються незалежно від мови.
10. Given я не власник борду, Then поле мов у формі показується як read-only список бейджів, без можливості редагувати.

## API-поверхня
- Нова таблиця `languages` (id, slug унікальний, is_active) — за патерном `competencies`.
- Нова junction-таблиця `board_languages` (board_id, language_id) — за патерном `board_members`.
- Новий довідниковий ендпоінт `GET /api/v1/languages` — активні мови, той самий контракт, що `GET /api/v1/competencies`.
- Розширити `POST /api/v1/boards`, `PATCH /api/v1/boards/:id`: опційне поле `languageIds` (масив, full-replace семантика, owner-only на PATCH).
- Розширити схему `Board`: поле з переліком мов борда (id/slug).
- Новий query-параметр `languageIds` — ТІЛЬКИ на `GET /api/v1/boards/public` (US-024), не на `GET /api/v1/boards`.

## Локалізація
- `board.form.languages.label` — en: "Languages", uk: "Мови"
- `board.form.languages.placeholder` — en: "Select languages…", uk: "Оберіть мови…"
- `board.filters.language.label` — en: "Language", uk: "Мова"
- `board.filters.language.all` — en: "All languages", uk: "Усі мови"
- `language.english` — en: "English", uk: "Англійська"
- `language.ukrainian` — en: "Ukrainian", uk: "Українська"
- `language.spanish` — en: "Spanish", uk: "Іспанська"
- `errors.board.languageInvalid` — en: "One of the selected languages doesn't exist or is no longer available.", uk: "Одна з обраних мов не існує або більше не доступна."

## Відповідність scope
В межах — пряме застосування рішення користувача №3 (новий довідник `languages` + junction `board_languages`, за патерном `competencies`/`board_members`). Початковий сід (`english`/`ukrainian`/`spanish` — приклади, розширюваний список) — частина міграції, не хардкод у коді застосунку, той самий підхід, що AUTH-005 для `competencies`. Не суперечить "Поза межами цього етапу" — жодної календарної синхронізації, публічних лінків для незареєстрованих чи графіків тут немає.
```

### US-024 — Boards overview: секції "Мої дошки"/"Public Boards" + фільтри

```
## User Story
Як автентифікований користувач, я хочу бачити на головній сторінці окремо свої дошки і публічні дошки інших користувачів, з можливістю фільтрувати публічні дошки за категорією й мовою, щоб знаходити цікавий навчальний контент поза власними бордами.

## Acceptance Criteria
1. Given я відкриваю `/`, Then бачу дві окремі секції — "Мої дошки" (перевикористовує наявний рендер сітки й дані з `GET /api/v1/boards` БЕЗ ЗМІН у складі: і надалі лише борди, де `owner_id` = я; борди, де я лише `board_members`/`task_shares`-учасник без владіння, у цю секцію НЕ входять — "Shared with me" лишається окремим, досі не реалізованим пунктом ще з US-001, ця story його не закриває) і "Public Boards" (нова секція, дані з нового `GET /api/v1/boards/public`).
2. Given секція "Public Boards", Then список містить борди з `visibility=public` (US-022), ЗА ВИНЯТКОМ бордів, де `owner_id` = я (борд, яким я вже владію, показується лише в "Мої дошки", не дублюється); борди, де я лише учасник через `board_members`/`task_shares` (не owner), можуть з'явитися і в "Public Boards" — прийнятний наслідок того, що "Shared with me" поки не реалізовано (AC1), не дефект цієї story.
3. Given секція "Public Boards", Then над списком — власна панель фільтрів з двома контролами: "Категорія" (single-select, той самий довідник/поведінка, що US-021 AC9) і "Мова" (мультиселект, US-023 AC8) — обидва застосовуються ТІЛЬКИ до цієї секції.
4. Given секція "Мої дошки", Then над списком — власна панель фільтрів лише з контролом "Категорія" (той самий довідник/локалізація, що в Public Boards), БЕЗ фільтра мови — мова борда є атрибутом для дискавері серед чужих публічних бордів, а не для персональної організації власних (продуктове рішення business-analyst-а, узгоджене з буквальним текстом запиту користувача).
5. Given фільтри обох секцій, When обрано значення, Then фільтрація відбувається через query-параметри відповідного ендпоінта (`GET /boards?categoryId=`, `GET /boards/public?categoryId=&languageIds=`), без клієнтського фільтрування вже завантаженого повного списку; зміна фільтра в одній секції не впливає на іншу.
6. Given у мене немає жодного власного борду, Then секція "Мої дошки" показує наявний порожній стан (US-001 AC3); секція "Public Boards" рендериться незалежно й може містити борди навіть тоді, коли "Мої дошки" порожня.
7. Given наразі немає жодного публічного борда (або жоден не проходить обраний фільтр), Then секція "Public Boards" показує окремий локалізований порожній стан, відмінний від порожнього стану "Мої дошки".
8. Given картка борду в "Public Boards", Then вона показує ті самі елементи, що картка в "Мої дошки" (назва, опис-preview, бейджі категорії/мов, taskCount), ПЛЮС ім'я власника (`public_name`, фолбек на `display_name` — той самий патерн, що AUTH-004 AC5-6/US-019 AC1), і НЕ показує контроли "Rename"/"Delete" — вони недоступні, я не owner.
9. Given картка борду в "Public Boards", When я клікаю, Then відкривається `/boards/:id` у режимі читання `myRole="public"` (US-022) — той самий роут, що для власних бордів, без окремого read-only URL.
10. Given `GET /api/v1/boards/public` викликається, Then MVP повертає повний список без пагінації (свідоме рішення, той самий підхід, що `task_comments` US-019 AC8) і без вільного текстового пошуку за назвою/описом — лише фільтри категорія/мова звужують список у цьому проході.
11. Given неавтентифікований відвідувач, Then `/` (Boards overview) недоступний без входу, як і раніше — жодних змін у гейті автентифікації самої сторінки.

## API-поверхня
- Новий `GET /api/v1/boards/public` — список бордів з `visibility=public` і `owner_id != caller`; query-параметри `categoryId` (US-021), `languageIds` (US-023); без пагінації в MVP.
- `GET /api/v1/boards` (наявний) — без змін семантики (owner-only), додається лише query-параметр `categoryId` (US-021) для фільтра секції "Мої дошки".

## Локалізація
- `board.overview.publicSection.heading` — en: "Public Boards", uk: "Публічні дошки"
- `board.overview.publicSection.empty` — en: "No public boards match your filters yet.", uk: "Немає публічних дошок за обраними фільтрами."
- `board.overview.publicSection.ownerLabel` (параметризований, `{ownerName}`) — en: "By {ownerName}", uk: "Автор: {ownerName}"
- `board.filters.clear` — en: "Clear filters", uk: "Скинути фільтри"
- Заголовок секції "Мої дошки" перевикористовує вже наявний `board.overview.heading` (US-001: "Your boards"/"Ваші дошки") — новий ключ не заводиться, текст уже семантично відповідає ролі заголовка секції.

## Відповідність scope
В межах — секції "Мої дошки"/"Public Boards" прямо названі в запиті користувача. Явно НЕ вводить "Shared with me" (окрема, досі не реалізована концепція з US-001/US-013…US-017) — свідомо розділено, щоб не змішувати два різні механізми доступу (публічність за видимістю борда vs явне членство за запрошенням/email). Не суперечить "Поза межами цього етапу": вільний текстовий пошук і пагінація свідомо не вводяться цим проходом (AC10).
```

**US-025…US-029 — походження.** Запит користувача: "Пошук профілей за компетентністю (яка відмічена 'Готовий викладати') - додати можливість передивитися профіль, або написати повідомлення. Створити чати за компетентністю, де люди можуть спілкуватися в рамках обраної компетентності." Це принципово нова функціональна область — до цього запиту в CLAUDE.md не існувало жодного месенджингу/чату, і сам розділ "Архітектура" описував виключно REST. Перед розбиттям на stories business-analyst уточнив (AskUserQuestion) чотири архітектурні рішення, зафіксовані як прийняті, без права перегляду в межах цього проходу:

1. **Реалтайм — WebSocket, не polling.** Нова інфраструктурна спроможність проєкту. Автентифікація WS-з'єднання — тим самим Firebase ID token, що й REST (не окремий механізм). Технічне рішення "як саме" (окремий WS-процес у `docker-compose.yml` чи WS, приєднаний до вже наявного backend-процесу на порту 4000) — на розсуд backend-developer.
2. **DM (особисті повідомлення) — окремий тред на кожну пару "користувач + компетенція".** Той самий двоє людей у контексті різних компетенцій — два незалежні треди з окремою історією. Унікальність: (менший_user_id, більший_user_id, competency_id) — дублікат треду для тієї самої пари+компетенції неможливий.
3. **Груповий чат "за компетентністю" — рівно одна спільна кімната на кожен запис довідника `competencies`.** Кімната = сама компетенція (ідентифікується `competency_id`), без окремої таблиці "кімнат" і без UI створення/перейменування/видалення нових довільних чатів.
4. **Доступ до групового чату компетенції — будь-який автентифікований користувач**, незалежно від того, чи ця компетенція є в його/її профілі (`user_competencies`) і незалежно від `willing_to_teach`. Читати й писати може будь-хто автентифікований.

Додатково, там де запит і рішення №1-4 залишали неоднозначність, business-analyst ухвалив і задокументував такі рішення (без повторного уточнення в користувача, за аналогією з прецедентами AUTH-008/US-019/US-020/US-021…024):
- **Визначення `competency_id` для нового DM-треду, коли профіль відкрито НЕ з результатів пошуку за конкретною компетенцією** (напр. прямий перехід на `/users/:id`): якщо в цільової людини рівно одна компетенція з `willing_to_teach=true` — тред створюється одразу за нею; якщо декілька — кнопка "Написати повідомлення" пропонує короткий вибір з цих компетенцій перед створенням треду; якщо жодної — кнопка прихована/задизейблена, бо DM-тред за моделлю рішення №2 завжди прив'язаний до конкретної компетенції, а єдине джерело контексту для незнайомої пари — готовність цільової людини викладати. Компетенція для треду завжди береться зі списку `willing_to_teach=true` САМЕ цільового користувача (той, кому пишуть), не ініціатора.
- **Модель доставки повідомлень — REST зберігає, WS прискорює доставку, не є єдиним каналом.** Відправка повідомлення (DM і груповий чат компетенції однаково) — завжди `POST` REST-ендпоінт, який пише рядок у БД; сервер після успішного запису розсилає подію через WS активним підписаним з'єднанням. Якщо WS-з'єднання адресата відсутнє в момент відправки — повідомлення не втрачається, воно завжди доступне через `GET .../messages` при наступному завантаженні. Це узгоджено з уже наявним у проєкті принципом "стан на BE, не на клієнті" (той самий, що для таймера US-010: `started_at` на сервері, а не локальний стан).
- **Без лічильника непрочитаних і без індикатора "нового повідомлення" на рівні списку тредів поза оновленням сортування.** WS-подія на рівні списку моїх DM-тредів піднімає тред з новим повідомленням наверх (сортування за часом останньої активності) — це не read-receipt і не typing-indicator, а базова UX-необхідність (інакше новий тред загубиться в списку), тому не вважається виходом за межі виключення "read receipts" з переліку користувача.
- **Немає редагування/видалення повідомлень в обох типах чату** — той самий MVP-принцип, що вже застосований до `task_comments` (US-019 AC10): лише перегляд і додавання.
- **Без пагінації історії повідомлень у MVP** — той самий підхід, що вже застосований до `task_comments` (US-019 AC8) і `GET /boards/public` (US-024 AC10).
- **Пошук — лише за однією компетенцією за раз** (буквально за формулюванням запиту), мультиселект компетенцій у пошуку свідомо не вводиться цим проходом.
- **Деактивація компетенції (`is_active=false`) не видаляє історію групового чату** — той самий підхід "не каскадне видалення", що вже застосований до `user_competencies`/`board.category_id` (AUTH-005 AC6/US-021 AC6): продуктовий шлях до кімнати закривається, дані лишаються в БД.

Свідомо поза межами цього проходу (явно зафіксовано, не недогляд): read receipts/"прочитано", typing indicators, push-нотифікації на телефон/email про нове повідомлення, редагування/видалення повідомлень, модерація/скарги на повідомлення, пошук за кількома компетенціями одночасно, пагінація історії повідомлень.

CLAUDE.md (текстові зміни підготовлені, САМ ФАЙЛ НЕ РЕДАГУЄТЬСЯ цим проходом — за прямою вказівкою в запиті на цю серію stories, той самий підхід, що прецедент US-021…024; застосування цих правок узгоджується окремо):
- Розділ **"Архітектура"**: додати абзац після діаграми FE→BE→PostgreSQL: "Окрім REST, з US-029 застосунок отримує другий канал — WebSocket-з'єднання для повідомлень чату в реальному часі (DM і групові кімнати компетенцій). Це усвідомлене, перше відхилення від чистого REST-контракту; WS автентифікується тим самим Firebase ID token, що й REST-запити, і є виключно каналом доставки "наживо" — джерелом правди й фолбеком лишається REST (`GET .../messages`), WS ніколи не єдиний спосіб отримати повідомлення." Технічна деталь розміщення WS-шару (окремий сервіс `docker-compose.yml` чи той самий backend-процес на порту 4000) — на розсуд backend-developer, документується постфактум після реалізації US-029.
- Розділ **"Екрани"**: додати нові пункти — "**People search** (`/people`) — фільтр за компетенцією з довідника `competencies`, результат — список користувачів з `willing_to_teach=true` для обраної компетенції (публічне ім'я, список компетенцій, готових викладати; без email)"; "**User profile (чужий)** (`/users/:id`) — публічні дані іншого користувача (ім'я, компетенції з позначками готовності викладати), без приватних даних; кнопка "Написати повідомлення" веде до DM-треду за компетенцією"; "**Chat** — список моїх DM-тредів + вікно конкретного треду (хронологічний список повідомлень + форма відправки, WebSocket push нових повідомлень); кожна компетенція з довідника має власну групову кімнату обговорення, доступну на читання й запис будь-якому автентифікованому користувачу".
- Розділ **"Дані"**: нова таблиця `dm_threads` (id, user_a_id FK → users, user_b_id FK → users, competency_id FK → competencies, created_at; unique constraint на нормалізовану пару (менший_user_id, більший_user_id, competency_id)); нова таблиця `dm_messages` (id, thread_id FK → dm_threads, sender_id FK → users, body, created_at); нова таблиця `competency_chat_messages` (id, competency_id FK → competencies, sender_id FK → users, body, created_at) — групова кімната компетенції не має окремої таблиці "кімнат", ідентифікується напряму `competency_id`.
- Розділ **"Поза межами цього етапу"**: додати "read receipts/індикатори прочитання, typing indicators, push-нотифікації на телефон/email про нові повідомлення чату, редагування/видалення повідомлень чату, модерація/скарги на повідомлення, пошук профілів за кількома компетенціями одночасно" до вже наявного переліку.

### US-025 — Пошук профілів за компетентністю

```
## User Story
Як автентифікований користувач, я хочу знайти людей, які готові викладати обрану компетенцію, щоб звернутися до них за допомогою в навчанні.

## Acceptance Criteria
1. Given я на екрані пошуку профілів (`/people`, доступний з навігації в шапці поруч з посиланням на профіль), When обираю компетенцію зі списку (`GET /api/v1/competencies`, лише `is_active=true` — той самий довідник і рендер-патерн, що AUTH-005/US-021), Then бачу результат — список користувачів, у яких САМЕ ЦЯ компетенція позначена `willing_to_teach=true` у `user_competencies` (буквально за формулюванням запиту — не всі, у кого є ця компетенція, а лише ті, хто явно готовий викладати).
2. Given компетенцію ще не обрано (стан за замовчуванням при відкритті екрана), Then список результатів порожній із запрошенням обрати компетенцію — запит до BE не виконується без параметра.
3. Given обрано компетенцію, за якою жоден користувач не позначив `willing_to_teach=true`, Then показується локалізований порожній стан "Нікого не знайдено для цієї компетенції".
4. Given картка результату пошуку, Then показує `public_name` (фолбек на `display_name` — той самий патерн AUTH-004.5-6/US-019 AC1) і повний список компетенцій ЦЬОГО користувача, позначених `willing_to_teach=true` (не лише ту, за якою знайдено, — корисний контекст, скільки ще людина готова викладати); картка НЕ показує email, борди, час чи будь-які інші приватні дані.
5. Given N знайдених користувачів, Then над списком показується лічильник результатів з ICU-плюралізацією: `people.search.resultsCount` (EN one/other: "{count} person found"/"{count} people found"; UK one/few/many/other: "Знайдено {count} людину"/"Знайдено {count} людей"/"Знайдено {count} людей"/"Знайдено {count} людини").
6. Given я клікаю на картку результату, Then переходжу на `/users/:id` (US-026) з переданим у контекст `competencyId`, за яким знайдено цю людину — щоб кнопка "Написати повідомлення" на профілі одразу знала потрібну компетенцію (US-026 AC3), без додаткового вибору.
7. Given я сам присутній серед результатів (я теж позначив цю компетенцію `willing_to_teach=true`), Then я бачу себе у списку так само, як інших, — без спеціального виключення.
8. Given компетенція, яку я обрав у фільтрі, деактивована (`is_active=false`) вже ПІСЛЯ виконаного запиту (рідкісний edge case), Then вже отримані результати в UI лишаються без миттєвої інвалідації, але сам фільтр при переоткритті екрана більше не пропонує цю компетенцію — той самий підхід, що AUTH-005 AC6/US-021 AC6.
9. Given неавтентифікований відвідувач, When намагається відкрити `/people`, Then 401/редірект на `/auth` — застосунок вимагає автентифікації всюди, пошук профілів не виняток.

## API-поверхня
- Новий `GET /api/v1/users/search?competencyId={id}` — список публічних профілів, де `user_competencies.competency_id = {id} AND willing_to_teach = true`; для кожного профілю — весь перелік його `willing_to_teach=true` компетенцій. Auth required, без пагінації в MVP.
- Reuse наявного `GET /api/v1/competencies` (AUTH-005) для довідника фільтра.

## Локалізація
- `people.search.title` — en: "Find people to learn from", uk: "Знайти людей для навчання"
- `people.search.competencyLabel` — en: "Competency", uk: "Компетенція"
- `people.search.competencyPlaceholder` — en: "Choose a competency…", uk: "Оберіть компетенцію…"
- `people.search.emptyNoSelection` — en: "Choose a competency to see who's willing to teach it.", uk: "Оберіть компетенцію, щоб побачити, хто готовий її викладати."
- `people.search.emptyNoResults` — en: "No one is willing to teach this competency yet.", uk: "Поки що ніхто не готовий викладати цю компетенцію."
- `people.search.resultsCount` (ICU) — en: "{count, plural, one {# person found} other {# people found}}", uk: "{count, plural, one {Знайдено # людину} few {Знайдено # людини} many {Знайдено # людей} other {Знайдено # людини}}"
- `people.search.willingToTeachBadge` — en: "Willing to teach", uk: "Готовий(а) викладати"
- `people.search.viewProfile` — en: "View profile", uk: "Переглянути профіль"

## Відповідність scope
Виходить за межі початкового CLAUDE.md — пошуку профілів інших користувачів досі не існувало взагалі (єдиний наявний ендпоінт про "себе" — `GET /users/me`). Свідоме розширення, підтверджене користувачем перед реалізацією (той самий прецедент AUTH-003/US-019/US-022). Авторизаційна модель нової логіки не потребує понад "будь-хто автентифікований" — reuse наявних `public_name`-фолбек патернів (AUTH-004) і довідника `competencies` (AUTH-005/US-021), нового storage-шару не додає. Email і приватні дані (борди/час) explicit не показуються — узгоджено з принципом мінімально необхідного для приватності з розділу "Шеринг" CLAUDE.md.
```

### US-026 — Перегляд чужого профілю

```
## User Story
Як автентифікований користувач, я хочу переглянути публічний профіль іншого користувача і за потреби написати йому повідомлення в контексті конкретної компетенції, щоб домовитися про навчання.

## Acceptance Criteria
1. Given валідний `userId`, When відкриваю `/users/:id`, Then бачу публічні дані: ім'я (`public_name`, фолбек на `display_name`) і повний список компетенцій цього користувача (`user_competencies`, рендер через `competency.<slug>`) з позначкою "Готовий(а) викладати" там, де `willing_to_teach=true`; НЕ бачу email, борди, час чи будь-які інші приватні дані цього користувача.
2. Given `userId` не існує, When відкриваю `/users/:id`, Then 404 `errors.user.notFound`, локалізований порожній стан замість профілю.
3. Given я перейшов на профіль з результатів пошуку за конкретною компетенцією (US-025 AC6, `competencyId` переданий у контекст переходу), When клікаю "Написати повідомлення", Then DM-тред створюється/відкривається одразу за тією компетенцією, без додаткового вибору.
4. Given я відкрив профіль напряму (не з пошуку — наприклад, прямий перехід за посиланням) і в цього користувача РІВНО ОДНА компетенція з `willing_to_teach=true`, When клікаю "Написати повідомлення", Then тред створюється/відкривається одразу за тією єдиною компетенцією, без додаткового вибору.
5. Given я відкрив профіль напряму і в цього користувача КІЛЬКА компетенцій з `willing_to_teach=true`, When клікаю "Написати повідомлення", Then показується короткий вибір "За якою компетенцією?" з цих компетенцій, і лише після вибору створюється/відкривається тред.
6. Given у цього користувача ЖОДНОЇ компетенції з `willing_to_teach=true`, Then кнопка "Написати повідомлення" прихована/задизейблена з поясненням "Ця людина ще не позначила готовність викладати" — DM-тред за моделлю (рішення №2) завжди прив'язаний до конкретної компетенції, почати чат без цього контексту не можна.
7. Given `userId` дорівнює моєму власному id, Then сторінка мого власного публічного профілю відкривається нормально (не помилка), але кнопка "Написати повідомлення" прихована — самому собі писати не можна.
8. Given неавтентифікований відвідувач, When намагається відкрити `/users/:id`, Then 401/редірект на `/auth`.

## API-поверхня
- Новий `GET /api/v1/users/:id` — публічний профіль (id, ім'я з фолбеком, повний список `user_competencies` з `willingToTeach`-прапорцем). Auth required, доступний для будь-якого валідного `userId`, не лише членів спільного борду.
- Ініціює `POST /api/v1/dm-threads` (US-027) при кліку "Написати повідомлення".

## Локалізація
- `profile.public.title` — en: "Profile", uk: "Профіль"
- `profile.public.competenciesTitle` — en: "Competencies", uk: "Компетенції"
- `profile.public.willingToTeachBadge` — en: "Willing to teach", uk: "Готовий(а) викладати"
- `profile.public.notFound` — en: "This profile doesn't exist.", uk: "Такого профілю не існує."
- `profile.public.messageButton` — en: "Send message", uk: "Написати повідомлення"
- `profile.public.messageButton.disabledNoCompetencies` — en: "This person hasn't marked any competency as willing to teach yet.", uk: "Ця людина ще не позначила готовність викладати жодну компетенцію."
- `profile.public.pickCompetencyPrompt` — en: "Which competency is this about?", uk: "За якою компетенцією?"
- `errors.user.notFound` — en: "User not found.", uk: "Користувача не знайдено."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — перегляду профілю іншого користувача поза списками учасників борду/шерингу досі не існувало. Свідоме розширення, узгоджене з рішеннями №1-4 і уточненнями business-analyst-а щодо визначення `competencyId` для DM (єдина суттєва неоднозначність запиту, розв'язана вище в розділі "походження"). Reuse наявного `public_name`-фолбек патерну (AUTH-004), новий авторизаційний шар — лише "будь-хто автентифікований може переглянути будь-який публічний профіль", без нової ролі чи рівня доступу.
```

### US-027 — DM-чат (особисті повідомлення за парою користувач+компетенція)

```
## User Story
Як автентифікований користувач, я хочу написати особисте повідомлення іншому користувачу в контексті конкретної компетенції й отримувати нові повідомлення в реальному часі, щоб домовитися про навчання.

## Acceptance Criteria
1. Given валідний `targetUserId` (≠ мій власний id) і `competencyId` з переліку компетенцій, позначених `willing_to_teach=true` у `targetUserId` (визначено на US-026 AC3-5), When ініціюю "Написати повідомлення", Then `POST /api/v1/dm-threads {targetUserId, competencyId}` виконує get-or-create: якщо тред для пари (мій id, targetUserId, competencyId) вже існує — повертає його (200); інакше створює новий `dm_threads`-рядок (201). Унікальність гарантується на рівні БД (unique constraint на нормалізовану пару менший/більший user_id + competency_id) — дублікат треду для тієї самої пари+компетенції неможливий.
2. Given `targetUserId` дорівнює моєму власному id, When `POST /dm-threads`, Then 400 `errors.dmThread.cannotMessageSelf`, тред не створюється.
3. Given `competencyId`, який НЕ позначений `willing_to_teach=true` у `targetUserId` (пряма спроба обійти UI-вибір через API), When `POST /dm-threads`, Then 400 `errors.dmThread.competencyNotOffered`.
4. Given я один з двох учасників треду, When `GET /api/v1/dm-threads/:id/messages`, Then бачу всі повідомлення треду в хронологічному порядку (найстаріше — зверху), без пагінації в MVP (той самий підхід, що task_comments US-019 AC8).
5. Given я НЕ учасник треду, When `GET /dm-threads/:id/messages` чи `POST .../messages`, Then 403 `errors.dmThread.forbidden` — тільки два учасники бачать і пишуть у тред; приватність абсолютна, жодної адміністративної ролі-винятку в проєкті немає.
6. Given я учасник треду, When надсилаю текст (1–2000 символів після trim — той самий ліміт, що task_comments US-019), Then `POST /api/v1/dm-threads/:id/messages {body}` створює `dm_messages(thread_id, sender_id=я, body, created_at=now())`, 201, і сервер розсилає подію нового повідомлення через WebSocket іншому учаснику, якщо в нього активне автентифіковане WS-з'єднання, підписане на цей тред.
7. Given порожній/лише-пробільний текст, When сабміт, Then 400 `errors.dmThread.messageBodyRequired`, форма блокує сабміт ще до запиту; текст довший за 2000 символів — 400 `errors.dmThread.messageBodyTooLong`.
8. Given WS-з'єднання іншого учасника відсутнє чи розірване в момент відправки, Then повідомлення все одно зберігається (REST — джерело правди) і буде видане при наступному `GET .../messages`; WS лише прискорює доставку "наживо" й ніколи не є єдиним каналом збереження — жодних втрачених повідомлень при розриві з'єднання.
9. Given у мене відкритий конкретний тред у застосунку, When надходить WS-подія нового повідомлення для цього треду, Then повідомлення додається у видимий список миттєво, без ручного оновлення сторінки.
10. Given у мене НЕ відкритий конкретний тред, When надходить нове повідомлення в один з моїх тредів, Then список моїх тредів (екран "Мої повідомлення") піднімає цей тред наверх за часом останньої активності при наступному відкритті чи через WS-подію на рівні списку; лічильник непрочитаних НЕ вводиться (read receipts — поза межами цього проходу).
11. Given `GET /api/v1/dm-threads` (список моїх тредів), Then кожен елемент показує співрозмовника (`public_name`/фолбек), компетенцію (`competency.<slug>`), текст і час останнього повідомлення (якщо є) — відсортовано за часом останньої активності, найновіші зверху.
12. Given тред щойно створено через "Написати повідомлення", але текст ще не надіслано, Then він все одно з'являється в списку моїх тредів з порожнім прев'ю останнього повідомлення — можна повернутись і написати пізніше.
13. Given я відкриваю екран конкретного треду, When встановлюється WS-з'єднання для отримання нових повідомлень наживо, Then автентифікація відбувається тим самим Firebase ID token, що й для REST-запитів цього сеансу — не окремий механізм логіну для чату (US-029 AC2).

## API-поверхня
- `POST /api/v1/dm-threads` — get-or-create треду за `{targetUserId, competencyId}`.
- `GET /api/v1/dm-threads` — список моїх тредів, відсортований за часом останньої активності.
- `GET /api/v1/dm-threads/:id/messages` — історія повідомлень треду (учасники only).
- `POST /api/v1/dm-threads/:id/messages` — надсилання повідомлення (учасники only).
- WS-подія (не REST) `dm.message.created` — push нового повідомлення учасникам треду з активним підписаним з'єднанням; точний протокол/найменування подій — деталь backend-developer (US-029).

## Локалізація
- `chat.dm.listTitle` — en: "Messages", uk: "Повідомлення"
- `chat.dm.emptyList` — en: "No conversations yet.", uk: "Розмов ще немає."
- `chat.dm.threadHeading` (параметризований `{name}`, `{competency}`) — en: "Chat with {name} — {competency}", uk: "Чат з {name} — {competency}"
- `chat.dm.messagePlaceholder` — en: "Write a message…", uk: "Напишіть повідомлення…"
- `chat.dm.send` / `.sending` — en: "Send" / "Sending…", uk: "Надіслати" / "Надсилання…"
- `chat.dm.emptyThread` — en: "No messages yet — say hello!", uk: "Повідомлень ще немає — напишіть перший!"
- `errors.dmThread.cannotMessageSelf` — en: "You can't message yourself.", uk: "Ви не можете написати повідомлення самому собі."
- `errors.dmThread.competencyNotOffered` — en: "This person hasn't marked that competency as willing to teach.", uk: "Ця людина не позначила цю компетенцію як таку, яку готова викладати."
- `errors.dmThread.forbidden` — en: "You don't have access to this conversation.", uk: "У вас немає доступу до цієї розмови."
- `errors.dmThread.messageBodyRequired` — en: "Enter a message.", uk: "Введіть текст повідомлення."
- `errors.dmThread.messageBodyTooLong` — en: "Message must be 2000 characters or fewer.", uk: "Повідомлення має містити не більше 2000 символів."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — месенджингу між користувачами не існувало взагалі. Свідоме розширення, узгоджене з рішенням користувача №2 (модель треду "пара + компетенція", унікальність за нормалізованою парою) і рішенням №1 (WS-реалтайм, автентифікація тим самим Firebase ID token). Приватність DM абсолютна (лише два учасники, AC5) — узгоджено з принципом приватності `time_entries`/вкладень з розділу "Шеринг", застосованим до нової сутності. Редагування/видалення повідомлень і read receipts свідомо не входять у цей прохід (розділ "походження" вище).
```

### US-028 — Груповий чат компетенції

```
## User Story
Як автентифікований користувач, я хочу писати й читати повідомлення в спільному чаті обраної компетенції, щоб спілкуватися в реальному часі з усіма, кого цікавить ця тема.

## Acceptance Criteria
1. Given будь-яка активна компетенція з довідника `competencies`, Then для неї автоматично існує рівно одна групова кімната обговорення, ідентифікована `competency_id` — без окремої таблиці "кімнат" і без UI створення/перейменування/видалення нових довільних чатів (рішення користувача №3).
2. Given я будь-який автентифікований користувач (незалежно від того, чи ця компетенція є в моєму профілі `user_competencies`, і незалежно від `willing_to_teach` — рішення користувача №4), When відкриваю чат компетенції (напр. з екрана пошуку US-025 чи довідника компетенцій), Then `GET /api/v1/competencies/:id/chat/messages` повертає всі повідомлення цієї кімнати в хронологічному порядку, без пагінації MVP.
3. Given я автентифікований, When надсилаю текст (1–2000 символів після trim — той самий ліміт, що DM/task_comments), Then `POST /api/v1/competencies/:id/chat/messages {body}` створює `competency_chat_messages(competency_id, sender_id=я, body, created_at=now())`, 201, і WS-подія розсилається всім поточним підписникам цієї кімнати (усім активним WS-з'єднанням, підписаним на цей `competency_id`).
4. Given порожній/лише-пробільний текст, When сабміт, Then 400 `errors.competencyChat.messageBodyRequired`; текст довший за 2000 символів — 400 `errors.competencyChat.messageBodyTooLong`.
5. Given `competencyId` не існує або належить запису з `is_active=false`, When `GET`/`POST .../chat/messages`, Then 404 `errors.competencyChat.notFound` — деактивована компетенція закриває продуктовий шлях до кімнати, але не видаляє історію в БД (той самий підхід "не каскадне видалення", що AUTH-005 AC6/US-021 AC6).
6. Given кілька користувачів надсилають повідомлення одночасно, Then усі зберігаються без втрат — звичайний insert, без спеціальної обробки конкурентності в MVP.
7. Given неавтентифікований відвідувач, When будь-яка дія в чаті компетенції, Then 401.
8. Given екран чату конкретної компетенції, Then кожне повідомлення показує автора (`public_name`/фолбек `display_name`) і locale-aware таймстамп — той самий патерн, що task_comments (US-019 AC1).
9. Given я закриваю екран чату компетенції й повертаюсь пізніше, Then бачу повну історію через REST (`GET .../chat/messages`) незалежно від того, чи було активне WS-з'єднання весь цей час — WS доставляє лише повідомлення, що надійшли, поки з'єднання й підписка активні.

## API-поверхня
- Нова таблиця `competency_chat_messages` (id, competency_id FK → competencies, sender_id FK → users, body, created_at).
- `GET /api/v1/competencies/:id/chat/messages` — історія повідомлень кімнати (будь-хто автентифікований).
- `POST /api/v1/competencies/:id/chat/messages` — надсилання повідомлення (будь-хто автентифікований).
- WS-подія `competencyChat.message.created` — push усім підписникам кімнати `competency_id`.

## Локалізація
- `chat.competency.title` (параметризований `{competency}`) — en: "{competency} chat", uk: "Чат: {competency}"
- `chat.competency.messagePlaceholder` — en: "Write a message…", uk: "Напишіть повідомлення…"
- `chat.competency.send` / `.sending` — en: "Send" / "Sending…", uk: "Надіслати" / "Надсилання…"
- `chat.competency.empty` — en: "No messages yet — start the conversation!", uk: "Повідомлень ще немає — почніть розмову!"
- `errors.competencyChat.messageBodyRequired` — en: "Enter a message.", uk: "Введіть текст повідомлення."
- `errors.competencyChat.messageBodyTooLong` — en: "Message must be 2000 characters or fewer.", uk: "Повідомлення має містити не більше 2000 символів."
- `errors.competencyChat.notFound` — en: "This competency chat is not available.", uk: "Цей чат компетенції недоступний."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — групових чатів не існувало взагалі. Свідоме розширення, узгоджене з рішеннями користувача №3 (кімната = сама компетенція, без окремої таблиці) і №4 (доступ будь-кому автентифікованому). Авторизаційна модель — найпростіша з усіх нових сутностей цього проходу ("будь-хто автентифікований" на читання й запис, без owner/collaborator/viewer розрізнення) — точно за буквою рішення №4. Модерація/скарги свідомо поза межами (розділ "походження").
```

### US-029 — Інфраструктура WebSocket (автентифікація Firebase ID token)

```
## User Story
Як розробник продукту, я хочу мати надійний WebSocket-канал з автентифікацією тим самим механізмом, що й REST, щоб DM-чат і групові чати компетенцій отримували нові повідомлення в реальному часі без polling.

## Acceptance Criteria
1. Given застосунок досі мав виключно REST API (розділ "Архітектура" CLAUDE.md), Then додається новий WebSocket-канал — перше усвідомлене відхилення від чистого REST-контракту, задокументоване явно в CLAUDE.md (текст підготовлено в розділі "походження" вище), не мовчазне розширення архітектури.
2. Given клієнт встановлює WS-з'єднання, When handshake, Then автентифікація відбувається тим самим Firebase ID token, що вже використовується для REST — конкретний спосіб передачі токена при WS-connect (query-параметр, перше службове повідомлення після відкриття тощо) на розсуд backend-developer; BE верифікує токен через той самий Firebase Admin SDK, що й REST auth middleware — не окремий механізм автентифікації.
3. Given токен відсутній, протермінований або невалідний, When WS-з'єднання встановлюється, Then сервер відхиляє/закриває з'єднання одразу після handshake, без прийому підписок чи повідомлень.
4. Given з'єднання автентифіковане, When клієнт підписується на конкретний DM-тред чи кімнату компетенції, Then сервер перевіряє право доступу тим самим сервісним шаром авторизації, що для відповідного REST-ендпоінта (учасник треду для DM — US-027 AC5; будь-хто автентифікований для кімнати компетенції — US-028 AC2), перш ніж прийняти підписку; спроба підписатись на чужий DM-тред відхиляється без розкриття існування чи вмісту треду.
5. Given WS-з'єднання розірване (мережа, перезавантаження вкладки), When клієнт відновлює з'єднання, Then жодне повідомлення не втрачається — повна історія завжди доступна через REST (`GET .../messages`, US-027/US-028), WS — лише канал доставки "наживо" для подій, що сталися після повторного підключення й підписки.
6. Given технічна реалізація WS-шару (окремий процес чи інтеграція у вже наявний backend Express/Node-процес на порту 4000), Then конкретне рішення "як саме" — на розсуд backend-developer; ця story фіксує лише контракт (автентифікація токеном, авторизація підписок на рівні існуючих сервісів `can_view_dm_thread`/еквівалент, delivery guarantee "REST — джерело правди, WS — прискорення"), не деталі реалізації.
7. Given рішення backend-developer щодо розміщення WS-шару, When WS інтегровано в наявний `backend`-сервіс на порту 4000 без нового докер-сервісу, Then `docker-compose.yml` лишається без змін у складі сервісів; Given натомість обрано окремий процес, Then потрібне оновлення `docker-compose.yml` (новий сервіс) окремим кроком, узгодженим із цією story перед мержем.
8. Given будь-яка помилка авторизації чи автентифікації на WS-рівні, Then клієнту повертається структурована подія помилки з локалізованим ключем — той самий принцип консистентного формату помилок (код, локалізований ключ), що вже діє для REST (розділ "API" CLAUDE.md), а не сире розірвання з'єднання без пояснення.
9. Given успішне WS-з'єднання й активна підписка, When REST-запит `POST .../messages` (DM чи компетенції) записує нове повідомлення, Then WS-подія розсилається підписникам протягом розумного часу (практично — миттєво в межах того самого процесу чи pub/sub, без polling з боку клієнта).

## API-поверхня
- Не REST-ресурс — новий WS-канал (шлях/порт на розсуд backend-developer, приєднаний до вже наявного `backend`-процесу порту 4000 або окремий сервіс). Типи повідомлень протоколу: `subscribe` (thread/room), `dm.message.created`, `competencyChat.message.created`, `error` (з локалізованим ключем) — точні назви/формат кадрів protocol-level деталь backend-developer.
- Автентифікація — Firebase ID token, той самий, що `Authorization: Bearer` для REST.

## Локалізація
- `ws.error.unauthorized` — en: "Your session has expired — please refresh the page.", uk: "Ваша сесія застаріла — оновіть сторінку."
- `ws.error.subscribeForbidden` — en: "You don't have access to this conversation.", uk: "У вас немає доступу до цієї розмови." (той самий текст, що `errors.dmThread.forbidden`, — свідомий reuse, а не новий ключ, коли зміст ідентичний)
- `ws.status.reconnecting` — en: "Reconnecting…", uk: "Повторне підключення…"

## Відповідність scope
Виходить за межі початкового CLAUDE.md — розділ "Архітектура" описував виключно REST, WebSocket ніде не згадувався. Свідоме, явно задокументоване (не мовчазне) розширення архітектури, підтверджене користувачем перед реалізацією через рішення №1. Ця story сама по собі не додає користувацької цінності без US-027/US-028, які від неї залежать, — технічна інфраструктурна story за аналогією з тим, як `Infra_MinIO`/`Infra_FirebaseAuth` документувались окремо від фіч, що на них спираються.
```

**US-030…US-033 — походження.** Запит користувача: "Чати - додай чати по існуючим компетенціям - на майбутнє створюй чати на кожну компетенцію. І людина у розділі повідомлень може шукати ці чати і додаватися." Перевірка проти вже реалізованого US-028 показала: групова кімната на кожну компетенцію (наявну й майбутню) вже автоматично існує за дизайном (кімната = сам `competency_id`, без окремої таблиці "кімнат", доступна на читання/запис будь-якому автентифікованому користувачу) — тобто перші дві частини запиту вже задоволені без нового коду (US-030 фіксує це явно для протоколу/QA). Третя частина ("шукати ці чати і додаватися" в розділі "Повідомлення") — реальна відсутня функціональність, розбита на US-031…033.

Перед розбиттям business-analyst уточнив (AskUserQuestion), що саме означає "додатися". Ухвалене рішення користувача: **справжнє "мої чати" з персистентним членством** — нова таблиця `competency_chat_members` (user_id, competency_id, joined_at), окрема дія "приєднатися"/"вийти"; розділ "Повідомлення" показує лише ТІ чати компетенцій, до яких користувач явно приєднався, не всі автоматично; окремий екран для пошуку по довіднику компетенцій і приєднання/виходу. Явно зафіксовано й підтверджено: доступ на читання/запис до самого чату компетенції залишається БЕЗ ЗМІН (US-028 не переглядається) — будь-хто автентифікований і далі може відкрити чат напряму (напр. "Open group chat" з профілю) і писати туди без приєднання; членство визначає ЛИШЕ що показується в персональному списку "Повідомлення", не авторизацію доступу до чату.

Додатково business-analyst ухвалив і задокументував такі рішення (без повторного уточнення в користувача, за аналогією з прецедентом US-025…029):
- **Без auto-join за наявними компетенціями профілю (`user_competencies`).** Приєднання до чату компетенції — завжди явна дія користувача через кнопку "Приєднатися", незалежно від того, чи ця компетенція вже є в його профілі. Обґрунтування: той самий продуктовий принцип "явна дія", що вже застосований до `willing_to_teach` — окремий явний прапорець на кожній компетенції користувача, не виведений автоматично з факту наявності компетенції в профілі.
- **Вихід із чату — hard delete рядка членства**, не soft-delete/архівація. Обґрунтування: членство — це поточний стан підписки на список "Повідомлення", а не історичний запис на кшталт `time_entries`/повідомлень чату, тому принцип "не каскадне видалення" (застосований до `user_competencies`/`board.category_id`/`competency_chat_messages`) тут не поширюється на сам факт членства — лише на повідомлення (US-028 AC5) і на членство, яке НЕ видаляється каскадно при деактивації самої компетенції (це інша дія: деактивація компетенції адміністративно, а не вихід користувача з чату).
- **Деактивація компетенції (`is_active=false`) не видаляє наявне членство** — той самий підхід "не каскадне видалення", що вже застосований до `user_competencies`/`board.category_id`/`competency_chat_messages` (AUTH-005 AC6/US-021 AC6/US-028 AC5). У списку "Повідомлення" такий рядок показується задизейбленим/архівним, з можливістю лише вийти (прибрати рядок), не відкрити чат.
- **Структура екранів — дві окремі точки входу, а не злиття в один UI-елемент:** (1) розширення наявного `/messages` новою секцією "Чати компетенцій" поруч із наявною секцією DM-тредів, за тим самим структурним патерном, що секції "Мої дошки"/"Public Boards" на Boards overview (US-024); (2) окремий роут `/chats/find` для пошуку по всьому довіднику компетенцій і приєднання/виходу — за аналогією з тим, як `/people` (US-025) є окремим екраном пошуку, відмінним від списку результатів на іншій сторінці.
- **Кнопка приєднання доступна прямо на екрані самого чату**, незалежно від того, як до нього потрапили (з `/chats/find`, зі списку "Повідомлення" чи напряму з "Open group chat" на профілі) — природне доповнення до наявного прямого переходу з профілю, щоб не змушувати користувача йти на окремий екран `/chats/find`, якщо він вже дивиться на потрібний чат.

Свідомо поза межами цього проходу: лічильник непрочитаних для чатів компетенцій (той самий виняток, що вже прийнятий для DM у US-025…029), push-нотифікації про нові приєднання чи повідомлення, автоматичне приєднання за компетенціями профілю (AC вище), пагінація довідника на екрані "Знайти чати" (список компетенцій лишається невеликим, той самий підхід MVP без пагінації, що вже застосований до `task_comments`/`GET /boards/public`).

CLAUDE.md (текстові зміни підготовлені, САМ ФАЙЛ НЕ РЕДАГУЄТЬСЯ цим проходом — за прямою вказівкою в запиті на цю серію stories; застосування узгоджується окремо):
- Розділ **"Екрани"**, пункт "Chat": доповнити наявний опис групового чату компетенції реченням: "Кожен користувач може явно приєднатися/вийти з чату компетенції (персистентне членство) — розділ 'Повідомлення' показує лише приєднані чати компетенцій поруч зі списком DM-тредів; сам доступ на читання/запис до чату компетенції від членства не залежить і лишається відкритим будь-якому автентифікованому користувачу (US-028). Окремий екран `/chats/find` — пошук по довіднику компетенцій і приєднання/виходу."
- Розділ **"Дані"**: нова таблиця `competency_chat_members` (id, user_id FK → users, competency_id FK → competencies, joined_at; unique (user_id, competency_id)) — персистентне членство користувача в груповому чаті компетенції; визначає лише що показується в персональному списку "Повідомлення" користувача, не є частиною авторизаційної перевірки доступу до самого чату (`competency_chat_messages` лишається доступним будь-якому автентифікованому користувачу незалежно від членства, US-028); деактивація компетенції (`is_active=false`) не видаляє рядки членства (не каскадне видалення), вихід користувача з чату — навпаки, hard delete власного рядка членства.

### US-030 — Груповий чат на кожну компетенцію: вже реалізовано (без нового коду)

```
## User Story
Як product owner і QA, я хочу мати явне підтвердження в бэклозі, що механізм "чат на кожну компетенцію, включно з майбутніми" вже покриває цю частину запиту користувача, щоб не виникло враження, ніби щось із запиту пропущено.

## Acceptance Criteria
1. Given будь-яка активна компетенція з довідника `competencies` (наявна на момент цього запиту чи додана пізніше), Then для неї автоматично існує рівно одна групова кімната обговорення, ідентифікована `competency_id` — реалізовано в US-028 AC1, без окремої таблиці "кімнат" і без потреби виконувати будь-яку ручну дію "створення чату" при додаванні нової компетенції.
2. Given нова компетенція додається до довідника `competencies` адміністративно (поза релізами коду, за визначенням розділу "Дані" CLAUDE.md), Then її груповий чат стає доступний одразу разом із додаванням запису — без деплою, міграції чи іншої дії розробника; це буквально задовольняє формулювання запиту "на майбутнє створюй чати на кожну компетенцію".
3. Given цю story, Then вона не додає жодного нового ендпоінта, таблиці чи UI-елемента — це запис у бэклог для протоколу/QA, який явно фіксує: перші дві частини вихідного запиту користувача ("додай чати по існуючим компетенціям", "на майбутнє створюй чати на кожну компетенцію") вже задоволені реалізацією US-028 і закриваються без окремої розробки.

## API-поверхня
Без змін — reuse наявних `GET/POST /api/v1/competencies/:id/chat/messages` (US-028).

## Локалізація
Без нових рядків — наявні ключі `chat.competency.*` з US-028 покривають цю функціональність повністю.

## Відповідність scope
В межах — story лише підтверджує вже наявний функціонал (US-028), не розширює й не звужує CLAUDE.md. Не потребує реалізації, тестування чи code review як окремої зміни коду.
```

### US-031 — Персистентне членство в чаті компетенції (Join/Leave)

```
## User Story
Як автентифікований користувач, я хочу явно приєднуватися до чатів компетенцій, які мене цікавлять, і виходити з них, щоб мій розділ "Повідомлення" показував лише ті групові чати, за якими я стежу.

## Acceptance Criteria
1. Given я автентифікований і НЕ є учасником групового чату активної (`is_active=true`) компетенції `competencyId`, When `POST /api/v1/competencies/:id/chat/members`, Then створюється рядок `competency_chat_members(user_id=я, competency_id, joined_at=now())`, 201; повторний виклик, коли я вже учасник, — ідемпотентний 200 без дублікату (unique constraint (user_id, competency_id)).
2. Given я вже учасник, When `DELETE /api/v1/competencies/:id/chat/members/me`, Then рядок членства видаляється назавжди (hard delete — членство є поточним станом підписки, а не історичним записом на кшталт `time_entries`/повідомлень чату, тому "не каскадне видалення" тут не застосовується до самої дії виходу), 204; повторний виклик, коли я вже не учасник, — ідемпотентний 204 без помилки.
3. Given `competencyId` не існує або `is_active=false`, When `POST .../chat/members`, Then 404 `errors.competencyChat.notFound` (той самий ключ, що US-028 AC5) — приєднатися до недоступного чату не можна; водночас `DELETE .../chat/members/me` для компетенції, до якої я приєднався РАНІШЕ (коли вона ще була активна) і яку відтоді деактивовано, лишається дозволеним — щоб я міг прибрати архівний рядок зі свого списку (AC7, US-033 AC5).
4. Given я приєднався чи вийшов із чату компетенції, Then ця дія НЕ впливає на права доступу до читання/запису повідомлень самого чату (US-028 AC2, AC7) — будь-хто автентифікований і далі може відкрити чат напряму й писати туди навіть без приєднання; членство визначає ЛИШЕ що показується в моєму персональному списку "Повідомлення" (US-033), не авторизацію доступу до чату.
5. Given `GET /api/v1/competency-chats/mine`, Then повертається список чатів компетенцій, до яких я приєднаний, з локалізованою назвою компетенції (`competency.<slug>`), прев'ю останнього повідомлення (якщо є) і часом останньої активності (час останнього повідомлення, або `joined_at`, якщо повідомлень у чаті ще не було) — відсортований за часом останньої активності, найновіші зверху (той самий патерн, що `GET /dm-threads` US-027 AC11).
6. Given мій профіль (`user_competencies`) містить компетенцію X, Then це САМЕ ПО СОБІ НЕ призводить до автоматичного членства в чаті X — жодного auto-join; приєднання завжди явна дія через кнопку "Приєднатися". Обґрунтування: той самий продуктовий принцип "явна дія", що вже застосований до `willing_to_teach` (окремий явний прапорець на кожній компетенції користувача, не виведений автоматично з факту наявності компетенції в профілі).
7. Given компетенція, до чату якої я приєднаний, деактивована (`is_active=false`) ПІСЛЯ мого приєднання, Then рядок `competency_chat_members` НЕ видаляється каскадно (той самий підхід "не каскадне видалення", що AUTH-005 AC6/US-021 AC6/US-028 AC5) — членство лишається в БД; відображення цього стану в розділі "Повідомлення" визначено в US-033 AC5.
8. Given екран самого чату компетенції відкрито БЕЗ переходу через "Знайти чати" (наприклад, прямий перехід за наявним посиланням "Open group chat" з профілю), Then у верхній частині екрана чату показується контрол приєднання: кнопка "Приєднатися" (`chat.competency.join`), якщо я ще не учасник, або "Вийти з чату" (`chat.competency.leave`), якщо вже учасник — той самий `POST`/`DELETE` ендпоінт, доступний з будь-якої точки входу в чат, не лише з екрана "Знайти чати" (US-032).
9. Given я щойно натиснув "Приєднатися" на екрані чату, Then контрол миттєво (optimistic UI, без перезавантаження сторінки) змінюється на "Вийти з чату", і цей чат після цього з'являється в `GET /competency-chats/mine` при наступному завантаженні розділу "Повідомлення" (US-033).
10. Given неавтентифікований відвідувач, When будь-яка дія `POST`/`DELETE .../chat/members...` чи `GET /competency-chats/mine`, Then 401.

## API-поверхня
- Нова таблиця `competency_chat_members` (id, user_id FK → users, competency_id FK → competencies, joined_at; unique (user_id, competency_id)).
- `POST /api/v1/competencies/:id/chat/members` — приєднатися (get-or-create, ідемпотентний).
- `DELETE /api/v1/competencies/:id/chat/members/me` — вийти (ідемпотентний).
- `GET /api/v1/competency-chats/mine` — список моїх приєднаних чатів, відсортований за часом останньої активності.

## Локалізація
- `chat.competency.join` — en: "Join chat", uk: "Приєднатися до чату"
- `chat.competency.leave` — en: "Leave chat", uk: "Вийти з чату"
- `chat.competency.joined` — en: "Joined", uk: "Учасник"

## Відповідність scope
Виходить за межі початкового CLAUDE.md — персистентного членства в груповому чаті не існувало взагалі (US-028 навмисно не мала такого поняття, доступ був виключно "будь-хто автентифікований", без списку "моїх" чатів). Свідоме розширення, узгоджене з рішенням користувача, уточненим через AskUserQuestion (справжнє членство з окремою таблицею, не похідне від `user_competencies`). Авторизаційна модель самого чату (US-028) свідомо НЕ переглядається (AC4) — нова таблиця впливає лише на персональний список, не на права доступу. Auto-join і soft-delete членства свідомо не вводяться (AC6, розділ "походження").
```

### US-032 — Екран "Знайти чати" (пошук і приєднання до чатів компетенцій)

```
## User Story
Як автентифікований користувач, я хочу знайти чат конкретної компетенції серед усього довідника і приєднатися до нього, щоб він з'явився в моєму розділі "Повідомлення".

## Acceptance Criteria
1. Given я на екрані `/chats/find` (доступний за посиланням "Знайти чати" з розділу "Повідомлення" — US-033 AC4), Then бачу повний список активних (`is_active=true`) компетенцій довідника (`GET /api/v1/competencies`, той самий ендпоінт і рендер-патерн, що AUTH-005/US-021/US-025), кожна — рядок з локалізованою назвою (`competency.<slug>`) і поточним станом членства ("Приєднано" з кнопкою "Вийти з чату" / кнопка "Приєднатися").
2. Given поле пошуку зверху екрана, When я ввожу текст, Then список фільтрується клієнтськи за підрядком у локалізованій назві компетенції поточної мови інтерфейсу — без запиту до BE (повний список компетенцій уже завантажений, той самий підхід MVP без пагінації для невеликих довідників, що task_comments US-019 AC8/GET boards/public US-024 AC10); фільтр нечутливий до регістру.
3. Given рядок компетенції, до якої я ще не приєднаний, When клікаю "Приєднатися", Then викликається `POST .../chat/members` (US-031 AC1), рядок миттєво (optimistic UI) переходить у стан "Приєднано" з кнопкою "Вийти з чату", без переходу на інший екран.
4. Given рядок компетенції, до якої я вже приєднаний, When клікаю "Вийти з чату", Then викликається `DELETE .../chat/members/me` (US-031 AC2), рядок переходить назад у стан "Приєднатися".
5. Given рядок компетенції, Then клік по НАЗВІ компетенції (не по кнопці приєднання) відкриває сам чат цієї компетенції (той самий екран, що й з "Open group chat" на профілі, US-028) — перегляд/написання повідомлень можливі незалежно від стану членства (US-031 AC4).
6. Given пошук не дав збігів, Then показується локалізований порожній стан "Нічого не знайдено за вашим пошуком".
7. Given жодної активної компетенції в довіднику взагалі (малоймовірний edge case), Then показується окремий локалізований порожній стан "Довідник компетенцій ще порожній".
8. Given неавтентифікований відвідувач, When намагається відкрити `/chats/find`, Then 401/редірект на `/auth`.

## API-поверхня
Reuse `GET /api/v1/competencies` (AUTH-005) і `GET /api/v1/competency-chats/mine` (US-031, для позначення стану "Приєднано" на кожному рядку); нових ендпоінтів не додає.

## Локалізація
- `chat.find.title` — en: "Find chats", uk: "Знайти чати"
- `chat.find.searchPlaceholder` — en: "Search competencies…", uk: "Пошук компетенцій…"
- `chat.find.emptySearch` — en: "No competencies match your search.", uk: "Немає компетенцій за вашим пошуком."
- `chat.find.emptyDirectory` — en: "No competencies available yet.", uk: "Поки що немає жодної компетенції."
- `chat.find.openChat` — en: "Open chat", uk: "Відкрити чат"

## Відповідність scope
В межах — прямо реалізує третю частину запиту користувача ("може шукати ці чати і додаватися"). Reuse наявних довідника й патернів (AUTH-005/US-021/US-025), новий шар авторизації не додає — доступ до самого чату не змінюється (US-031 AC4). Мультиселект/пагінація довідника свідомо не вводяться (розділ "походження").
```

### US-033 — Розділ "Повідомлення": секція приєднаних чатів компетенцій

```
## User Story
Як автентифікований користувач, я хочу бачити в розділі "Повідомлення" не лише свої особисті переписки, а й чати компетенцій, до яких я приєднався, щоб мати один центральний список усіх моїх розмов.

## Acceptance Criteria
1. Given я відкриваю `/messages`, Then сторінка показує ДВІ секції: "Особисті повідомлення" (наявний список DM-тредів, `GET /dm-threads`, US-027 AC11, без змін логіки) і "Чати компетенцій" (новий список, `GET /competency-chats/mine`, US-031 AC5) — за тим самим структурним патерном, що секції "Мої дошки"/"Public Boards" на Boards overview (US-024); наявний заголовок `chat.dm.listTitle` ("Messages"/"Повідомлення") лишається загальним заголовком сторінки, `chat.messages.dmSectionHeading` — новий підзаголовок секції DM.
2. Given секція "Чати компетенцій", Then кожен рядок показує локалізовану назву компетенції (`competency.<slug>`), прев'ю останнього повідомлення (якщо є, обрізане до одного рядка) і locale-aware час останньої активності — відсортовано за часом останньої активності, найновіші зверху (той самий патерн, що DM AC11 US-027).
3. Given я ще не приєднався до жодного чату компетенції, Then секція "Чати компетенцій" показує окремий локалізований порожній стан з CTA-посиланням на `/chats/find` (US-032) — незалежно від того, порожня секція "Особисті повідомлення" чи ні (той самий принцип незалежного рендеру секцій, що US-024 AC6).
4. Given секцію "Чати компетенцій" (порожню чи ні), Then над/поруч з нею є постійно видиме посилання/кнопка "Знайти чати", яке веде на `/chats/find` (US-032) — доступне завжди, не лише в порожньому стані.
5. Given я приєднаний до чату компетенції, яка після мого приєднання деактивована (`is_active=false`, US-031 AC7), Then рядок цього чату показується в секції "Чати компетенцій" у задизейбленому/архівному вигляді (приглушений стиль, без клікабельного переходу до самого чату) з локалізованою поміткою "Цей чат більше недоступний" (`chat.competency.unavailable`) — той самий стан, що дає `errors.competencyChat.notFound` (US-028 AC5) при спробі прямого доступу; єдина доступна дія на такому рядку — "Вийти з чату" (щоб прибрати архівний рядок зі списку, US-031 AC2/AC3).
6. Given я клікаю на активний (не архівний) рядок чату компетенції в секції "Чати компетенцій", Then відкривається екран цього чату (той самий, що з `/chats/find` чи з профілю).
7. Given нове повідомлення надходить у чат компетенції, до якого я приєднаний, When у мене НЕ відкритий саме цей чат, Then рядок цього чату в секції "Чати компетенцій" піднімається наверх за часом останньої активності при наступному відкритті розділу "Повідомлення" чи через WS-подію на рівні списку (той самий підхід, що DM AC10 US-027) — без лічильника непрочитаних (узгоджено з рішенням "без read receipts" з розділу "походження" US-025…029).
8. Given неавтентифікований відвідувач, When намагається відкрити `/messages`, Then 401/редірект на `/auth` — без змін (наявна поведінка US-027).

## API-поверхня
Reuse `GET /dm-threads` (US-027) і `GET /competency-chats/mine` (US-031); FE-only зміна структури сторінки, нових ендпоінтів понад US-031 не додає.

## Локалізація
- `chat.messages.dmSectionHeading` — en: "Direct messages", uk: "Особисті повідомлення"
- `chat.messages.competencySectionHeading` — en: "Competency chats", uk: "Чати компетенцій"
- `chat.messages.findChatsCta` — en: "Find chats", uk: "Знайти чати"
- `chat.messages.emptyCompetencyChats` — en: "You haven't joined any competency chats yet.", uk: "Ви ще не приєдналися до жодного чату компетенції."
- `chat.competency.unavailable` — en: "This chat is no longer available", uk: "Цей чат більше недоступний"

## Відповідність scope
В межах — пряме продовження запиту користувача (розділ "повідомлень" явно названо в запиті). Не суперечить "Поза межами цього етапу" CLAUDE.md; не вводить лічильник непрочитаних чи push-нотифікації про нові приєднання/повідомлення (узгоджено з наявними винятками US-025…029).
```

**US-034 — походження.** Запит користувача: "Реалізуй відповіді на коментарі (3 рівень вкладеності)" для `task_comments` (US-019, зараз пласкі: id, task_id, author_id, body, created_at, без edit/delete). Перед розбиттям business-analyst уточнив (AskUserQuestion) архітектурне рішення, ухвалене користувачем: **flattening на рівень 3 (Reddit-style)**. Якщо хтось відповідає на коментар 3-го (найглибшого) рівня, нова відповідь створюється як ЩЕ ОДИН рівень-3 коментар під тим самим рівень-2 батьком (сиблінг, не дитина), з текстовим позначенням "у відповідь X", щоб зберегти адресацію навіть без структурної глибини 4. Це вимагає двох різних полів: `parent_comment_id` (реальний DB-батько, визначає візуальне групування й глибину відступу, максимум 3 рівні) і `reply_to_comment_id` (текстова адресація "кому я відповідаю", може вказувати на коментар глибше за фактичний `parent_comment_id` саме у випадку флеттингу рівня 3). Повний алгоритм обчислення обох полів на BE — у US-034 AC1-3.

CLAUDE.md (текстові зміни підготовлені, файл не редагується цим проходом — за аналогією з прецедентом US-021…024/US-030…033):
- Розділ **"Дані"**: `task_comments` доповнити `parent_comment_id` (nullable FK → `task_comments.id`, ON DELETE CASCADE) і `reply_to_comment_id` (nullable FK → `task_comments.id`, ON DELETE SET NULL) — перше визначає реальне дерево й глибину (max 3), друге — лише текстову адресацію "у відповідь" для UI-цитати, яка може вказувати глибше за `parent_comment_id` у разі флеттингу.
- Розділ **"Екрани" п.4 "Task panel"**, підпункт "Коментарі": доповнити описом кнопки "Відповісти" на кожному коментарі (включно з рівнем 3, де вона флеттить, а не приховується), візуальних відступів до 3 рівнів і інлайн quote-прев'ю "У відповідь [ім'я]: [уривок]" над формою відповіді.

### US-034 — Відповіді на коментарі таски (3 рівні вкладеності, flatten)

```
## User Story
Як власник борду або collaborator, я хочу відповідати на конкретний коментар таски (включно з коментарями глибоких рівнів), щоб контекст обговорення був зрозумілим навіть коли гілка стає довгою; як viewer, я хочу бачити структуру відповідей, щоб розуміти, хто кому відповідає, без права додавати свої.

## Acceptance Criteria
1. Given коментар рівня 1 (top-level, `parent_comment_id IS NULL`), When я тисну "Відповісти" і сабмічу текст, Then `POST /api/v1/tasks/:id/comments {body, replyToCommentId=<id рівня 1>}` створює новий коментар з `parent_comment_id = <id рівня 1>` і `reply_to_comment_id = <той самий id>` — коментар рівня 2 (перший реальний відступ).
2. Given коментар рівня 2 (`parent_comment_id` вказує на коментар рівня 1), When відповідаю на нього, Then новий коментар отримує `parent_comment_id = <id рівня 2>` і `reply_to_comment_id = <той самий id>` — коментар рівня 3 (максимальний відступ).
3. Given коментар рівня 3 (найглибший — його `parent_comment_id` вказує на коментар, чий власний `parent_comment_id` НЕ NULL), When я тисну "Відповісти" на ньому і сабмічу, Then BE НЕ створює рівень 4: новий коментар флеттиться як сиблінг — його `parent_comment_id` встановлюється на `parent_comment_id` коментаря рівня 3 (той самий рівень-2 батько), а `reply_to_comment_id` встановлюється на id самого коментаря рівня 3, на який я натиснув "Відповісти" — зберігає точну текстову адресацію для цитати в UI, попри те що структурно це сиблінг, а не дитина.
4. Given новий коментар без вибраного "Відповісти" (звичайний топ-рівневий), When сабмічу, Then `parent_comment_id = NULL`, `reply_to_comment_id = NULL` — без змін порівняно з US-019.
5. Given кнопка "Відповісти" видима на кожному коментарі незалежно від рівня (1, 2 чи 3), Then клік на рівні 3 не приховує кнопку і не блокує дію — флеттинг з AC3 відбувається прозоро для користувача.
6. Given я тиснув "Відповісти" на коментарі X, When відкривається інлайн-форма відповіді, Then над полем вводу показується цитата "У відповідь {автор X}: «{перші ~80 символів тексту X}»" (`taskPanel.comments.replyPreview`) — обчислюється на FE з уже завантаженого повного списку коментарів (без пагінації, той самий підхід US-019 AC8 — жодного додаткового запиту до BE); кнопка "Скасувати" (`taskPanel.comments.cancelReply`) прибирає вибір і повертає форму в звичайний режим.
7. Given `replyToCommentId`, переданий у `POST`, не існує або належить ІНШІЙ тасці (не тій, що в URL), When сабміт, Then 400 `errors.comment.replyTargetInvalid`, коментар не створюється.
8. Given я viewer, Then кнопка "Відповісти" й форма недоступні (той самий read-only гейт, що US-019 AC3) — пряма спроба `POST` з `replyToCommentId` через API повертає 403 `errors.task.readOnlyAccess`, незалежно від глибини цільового коментаря.
9. Given `GET /api/v1/tasks/:id/comments`, Then кожен коментар додатково містить `parentCommentId` (nullable) і `replyToCommentId` (nullable) — FE обчислює візуальний рівень (1/2/3) і групування виключно з `parentCommentId` (ланцюжок до кореня), а `replyToCommentId` використовує лише для рендеру цитати "У відповідь"; список і надалі повертається пласким масивом у хронологічному порядку (без вкладеної деревної структури в JSON) — рендер дерева на клієнті.
10. Given коментарі рівня 2 й 3 під одним рівень-1 батьком, When рендериться UI, Then відступ відповідає рівню (1 — без відступу, 2 — один відступ, 3 — два відступи); усі флеттнуті рівень-3 сиблінги (AC3) показуються на одному відступі в хронологічному порядку створення, кожен зі своєю цитатою "У відповідь" там, де вона відрізняється від найближчого сусіда.
11. Given валідація тексту відповіді, Then діють ті самі правила, що для звичайного коментаря (US-019 AC4-5): 1–2000 символів після trim, `errors.comment.bodyRequired`/`errors.comment.bodyTooLong`.
12. Given таска видаляється (US-007/US-019 AC9), Then каскадне видалення `task_comments` за `task_id` видаляє коментарі всіх рівнів разом з їхніми `parent_comment_id`/`reply_to_comment_id` — без осиротілих посилань, бо видаляється весь набір рядків таски одночасно.
13. Given MVP-рішення "без редагування/видалення" (US-019 AC10), Then воно поширюється і на відповіді — жодного нового ендпоінта для редагування/видалення коментаря чи зміни його `parent_comment_id`/`reply_to_comment_id` після створення.

## API-поверхня
- Розширити `POST /api/v1/tasks/:id/comments` (US-019): опційне поле `replyToCommentId` у тілі запиту; BE обчислює `parentCommentId` за алгоритмом AC1-3 (flatten на рівні 3), зберігає обидва поля.
- Розширити `GET /api/v1/tasks/:id/comments`: кожен елемент додатково містить `parentCommentId`, `replyToCommentId` (обидва nullable).
- Схема: `task_comments` доповнюється `parent_comment_id` (nullable FK → `task_comments.id`, ON DELETE CASCADE) і `reply_to_comment_id` (nullable FK → `task_comments.id`, ON DELETE SET NULL).

## Локалізація
- `taskPanel.comments.reply` — en: "Reply", uk: "Відповісти"
- `taskPanel.comments.replyPreview` (параметризований `{name}`, `{excerpt}`) — en: "Replying to {name}: "{excerpt}"", uk: "У відповідь {name}: «{excerpt}»"
- `taskPanel.comments.cancelReply` — en: "Cancel", uk: "Скасувати"
- `errors.comment.replyTargetInvalid` — en: "The comment you're replying to could not be found.", uk: "Коментар, на який ви відповідаєте, не знайдено."

## Відповідність scope
В межах — пряме розширення вже реалізованої US-019 (коментарі вже виведено з "поза межами цього етапу" при реалізації US-019, повторного виведення не потребує). Архітектурне рішення (`parent_comment_id` + `reply_to_comment_id`, flatten на рівні 3) ухвалено користувачем через AskUserQuestion перед цим проходом. Авторизаційна модель не змінюється — reuse `can_view_task`/owner-collaborator гейту з US-019.
```

**US-035…036 — походження.** Запит користувача: "В чаті реалізуй відповідь і форвард (заборонити форвард з приватних повідомлень)" для месенджингу (US-025…033: `dm_messages` — абсолютно приватні, лише два учасники; `competency_chat_messages` — відкриті будь-кому автентифікованому, обидва зараз пласкі, без edit/delete/reply/forward). Перед розбиттям business-analyst уточнив (AskUserQuestion) архітектурне рішення, ухвалене користувачем:
1. **Reply — quote-style, НЕ тред.** На відміну від коментарів таски (US-034, явні "рівні вкладеності"), відповідь у чаті — легковажне цитування конкретного повідомлення за індустрійним стандартом (Telegram/Slack): нове опційне поле `reply_to_message_id`, що вказує на повідомлення в межах ТОГО САМОГО чату/треду, без побудови дерева.
2. **Forward дозволений у будь-який чат-призначення (DM чи компетенція), заборона стосується лише ДЖЕРЕЛА.** Не можна форвардити повідомлення, чиє джерело — `dm_messages` (DM-тред), незалежно від того, хто форвардить і куди. Форвард із `competency_chat_messages` дозволений у будь-який мій DM-тред АБО будь-який (не обов'язково приєднаний — US-031 AC4 вже встановив, що доступ до чату компетенції не залежить від membership) активний чат компетенції.

Додатково business-analyst ухвалив і задокументував такі рішення (без повторного уточнення в користувача, за аналогією з прецедентами US-021…024/US-030…033):
- **Атрибуція форварда розкриває лише назву чату компетенції-джерела** ("Переслано з чату {компетенція}"), ніколи не розкриває й не натякає на DM як джерело — оскільки форвард із DM заборонений за дизайном (рішення №2), ситуація "джерело — DM" структурно не може виникнути для успішно створеного форварду.
- **Правило заборони прив'язане до ПОТОЧНОЇ таблиці розташування повідомлення, не до його історичного походження.** Якщо повідомлення A (з `competency_chat_messages`) успішно переслано в DM-тред як нове повідомлення B (рядок `dm_messages`), спроба переслати B далі так само відхиляється 403 — B зараз є DM-повідомленням, незалежно від того, що воно колись походило з відкритого чату. Захищає приватність DM транзитивно, без "спадкових" винятків.
- **Sender пересланого повідомлення — я (форвардер), не оригінальний автор.** Тіло копіюється, атрибуція показує лише назву чату-джерела, оригінальний автор ніде не розкривається — мінімальний обсяг даних, без додаткової непрошеної деталізації.
- **Кнопка "Переслати" в UI відсутня (не задизейблена) на повідомленнях DM** — щоб не створювати враження можливої дії, яку сервер просто відхилить; заборона AC2/US-036 AC2 відображена і в UI, не лише на BE.
- **Модалка вибору призначення форварда** за замовчуванням показує комбінований список "Мої чати" (DM-треди + приєднані чати компетенцій, той самий список, що розділ "Повідомлення" US-033), з окремою можливістю знайти/обрати будь-який активний, не обов'язково приєднаний чат компетенції (reuse довідника `/chats/find`, US-032) — узгоджує буквальний текст первинного запиту ("той самий список, що розділ Повідомлення") з архітектурним рішенням №2 (мембершип не обмежує призначення для компетенції).

CLAUDE.md (текстові зміни підготовлені, файл не редагується цим проходом — за аналогією з прецедентом US-021…024/US-030…033):
- Розділ **"Дані"**: `dm_messages` доповнити `reply_to_message_id` (nullable FK → `dm_messages.id`, ON DELETE SET NULL, BE перевіряє той самий `thread_id`) і `forwarded_from_competency_id` (nullable FK → `competencies.id`, заповнюється лише коли повідомлення створене форвардом із чату компетенції; ніколи не заповнюється для форварду з DM, оскільки такий форвард заборонений за дизайном). `competency_chat_messages` доповнити тими самими двома полями за аналогією (`reply_to_message_id` — nullable FK → `competency_chat_messages.id` у межах тієї самої компетенції; `forwarded_from_competency_id` — nullable FK → `competencies.id`, для форварду з іншого чату компетенції).
- Розділ **"Екрани"**, пункт Chat/Messages: додати опис кнопок "Відповісти" (quote-style прев'ю над композером і над відправленим повідомленням) і "Переслати" (модалка вибору чату — мої DM-треди й будь-які активні чати компетенцій, не лише приєднані; кнопка відсутня на DM-повідомленнях) на кожному повідомленні; форвард дозволений лише якщо джерело — повідомлення чату компетенції, форвард із DM заборонений на рівні BE незалежно від UI.

### US-035 — Відповідь (quote-style) на повідомлення в чаті (DM + компетенція)

```
## User Story
Як учасник DM-треду або учасник чату компетенції, я хочу відповісти цитатою на конкретне повідомлення, щоб було зрозуміло, на яку саме репліку я реагую, коли розмова містить багато повідомлень поспіль.

## Acceptance Criteria
1. Given я учасник DM-треду, When надсилаю повідомлення з опційним `replyToMessageId=<id повідомлення того самого треду>`, Then `POST /api/v1/dm-threads/:id/messages {body, replyToMessageId}` створює `dm_messages` рядок з `reply_to_message_id = <id>` (звичайний insert, без зміни структури — це посилання-цитата, НЕ дерево, на відміну від US-034), 201.
2. Given я автентифікований учасник чату компетенції, When аналогічно надсилаю з `replyToMessageId`, Then `POST /api/v1/competencies/:id/chat/messages {body, replyToMessageId}` створює `competency_chat_messages` рядок з `reply_to_message_id`.
3. Given `replyToMessageId` вказує на повідомлення з ІНШОГО треду/чату, ніж той, куди я зараз пишу, When сабміт, Then 400 `errors.chat.replyTargetInvalid` — відповідати можна лише в межах того самого чату/треду, де знаходиться оригінал.
4. Given `replyToMessageId` не існує, When сабміт, Then 400 `errors.chat.replyTargetInvalid` (той самий ключ).
5. Given повідомлення успішно створене з `reply_to_message_id`, When BE розсилає WS-подію (`dm.message.created`/`competencyChat.message.created`, US-027 AC6/US-028 AC3), Then тіло події включає вкладений обʼєкт `replyTo: {id, authorName, excerpt}` (перші ~80 символів оригінального тексту) — щоб FE відрендерив quote-блок миттєво без додаткового round-trip за оригіналом.
6. Given `GET .../messages` (історія, US-027 AC4/US-028 AC2), Then кожне повідомлення з відповіддю так само містить `replyTo: {id, authorName, excerpt}` — консистентно з WS-подією, доступно і при завантаженні історії, не лише "наживо".
7. Given я натискаю "Відповісти" на повідомленні в UI, When відкривається інлайн quote-прев'ю над композером (автор + уривок оригіналу, `chat.message.replyPreview`), Then кнопка "Скасувати" (`chat.message.cancelReply`) прибирає вибір без відправки.
8. Given відправлене повідомлення з відповіддю відображається в списку, Then quote-блок над текстом клікабельний: клік скролить і підсвічує оригінал, ЯКЩО він у поточно завантаженій/видимій історії; якщо оригінал поза завантаженим вікном (малоймовірно за відсутності пагінації US-027 AC4/US-028 AC2, але можливо в майбутньому), клік не робить нічого — edge case задокументовано, без додаткового round-trip у MVP.
9. Given оригінальне повідомлення, на яке я відповідаю, належить мені самому, Then відповідь на власне повідомлення дозволена (немає обмеження "не можна відповісти собі").
10. Given немає функціоналу редагування/видалення повідомлень у проєкті (US-027/US-028), Then quote завжди показує оригінальний текст на момент його створення — питання "що якщо оригінал видалено" не виникає в цьому проході.
11. Given порожній/задовгий текст самої відповіді, Then діють ті самі ліміти й помилки, що вже для звичайного повідомлення (`errors.dmThread.messageBodyRequired`/`.messageBodyTooLong`, `errors.competencyChat.messageBodyRequired`/`.messageBodyTooLong`) — `replyToMessageId` не впливає на ці правила.
12. Given я НЕ учасник DM-треду чи неавтентифікований відвідувач чату компетенції, Then звичайні гейти доступу (US-027 AC5, US-028 AC7) застосовуються ідентично, незалежно від наявності `replyToMessageId`.

## API-поверхня
- Розширити `POST /api/v1/dm-threads/:id/messages` і `POST /api/v1/competencies/:id/chat/messages`: опційне поле `replyToMessageId`.
- Розширити відповіді `GET .../messages` і WS-події `dm.message.created`/`competencyChat.message.created`: поле `replyTo` (nullable `{id, authorName, excerpt}`).
- Схема: `dm_messages` і `competency_chat_messages` доповнюються `reply_to_message_id` (nullable FK на ту саму таблицю, ON DELETE SET NULL, з BE-перевіркою "той самий thread_id/competency_id").

## Локалізація
- `chat.message.reply` — en: "Reply", uk: "Відповісти"
- `chat.message.replyPreview` (параметризований `{name}`, `{excerpt}`) — en: "Replying to {name}: "{excerpt}"", uk: "У відповідь {name}: «{excerpt}»"
- `chat.message.cancelReply` — en: "Cancel", uk: "Скасувати"
- `errors.chat.replyTargetInvalid` — en: "The message you're replying to could not be found in this conversation.", uk: "Повідомлення, на яке ви відповідаєте, не знайдено в цій розмові."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — reply не існував. Свідоме розширення US-027/US-028, узгоджене з рішенням користувача (quote-style, не тред, за індустрійним стандартом). Не змінює приватність DM чи авторизаційну модель компетенції (US-028).
```

### US-036 — Форвард повідомлень (лише з чату компетенції, заборонено з DM)

```
## User Story
Як автентифікований користувач, я хочу переслати повідомлення з чату компетенції в інший свій чат (DM або чат іншої компетенції), щоб поділитися корисною інформацією без ручного копіювання тексту; форвард із приватної переписки заборонений, щоб не порушувати приватність DM.

## Acceptance Criteria
1. Given повідомлення `sourceMessageId`, що є рядком `competency_chat_messages` (незалежно від того, чи я сам автор), When я тисну "Переслати" і обираю призначення, Then `POST /api/v1/chat/forwards {sourceMessageId, destinationType: "dmThread" | "competencyChat", destinationId}` створює НОВЕ повідомлення в таблиці призначення (`dm_messages` чи `competency_chat_messages`) з `sender_id = я`, `body = <тіло оригіналу>`, `forwarded_from_competency_id = <competency_id оригіналу>`, 201.
2. Given `sourceMessageId` є рядком `dm_messages` (джерело — приватна переписка), When `POST /chat/forwards`, Then 403 `errors.chat.forwardFromDmForbidden` — без винятків, навіть якщо викликач сам є учасником того DM-треду; перевірка на BE відбувається завжди, незалежно від UI (пряма спроба з довільним `sourceMessageId` через API так само відхиляється).
3. Given `sourceMessageId` не існує в жодній з двох таблиць повідомлень, When `POST /chat/forwards`, Then 404 `errors.chat.messageNotFound`.
4. Given `destinationType = "dmThread"`, Then призначення авторизується так само, як звичайний `POST /dm-threads/:id/messages` (US-027 AC5) — я маю бути одним з двох учасників `destinationId`-треду, інакше 403 `errors.dmThread.forbidden`.
5. Given `destinationType = "competencyChat"`, Then призначення авторизується так само, як звичайний `POST /competencies/:id/chat/messages` (US-028 AC2/AC7) — компетенція має існувати й бути активною (`is_active=true`), МЕМБЕРШИП НЕ ПЕРЕВІРЯЄТЬСЯ (той самий висновок, що US-031 AC4: доступ до чату компетенції не залежить від приєднання) — можна переслати в будь-який активний чат компетенції, не лише в приєднані; інакше 404 `errors.competencyChat.notFound`.
6. Given нове переслане повідомлення відображається в UI призначення, Then над текстом показується атрибуція "Переслано з чату {компетенція}" (`chat.forward.attribution`, локалізована назва `competency.<slug>` оригінальної компетенції) — і ніколи не показує й не натякає на DM як джерело, оскільки форвард із DM structurally неможливий (AC2).
7. Given переслане повідомлення саме потрапило в DM-тред (стало рядком `dm_messages` із заповненим `forwarded_from_competency_id`), When хтось намагається переслати ЦЕ повідомлення далі (`sourceMessageId` = це нове повідомлення), Then так само 403 `errors.chat.forwardFromDmForbidden` — правило залежить від таблиці ПОТОЧНОГО розташування повідомлення (`dm_messages`), а не від його історичного походження; захищає приватність DM транзитивно, без винятків "походило з публічного джерела".
8. Given модалка вибору призначення, Then за замовчуванням показує комбінований список "Мої чати" — DM-треди (`GET /dm-threads`) і приєднані чати компетенцій (`GET /competency-chats/mine`, US-031 AC5), той самий список, що розділ "Повідомлення" (US-033); окремо доступний пошук/перегляд усіх активних компетенцій (reuse `GET /api/v1/competencies`, той самий довідник, що `/chats/find` US-032) для вибору чату компетенції, до якого я НЕ приєднаний, — узгоджено з AC5 (мембершип не потрібен для призначення).
9. Given я обрав призначення й підтвердив, Then модалка закривається, показується короткий локалізований тост успіху (`chat.forward.success`), нове повідомлення одразу видно у відповідному чаті (якщо він зараз відкритий) чи піднімає його наверх у списку "Повідомлення" (той самий підхід, що US-027 AC10/US-033 AC7).
10. Given я не автентифікований, When будь-яка дія `POST /chat/forwards`, Then 401.
11. Given довжина тіла оригінального повідомлення вже валідна (1–2000 символів — пройшла валідацію при своєму створенні), Then форвард копіює тіло без повторної валідації довжини/непорожності.
12. Given кнопка "Переслати" видима на КОЖНОМУ повідомленні чату компетенції для будь-якого автентифікованого користувача (не лише автора), Then на повідомленнях DM-треду кнопки "Переслати" в UI НЕМАЄ ВЗАГАЛІ (не задизейблена — відсутня), щоб не створювати враження, що дія можлива і просто відхиляється сервером.

## API-поверхня
- Новий ендпоінт `POST /api/v1/chat/forwards` — body `{sourceMessageId, destinationType: "dmThread" | "competencyChat", destinationId}`. BE: (1) шукає `sourceMessageId` виключно в `competency_chat_messages`; не знайдено там → перевіряє `dm_messages` для видачі точної помилки (403 forbidden) чи 404 (не знайдено ніде); (2) авторизує призначення reuse `requireDmThreadAccess`/`requireActiveCompetencyRoom` (той самий сервісний шар, що звичайний POST повідомлення); (3) створює новий рядок у таблиці призначення.
- Схема: `dm_messages` і `competency_chat_messages` доповнюються `forwarded_from_competency_id` (nullable FK → `competencies.id`).
- Reuse `GET /dm-threads`, `GET /competency-chats/mine`, `GET /api/v1/competencies` для наповнення модалки вибору призначення — нових read-ендпоінтів не додає.

## Локалізація
- `chat.message.forward` — en: "Forward", uk: "Переслати"
- `chat.forward.modalTitle` — en: "Forward message", uk: "Переслати повідомлення"
- `chat.forward.searchOtherChats` — en: "Find another competency chat…", uk: "Знайти інший чат компетенції…"
- `chat.forward.confirm` / `.forwarding` — en: "Forward" / "Forwarding…", uk: "Переслати" / "Пересилання…"
- `chat.forward.success` — en: "Message forwarded.", uk: "Повідомлення переслано."
- `chat.forward.attribution` (параметризований `{competency}`) — en: "Forwarded from {competency} chat", uk: "Переслано з чату {competency}"
- `errors.chat.forwardFromDmForbidden` — en: "Messages from direct conversations can't be forwarded.", uk: "Повідомлення з особистих переписок не можна пересилати."
- `errors.chat.messageNotFound` — en: "This message is no longer available.", uk: "Це повідомлення більше недоступне."

## Відповідність scope
Виходить за межі початкового CLAUDE.md — форварду не існувало. Свідоме розширення US-027/US-028, узгоджене з рішенням користувача (форвард дозволений у будь-який чат-призначення, заборона стосується лише джерела-DM; призначення-компетенція не вимагає мембершипу, за прецедентом US-031 AC4). Приватність DM залишається абсолютною і посилюється транзитивно (AC7) — жодного ослаблення гарантій розділу "Шеринг"/US-027.
```

**US-037…US-038 — походження.** Запит користувача: імпорт дошки з файлу (книжка → board + tasks). Окремий Claude Skill поза цим репозиторієм генерує JSON-файл з книжки/матеріалу — один борд + список тасок, кожна опційно з `planned_minutes` і одним note-вкладенням (повний текст розділу). Потрібна функція застосунку, яка приймає такий файл і створює всю структуру одним запитом. Схема вхідного файлу — контракт між Skill і застосунком, зафіксований тут:

**Рішення користувача 2026-08-27 (правка AC9):** перевищення 20000 символів у `tasks[i].attachment.body` більше НЕ критична помилка. Замість 400 `errors.boardImport.attachmentBodyTooLong` тіло обрізається (trim + slice до 20000) і додається НЕ-критичний warning `board.import.warning.attachmentBodyTruncated`. Ключ `errors.boardImport.attachmentBodyTooLong` вилучено. Константа 20000 лишається окремою від ручного `NOTE_BODY_MAX_LENGTH=2000`.

```
{ "board": { "title": "string", "description": "string?", "category": "competency-slug?", "languages": ["uk"] },
  "tasks": [ { "title": "string", "planned_minutes": number?, "notes": "string?",
              "attachment": { "kind": "note", "title": "string?", "body": "string" } } ] }
```

Архітектурні рішення, ухвалені business-analyst без повторного уточнення в користувача (за прецедентом US-021…024 / US-030…033):

1. **Окремий ендпоінт `POST /api/v1/boards/import`**, не розширення `POST /boards` — інша форма тіла (вкладені board+tasks+attachments), інша відповідь (борд + лічильники + warnings), транзакційне створення кількох сутностей. Top-level ресурс-дія, той самий патерн, що `POST /api/v1/chat/forwards` (US-036).
2. **Тіло — `application/json`** (розпарсований вміст файлу), НЕ multipart. FE читає файл (`FileReader` + `JSON.parse`) і надсилає JSON. Причина: payload уже є JSON; multipart/multer тут — зайвий шар без вигоди. Ліміт розміру тіла для цього роуту — 1 МБ (200 тасок × ~4 КБ тексту ≈ 800 КБ у найгіршому випадку).
3. **Невідомий/неактивний `category` чи `languages` slug — не критична помилка:** ігнорується, борд створюється без нього, у відповідь додається `warning`. Той самий принцип "перевіряється лише те, що активно призначається зараз" (US-021 AC6).
4. **Ліміт кількості тасок — 200 за один імпорт** (перевищення — критична помилка; порційний/чанкований імпорт поза scope цього проходу).
5. **Довжина тіла note-вкладення при імпорті — до 20000 символів**, окремо від ручного ліміту `NOTE_BODY_MAX_LENGTH`=2000 (`attachments.service.js`), який лишається без змін. Причина: вкладення при імпорті — "повний текст розділу" книжки, структурно довший за нотатку, набрану вручну в task panel. **Правка 2026-08-27 (рішення користувача):** перевищення 20000 — НЕ критична помилка; тіло обрізається (trim + slice) і додається НЕ-критичний warning `board.import.warning.attachmentBodyTruncated`.
6. **Серверні поля не читаються з файлу:** `visibility` нового борду завжди `private` незалежно від вмісту файлу; `owner_id`/`created_by` — поточний користувач; статус усіх тасок — `planned`; `position` — за порядком у файлі, крок 1000 (наявна gap-схема `tasks.service.js`); `accent` — за замовчуванням.
7. **Валідація повністю авторитетна на BE.** FE робить лише легку перевірку до відправки (файл парситься; є непорожній `board.title`; `tasks` — непорожній масив) для миттєвого фідбеку, з тими самими локалізованими ключами.
8. **`planned_minutes` — межі US-020** (ціле 0–9999; 0 = "не задано"). Некоректне значення — `warning` + таска створюється без оцінки, не критична помилка (опційна метадані).
9. **Без міграції БД** — реюз `boards` / `tasks` / `attachments` як є, без нових колонок чи таблиць.

CLAUDE.md (текстові зміни підготовлені, файл не редагується цим проходом — за аналогією з прецедентом US-021…024 / US-030…033):
- Розділ **"API"**: додати `POST /boards/import` до переліку ендпоінтів як top-level ресурс-дію (поряд з `/tasks/:id/shares`, `chat/forwards`).
- Розділ **"Екрани" п.2 "Boards overview"**: у секції "Мої дошки" поряд зі "Створити борд" — дія "Імпортувати з файлу" (будь-який автентифікований користувач створює власний борд); коротко описати флоу (вибір `.json` → прев'ю назви й кількості тасок → створення однією транзакцією → перехід на новий борд, warnings показуються після успіху).
- Розділ **"Поведінка"**: додати, що імпорт створює борд + усі таски (`planned`) + усі note-вкладення (`visibility=private`) в одній транзакції — часткового імпорту не буває; контракт вхідного файлу — у записі US-037…US-038 в `USER_STORIES.md`.
- Розділ **"Дані"**: без змін (явно зазначити — фіча не додає таблиць чи колонок).

### US-037 — Імпорт дошки з файлу: транзакційне створення на бекенді

```
## User Story
Як власник борду (будь-який автентифікований користувач), я хочу надіслати згенерований JSON-файл із книжки й отримати готовий борд з усіма тасками та їхніми нотатками одним запитом, щоб не створювати десятки карток вручну.

## Acceptance Criteria
1. Given автентифікований запит `POST /api/v1/boards/import` з тілом = розпарсований вміст файлу за схемою (`{board, tasks}`), When усі обов'язкові поля валідні, Then BE в ОДНІЙ транзакції створює: рядок `boards` (`owner_id`=я, `visibility='private'`, `accent` за замовчуванням, `category_id`/`board_languages` — з резолвлених slug-ів), по рядку `tasks` на кожен елемент `tasks[]` (`status='planned'`, `position`=(індекс+1)*1000 у порядку файлу, `created_by`=я), і по рядку `attachments` (`kind='note'`, `visibility='private'`, `created_by`=я) на кожну таску з непорожнім `attachment.body`; 201.
2. Given успіх, Then тіло відповіді = `{ board: <той самий shape, що POST /api/v1/boards>, createdTaskCount, createdAttachmentCount, warnings: [] }`.
3. Given будь-яка критична помилка валідації (AC5–AC14), When обробка запиту, Then НІ борд, НІ таски, НІ вкладення не створюються — уся валідація виконується ДО відкриття транзакції (той самий патерн, що `resolveCategoryId`/`resolveLanguages` у `createBoard`); відповідь 4xx з локалізованим `messageKey`, транзакція не стартує.
4. Given `visibility` / `status` / `owner_id` / `created_by` присутні у файлі, Then вони ІГНОРУЮТЬСЯ й визначаються сервером: борд завжди `private`, усі таски завжди `planned`, власник — завжди викликач.
5. Given тіло не є об'єктом зі структурою `{board: object, tasks: array}`, Then 400 `errors.boardImport.invalidStructure`; для повністю нечитабельного JSON, якщо він доходить до сервісного шару, — 400 `errors.boardImport.invalidJson`.
6. Given `board.title` відсутній, порожній або не рядок (після trim), Then 400 `errors.boardImport.boardTitleRequired`. Given `board.title` > 100 символів, Then 400 `errors.boardImport.boardTitleTooLong`. Given `board.description` > 2000 символів, Then 400 `errors.board.descriptionTooLong` (реюз наявного ключа); порожній/відсутній опис → `null`.
7. Given `tasks` — не масив або порожній масив, Then 400 `errors.boardImport.tasksRequired`. Given `tasks` містить понад 200 елементів, Then 400 `errors.boardImport.tooManyTasks` (`{max: 200}`).
8. Given елемент `tasks[i]` без валідного `title` (порожній/не рядок після trim), Then 400 `errors.boardImport.taskTitleRequired` (`{index: i+1}`, 1-based). Given `tasks[i].title` > 200 символів, Then 400 `errors.boardImport.taskTitleTooLong` (`{index: i+1}`). Given `tasks[i].notes` > 2000 символів, Then 400 `errors.boardImport.taskNotesTooLong` (`{index: i+1}`); порожній/відсутній `notes` → `null`.
9. Given `tasks[i].attachment.body` присутній і після trim > 20000 символів, Then тіло обрізається до 20000 (trim + slice), вкладення все одно створюється, і додається НЕ-критичний warning `board.import.warning.attachmentBodyTruncated` (`{taskTitle, max: 20000}`). 20000 — окрема константа, вища за ручний `NOTE_BODY_MAX_LENGTH`=2000 (`attachments.service.js` не чіпається), бо імпортоване вкладення — повний текст розділу. (Правка 2026-08-27, рішення користувача: раніше — критична помилка `errors.boardImport.attachmentBodyTooLong`, ключ вилучено.)
10. Given `tasks[i].attachment` присутній, але `body` порожній/відсутній після trim, Then вкладення НЕ створюється, додається warning `board.import.warning.attachmentSkipped` (`{taskTitle}`), решта імпорту не блокується. Given `attachment.kind` ≠ `"note"`, Then поле `kind` ігнорується (за схемою завжди `note`), вкладення трактується як нотатка. Given `attachment` відсутній, Then у таски просто немає вкладення.
11. Given `board.category` — slug, якого немає в `competencies`, АБО він `is_active=false`, Then категорія НЕ призначається, борд створюється без `category_id`, додається warning `board.import.warning.unknownCategory` / `board.import.warning.inactiveCategory` (`{slug}`) — не критична помилка. Given `board.category` відсутній/null/порожній, Then борд без категорії, без warning.
12. Given `board.languages` містить slug, якого немає в `languages`, АБО неактивний, Then цей slug пропускається (решта валідних мов зберігається в `board_languages`), warning `board.import.warning.unknownLanguage` / `board.import.warning.inactiveLanguage` (`{slug}`) на кожен пропущений — не критична помилка. Given `board.languages` відсутній/порожній/не масив, Then борд без мов, без warning.
13. Given `tasks[i].planned_minutes` присутній, але не ціле в діапазоні 0–9999 (реюз меж US-020), Then таска створюється з `planned_minutes = NULL`, додається warning `board.import.warning.plannedMinutesDropped` (`{taskTitle}`) — не критична помилка. Given `planned_minutes` відсутній/null/0, Then `planned_minutes = NULL` без warning (0 = "оцінка не задана", той самий підхід, що US-020 AC3).
14. Given `tasks[i].attachment.title` присутній і > 200 символів, Then обрізається до 200 (trim + slice), без warning; відсутній `attachment.title` → вкладення без заголовка (note-чіп рендериться з тіла, US-009).
15. Given розмір тіла запиту перевищує 1 МБ, Then 413 або 400 `errors.boardImport.fileTooLarge` (ліміт задається на JSON-парсері саме цього роуту, не глобально).
16. Given неавтентифікований запит, Then 401 (той самий `requireAuth`, що всі `/api/v1/boards/*`); авторизаційних перевірок ролей немає — створюється власний борд викликача, як і `POST /boards`.
17. Given warnings зібрані під час імпорту, Then вони НЕ блокують створення — відповідь завжди 201; `warnings` — масив об'єктів `{ code: <locale-ключ>, params: <об'єкт> }`, які FE рендерить через власний словник (той самий принцип, що локалізовані `messageKey` помилок — BE не віддає готовий текст).
18. Given `openapi.yaml`, Then новий шлях `POST /api/v1/boards/import` задокументовано разом з реалізацією: схема вхідного тіла, відповідь із `warnings`, усі критичні `messageKey`.

## API-поверхня
- Новий ендпоінт `POST /api/v1/boards/import` (top-level ресурс-дія, за прецедентом `POST /api/v1/chat/forwards`, US-036). Тіло — `application/json` за схемою вхідного файлу. Відповідь 201 `{board, createdTaskCount, createdAttachmentCount, warnings[]}`.
- Реюз довідників `competencies` (lookup за `slug`) і `languages` (lookup за `slug`) для резолву slug→id — нових read-ендпоінтів не потрібно.
- Реюз наявних таблиць `boards` / `tasks` / `attachments` без змін схеми — **міграція БД не потрібна**.
- Реюз `boardsService.toBoardSummary` для об'єкта `board` у відповіді; `visibility: 'private'` на вкладеннях — той самий інваріант, що `insertAttachment` (spread після patch).

## Локалізація
Критичні помилки (BE `messageKey`, потрібні в `locales/en.json` + `locales/uk.json`):
- `errors.boardImport.invalidJson` — en: "This file isn't valid JSON.", uk: "Цей файл не є коректним JSON."
- `errors.boardImport.invalidStructure` — en: "This file doesn't match the expected board format.", uk: "Структура файлу не відповідає очікуваному формату дошки."
- `errors.boardImport.boardTitleRequired` — en: "The board in this file needs a title.", uk: "Дошка у файлі має містити назву."
- `errors.boardImport.boardTitleTooLong` — en: "The board title must be 100 characters or fewer.", uk: "Назва дошки має містити не більше 100 символів."
- `errors.boardImport.tasksRequired` — en: "This file needs at least one task.", uk: "Файл має містити принаймні одну таску."
- `errors.boardImport.tooManyTasks` (параметризований `{max}`) — en: "A single import can include at most {max} tasks.", uk: "За один імпорт можна створити не більше {max} тасок."
- `errors.boardImport.taskTitleRequired` (параметризований `{index}`) — en: "Task #{index} in this file is missing a title.", uk: "Таска №{index} у файлі не має назви."
- `errors.boardImport.taskTitleTooLong` (параметризований `{index}`) — en: "Task #{index}: title must be 200 characters or fewer.", uk: "Таска №{index}: назва має містити не більше 200 символів."
- `errors.boardImport.taskNotesTooLong` (параметризований `{index}`) — en: "Task #{index}: description must be 2000 characters or fewer.", uk: "Таска №{index}: опис має містити не більше 2000 символів."
- `errors.boardImport.fileTooLarge` — en: "This file is too large to import.", uk: "Файл завеликий для імпорту."
- Реюз наявного: `errors.board.descriptionTooLong`.

Warnings (не помилки — теж потрібні в обох словниках):
- `board.import.warning.unknownCategory` (параметризований `{slug}`) — en: "Category \"{slug}\" wasn't recognized and was skipped.", uk: "Категорію «{slug}» не розпізнано — пропущено."
- `board.import.warning.inactiveCategory` (параметризований `{slug}`) — en: "Category \"{slug}\" is no longer available and was skipped.", uk: "Категорія «{slug}» більше недоступна — пропущено."
- `board.import.warning.unknownLanguage` (параметризований `{slug}`) — en: "Language \"{slug}\" wasn't recognized and was skipped.", uk: "Мову «{slug}» не розпізнано — пропущено."
- `board.import.warning.inactiveLanguage` (параметризований `{slug}`) — en: "Language \"{slug}\" is no longer available and was skipped.", uk: "Мова «{slug}» більше недоступна — пропущено."
- `board.import.warning.plannedMinutesDropped` (параметризований `{taskTitle}`) — en: "The time estimate for \"{taskTitle}\" was invalid and was left empty.", uk: "Оцінку часу для «{taskTitle}» вказано некоректно — залишено порожньою."
- `board.import.warning.attachmentSkipped` (параметризований `{taskTitle}`) — en: "The note attachment for \"{taskTitle}\" was empty and was skipped.", uk: "Порожнє вкладення-нотатку для «{taskTitle}» пропущено."
- `board.import.warning.attachmentBodyTruncated` (параметризований `{taskTitle, max}`) — en: "The note attachment for \"{taskTitle}\" was longer than {max} characters and was trimmed.", uk: "Вкладення-нотатку для «{taskTitle}» скорочено до {max} символів."

## Відповідність scope
В межах — імпорт це bulk-створення поверх уже наявних примітивів (`boards` / `tasks` / note-`attachments`), усі описані в CLAUDE.md ("Дані" / "Екрани" / "Поведінка"). Розділ "Поза межами цього етапу" (публічні посилання для незареєстрованих, нотифікації та email-запрошення, синхронізація з календарем, графіки складніші за прості тотали, CI/CD, chat-розширення) імпорту не стосується. Фіча НЕ додає моделі даних, авторизаційного правила чи зовнішньої інтеграції — Claude Skill, що генерує файл, поза цим репозиторієм, застосунок лише приймає зафіксований JSON-контракт. Додає новий ендпоінт і точку входу, не описані в CLAUDE.md раніше → підготовлені текстові зміни (розділи "API", "Екрани" п.2, "Поведінка") — у записі US-037…US-038 вище; свідоме, задокументоване розширення, узгоджене з "API-first" і наявним CRUD. Відкритий пункт щодо ліміту тіла note-вкладення 20000 символів (AC9) закрито рішенням користувача 2026-08-27: 20000 лишається, але перевищення веде до тихого обрізання з warning, а не критичної помилки.
```

### US-038 — Імпорт дошки з файлу: точка входу і клієнтський флоу

```
## User Story
Як власник борду, я хочу натиснути "Імпортувати з файлу" на сторінці своїх дошок, обрати згенерований JSON і побачити новий борд, щоб швидко перенести структуру з книжки без ручного введення.

## Acceptance Criteria
1. Given я на Boards overview у секції "Мої дошки", Then поряд з кнопкою "Створити борд" бачу кнопку "Імпортувати з файлу" (`board.import.cta`); у секції "Public Boards" цієї кнопки немає.
2. Given я тисну "Імпортувати з файлу", Then відкривається нативний вибір файлу з `accept="application/json,.json"`.
3. Given я обрав файл, When FE читає його (`FileReader`) і `JSON.parse` кидає помилку, Then показується інлайн-помилка `errors.boardImport.invalidJson`, запит на BE не надсилається.
4. Given файл розпарсився, When легка структурна перевірка на FE не проходить — немає непорожнього рядка `board.title` → `errors.boardImport.boardTitleRequired`; `tasks` не масив або порожній → `errors.boardImport.tasksRequired` — Then показується відповідна інлайн-помилка, запит не надсилається. Будь-яка інша валідація (slug-и, довжини полів, ліміт 200 тасок) — тільки на BE, FE на них не блокує й не дублює логіку.
5. Given структурна перевірка пройшла, Then показується прев'ю-крок: назва борду з файлу (`board.import.previewSummary` з `{title}`) + кількість тасок (`board.card.taskCount`, ICU-плюрал), кнопки "Імпортувати" (`board.import.confirm`) і "Скасувати" (`board.import.cancel`).
6. Given я підтвердив, When FE надсилає `POST /api/v1/boards/import` з розпарсованим JSON як тілом, Then кнопка показує стан завантаження (`board.import.importing`) і задизейблена до відповіді.
7. Given відповідь 201, Then FE переходить на `/boards/$boardId` нового борду; якщо `warnings` непорожній — показується дисмісабельний блок `board.import.warningsHeading` зі списком, де кожен рядок — `t(warning.code, warning.params)`, з кнопкою "Сховати" (`board.import.dismissWarnings`).
8. Given відповідь 201 з порожнім `warnings`, Then перехід на новий борд без блоку зауважень; опційно короткий тост `board.import.success` з `{title}`.
9. Given відповідь 4xx, Then показується інлайн-помилка з `error.messageKey` через словник FE, борд не створюється, я лишаюся на Boards overview і можу обрати інший файл.
10. Given імпорт успішний, Then сітка "Мої дошки" містить новий борд при поверненні на overview без ручного перезавантаження (той самий патерн, що US-002 AC3).
11. Given нові UI-рядки, Then вони присутні в `locales/en.json` і `locales/uk.json` (двомовність — частина Definition of Done).

## API-поверхня
- Споживає новий `POST /api/v1/boards/import` (US-037) — нових ендпоінтів FE не додає.

## Локалізація
- `board.import.cta` — en: "Import from file", uk: "Імпортувати з файлу"
- `board.import.chooseAnother` — en: "Choose a different file", uk: "Обрати інший файл"
- `board.import.previewTitle` — en: "Import board", uk: "Імпорт дошки"
- `board.import.previewSummary` (параметризований `{title}`) — en: "Import \"{title}\"?", uk: "Імпортувати «{title}»?"
- `board.import.confirm` — en: "Import", uk: "Імпортувати"
- `board.import.cancel` — en: "Cancel", uk: "Скасувати"
- `board.import.importing` — en: "Importing…", uk: "Імпортування…"
- `board.import.success` (параметризований `{title}`) — en: "Board \"{title}\" imported.", uk: "Дошку «{title}» імпортовано."
- `board.import.warningsHeading` — en: "Imported with some notes:", uk: "Імпортовано із зауваженнями:"
- `board.import.dismissWarnings` — en: "Dismiss", uk: "Сховати"
- Warning-рядки `board.import.warning.*` і критичні `errors.boardImport.*` — визначені в US-037, спільні для обох stories.

## Відповідність scope
В межах — точка входу на вже наявному екрані Boards overview, той самий owner-контекст, що "Створити борд". Не суперечить розділу "Поза межами цього етапу". Текстова зміна до CLAUDE.md "Екрани" п.2 — у записі US-037…US-038 вище.
```

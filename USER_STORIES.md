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
| US-018 | Bug fix: розгортання повного тексту вкладення-нотатки | 🔧 У розробці | 2026-08-25 | FE_Attachments |
| US-019 | Коментарі до таски | 🔧 У розробці | 2026-08-25 | FE_TaskPanel, BE_TaskComments, DB_TaskComments |
| US-020 | Оцінений (запланований) час на тасці | 🔧 У розробці | 2026-08-25 | FE_TaskPanel, FE_BoardView, BE_Tasks, DB_Tasks |
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

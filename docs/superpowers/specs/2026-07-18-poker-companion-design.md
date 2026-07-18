# Poker Companion — Design Document

**Date:** 2026-07-18
**Status:** Draft
**Version:** 1.0

---

## 1. Overview

Poker Companion — це прогресивний веб-застосунок (PWA) для Texas Hold'em, що виглядає як нативний iPhone-додаток. Працює на одному пристрої за столом (multi-device у V2), дані зберігаються локально. Hosting на Vercel.

**Ключові вимоги:**
- Native-like iOS experience (SF Pro, glassmorphism, анімації, haptic)
- PWA + offline + Add to Home Screen
- Модульна архітектура з легким масштабуванням від V1 до V3
- Повна ігрова механіка Texas Hold'em

---

## 2. Tech Stack

| Компонент | Технологія |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| State | Zustand з persist (localStorage) |
| Styling | Tailwind CSS v4 + glassmorphism |
| PWA | vite-plugin-pwa |
| Routing | React Router v7 |
| Animations | CSS transitions + framer-motion |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |

**Чому React + Zustand:**
- Найбільша екосистема для PWA
- Zustand дає простий, типізований стан без boilerplate
- Vite zero-config на Vercel

---

## 3. Project Structure

```
poker-companion/
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/           # BottomSheet, Button, Card, Toast, Skeleton, Chip
│   │   ├── layout/       # BottomNav, Header, SafeAreaWrapper, TableLayout
│   │   ├── table/        # PokerTable, CommunityCards, PlayerSeat, PotDisplay
│   │   ├── dealer/       # ActionPanel, BetInput, WinnerSelector, HandHistory
│   │   ├── player/       # PlayerView, YourCards, PlayerActions
│   │   └── screens/      # HomeScreen, TableScreen, StatsScreen, SettingsScreen
│   ├── stores/           # gameStore, playerStore, settingsStore, statsStore, uiStore
│   ├── hooks/            # useGameLoop, useTimer, useHaptics, useLocalStorage
│   ├── utils/            # deck.ts, gameLogic.ts, blinds.ts, potCalculator.ts
│   ├── types/            # index.ts — всі TypeScript інтерфейси
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.1 Модульність

- `ui/` — перевикористовувані примітиви (не залежать від бізнес-логіки)
- `table/` — компоненти столу (відображають ігровий стан)
- `dealer/` — інтерфейс дилера (керування грою)
- `player/` — інтерфейс гравця (перегляд руки)
- `screens/` — сторінки (роутинг)
- `stores/` — логіка стану (кожен store незалежний)
- `utils/` — чисті функції без побічних ефектів

---

## 4. State Management

### 4.1 Схема gameStore

```typescript
interface GameState {
  // Meta
  tableName: string
  createdAt: number
  handsPlayed: number

  // Players
  players: Player[]

  // Positions
  dealerIndex: number
  smallBlindIndex: number
  bigBlindIndex: number
  currentTurnIndex: number

  // Blinds
  sbAmount: number
  bbAmount: number

  // Pot
  pot: number
  currentBet: number
  phase: GamePhase
  communityCards: Card[]

  // Bets per player
  playerBets: Record<string, number>
  playerFolded: string[]
  playerAllIn: string[]
  checkedThisRound: string[]

  // History
  actionHistory: Action[]
  undoStack: Snapshot[]
}
```

### 4.2 Persistence

`zustand/middleware/persist` із `localStorage`. Автоматичне відновлення після перезавантаження сторінки.

### 4.3 Stores

| Store | Відповідальність |
|-------|-----------------|
| gameStore | Ігровий стан, дії, історія, undo |
| playerStore | CRUD гравців, rebuy, sit out |
| settingsStore | Налаштування, тема, блайнди |
| statsStore | Статистика гравців |
| uiStore | Стан UI (модалки, тости, bottom sheets) |

---

## 5. Game Logic (utils/)

Чисті функції, без залежності від React:

- `createDeck(): Card[]` — створює 52 карти, перемішує
- `dealHands(deck, count): Card[][]` — роздає карти
- `dealCommunityCards(deck, phase): Card[]` — флоп/терн/рівер
- `calculatePot(bets): number` — сума всіх ставок
- `calculateWinner(hands, community): Winner[]` — визначення переможця
- `rotatePosition(index, players): number` — наступний активний гравець
- `getNextActor(players, positions): number` — хто має ходити
- `determineBlinds(players, dealerIndex): {sb, bb}` — позиції SB/BB
- `isHandComplete(players): boolean` — чи всі окрім одного зробили fold
- `handleAllIn(player, amount): void` — all-in логіка

---

## 6. Game Flow

### 6.1 Початок роздачі

1. Дилер натискає "New Hand"
2. BTN зміщується наступному активному гравцю
3. SB/BB визначаються автоматично
4. Ставки очищаються, folded/all-in скидаються
5. Роздаються карти (по 2 кожному гравцю)
6. Хід переходить до UTG

### 6.2 Дія гравця

1. Дилер обирає гравця (або система автоматично)
2. Панель дій показує доступні опції: Fold, Check, Call N, Bet, Raise to N, All-in
3. При Bet/Raise — відкривається BottomSheet з числовим вводом
4. Гравці, що зробили fold, пропускаються
5. Після дії — автоматичний перехід до наступного гравця

### 6.3 Перехід між вулицями

1. Коли всі активні гравці зрівняли ставки або один залишився
2. Дилер натискає "Next Street" (або автоматично)
3. Ставки очищаються, додаються community cards
4. Новий раунд торгівлі

### 6.4 Showdown

1. Коли всі дії завершені або остання вулиця відіграна
2. Дилер обирає 1+ переможців (мультивибір)
3. Банк ділиться пропорційно
4. Статистика оновлюється
5. Автоматичний перехід до нової роздачі або ручний режим

---

## 7. UI/UX Design

### 7.1 Візуальний стиль

- **Шрифт:** `-apple-system, BlinkMacSystemFont, "SF Pro Display"` — системний iOS
- **Glassmorphism:** `background: rgba(255,255,255,0.1) + backdrop-filter: blur(20px)`
- **Темна тема:** `background: #000 + glass ефекти + subtle borders`
- **Світла тема:** `background: #f5f5f7 + glass ефекти`

### 7.2 Екрани

**HomeScreen:**
- Список столів (або створення нового)
- Керування гравцями (додати/видалити)
- Налаштування (тема, блайнди)
- Привітальний екран при першому запуску

**TableScreen (Dealer Mode):**
- Poker table з місцями гравців (6-9 seats)
- Кожен гравець: ім'я, стек, картки (якщо роздано), статус (fold/check/call/raise/all-in), поточна ставка
- Центр: community cards + pot
- Знизу: панель дій дилера (Fold/Check/Call/Raise/All-in/Next Street/Showdown)
- Історія дій (свайпний список)

**TableScreen (Player Mode):**
- Та ж таблиця, але без панелі керування
- Акцент на картках гравця
- Підсвітка коли твій хід

**StatsScreen:**
- Таблиця статистики по кожному гравцю
- Експорт (CSV/JSON)

### 7.3 Анімації

- Фішки плавно "летять" до центру при ставках
- Карти з'являються з fade+scale
- BottomSheet виїжджає знизу (нативна iOS-поведінка)
- Skeleton loading при завантаженні
- Toast повідомлення з авто-схованням
- Переходи між екранами — slide-in

### 7.4 iOS Optimization

- `safe-area-inset-*` для Dynamic Island + Home Indicator
- `viewport-fit=cover` у meta viewport
- Портретна орієнтація (`orientation: portrait`)
- `-webkit-overflow-scrolling: touch`
- Haptic feedback через `navigator.vibrate()`
- Оптимізація під iPhone Keyboard (viewport units)

---

## 8. PWA

- `vite-plugin-pwa` for service worker
- Cache-first стратегія для статики (app shell)
- Network-first для даних (fallback до кешу)
- Маски для iOS splash screen
- Apple touch icons всіх розмірів
- manifest.json з display: standalone
- Background sync для майбутніх онлайн-фіч

---

## 9. V1 Feature List

- Dealer Mode + Player Mode
- CRUD гравців (додати, видалити, редагувати стек)
- Початковий стек, поточний стек
- Поточний банк (Pot)
- Dealer Button, Small Blind, Big Blind
- Автоматичне обертання BB/SB/BTN
- Fold, Check, Call, Bet, Raise, All-in
- BottomSheet для введення суми
- Підтвердження дії дилером
- Автоматичний перехід ходу
- Автоматичний розрахунок банку
- Автоматичний розрахунок Call/Raise
- Заборона ставки більшої за стек
- All-in виняток
- Історія всіх дій
- Undo
- Rebuy, Sit Out, Return, Edit Stack
- Завершення роздачі, вибір переможця, поділ банку
- Нова роздача з авто-очищенням
- Автоматичне збереження + відновлення

---

## 10. V2 Feature List (архітектура готова)

- QR-код для підключення
- Таймер ходу + вібрація
- Push-звуки
- Статистика (найбільший банк, кількість виграшів, fold/call/raise/all-in %, прибуток/програш)
- Експорт статистики та історії
- Турнірний режим з блайндами
- Налаштування швидкості блайндів, стартового стеку
- Теми оформлення
- Збереження кількох столів
- Автоматичний Backup (IndexedDB)

---

## 11. V3 Directions (архітектура дозволяє)

- Турніри, кеш-ігри
- Кілька одночасних столів
- Онлайн через WebSocket
- Авторизація (AuthProvider абстракція)
- Профілі, рейтинг, досягнення
- Повноцінний журнал ігор
- Аналітика, імпорт/експорт
- Адмін-панель

---

## 12. Error Handling

- Валідація введення (сума ставки не більша за стек)
- Запобігання діям не в свій хід
- Обробка edge cases: всі All-in, heads-up, один гравець залишився
- Гра не може початися з менше ніж 2 гравцями
- State recovery при помилках

---

## 13. Testing Strategy

- **Unit:** Чисті функції в `utils/` (deck, pot, blind calculation)
- **Integration:** Stores + game flow (Vitest)
- **E2E:** Playwright (основні сценарії: нова гра → дії → showdown)
- Тестувати edge cases: all-in situations, split pot, heads-up

# 小陈待办 技术方案

> 需求文档：[guide.md](./guide.md)。本文只讨论实现方式，不重复需求细节。

## 1. 范围与目标

- App 名称：小陈待办；Android package：`com.curechen.todo`。
- 先交付 **Android** 版本，iOS 后续再做。
- React Native + Expo（development build / prebuild），TypeScript。
- 数据全部本地存储，无后端、无登录、无云同步。
- 提醒使用本地通知：到期提醒 + 每日逾期汇总。
- 本文覆盖：工程结构、数据模型、数据访问、状态管理、页面拆分、核心流程、通知调度、UI 实现、测试、构建、分期与风险。

## 2. 技术选型

| 领域 | 选择 | 说明 |
|---|---|---|
| 语言 | TypeScript（strict） | 全项目类型约束 |
| 框架 | React Native + Expo | 用 development build，不用 Expo Go；必要时 prebuild |
| 导航 | Expo Router | 文件路由，tab + stack 结构清晰 |
| 数据库 | expo-sqlite | 本地 SQLite |
| ORM / 迁移 | Drizzle ORM + drizzle-kit | 类型安全；迁移 SQL 可审查 |
| 状态 | Zustand | 轻量，适合本地 App |
| 表单 | React Hook Form + Zod | 校验统一，减少手写状态 |
| 列表 | @shopify/flash-list | 长列表性能 |
| 手势/动画 | react-native-gesture-handler + react-native-reanimated | 滑动完成、拖拽排序、撤销条 |
| 通知 | @notifee/react-native | 定时/触发通知、渠道、点击处理；需 dev build |
| 日期 | date-fns | 本地时区、格式化、月份计算 |
| 触感 | expo-haptics | 滑动阈值反馈 |
| 图标 | lucide-react-native + react-native-svg | 内置图标集，存 icon key |
| 日期选择 | @react-native-community/datetimepicker | 原生日期/时间选择 |
| 底部弹层 | @gorhom/bottom-sheet | 筛选、类型选择、日历当日列表 |
| ID | expo-crypto randomUUID | UUID v4 |
| 测试 | Jest + React Native Testing Library；Maestro | 单元/组件/端到端 |
| 构建 | EAS Build（主）；本地 prebuild + Gradle（备选） | Android 优先 |
| 代码规范 | ESLint + Prettier | — |

**关键理由**

- **Expo**：路由、构建、升级省事；prebuild 后可加原生模块（精确闹钟检查、开机广播）。
- **Drizzle**：SQL 可控，类型安全，迁移可进代码库。
- **Notifee**：触发通知、渠道、点击事件比 expo-notifications 更完整。
- **Reanimated + Gesture Handler**：滑动、拖拽、撤销条都依赖它。

## 3. 工程结构

```text
src/
  app/                         # Expo Router 路由
    _layout.tsx                # 根布局：DB 初始化、主题、通知初始化
    (tabs)/
      _layout.tsx              # 待完成 / 已完成 / 我的
      index.tsx                # 待完成
      completed.tsx            # 已完成
      profile.tsx              # 我的
    todo/
      new.tsx                  # 新建 todo
      [id].tsx                 # todo 详情/编辑
    types/
      index.tsx                # 类型管理
      new.tsx                  # 添加类型
      [id].tsx                 # 编辑类型
    calendar.tsx               # 日历视图
    settings.tsx               # 设置

  components/
    ui/                        # Button、Input、Sheet、Dialog、EmptyState 等
    todo/                      # TodoRow、SwipeableTodoRow、PriorityChip、DueLabel
    type/                      # TypeTree、TypePicker、IconPicker
    calendar/                  # MonthGrid、DaySheet
    common/                    # UndoBar、ConfirmDialog、Highlight 容器

  db/
    client.ts                  # SQLite + Drizzle 初始化
    schema.ts                  # 表定义
    migrations/                # drizzle-kit 生成
    seed.ts                    # 首次启动预置类型
    repositories/
      todo-repository.ts
      type-repository.ts
      settings-repository.ts

  stores/
    filter-store.ts            # 待完成/已完成各自独立的筛选状态
    selection-store.ts         # 多选
    undo-store.ts              # 全局单槽撤销
    settings-store.ts          # 提醒开关、汇总时间、排序方式
    data-version-store.ts      # 数据变更后通知列表重查
    highlight-store.ts         # 新建/保存后的定位高亮
    navigation-intent-store.ts # 通知点击的待处理路由

  features/
    todos/                     # hooks + 业务逻辑
    types/
    calendar/
    notifications/
      permission.ts            # 通知/精确闹钟权限
      channels.ts              # Android 通知渠道
      scheduler.ts             # 到期提醒 + 每日汇总
      reconcile.ts             # 对账入口
      navigation.ts            # 点击通知后的路由
    settings/

  lib/
    date.ts
    priority.ts
    validation.ts
    ids.ts
    sql.ts                     # LIKE 转义等
  theme/
    colors.ts
    spacing.ts
    typography.ts
  types/
    models.ts
    enums.ts
```

## 4. 数据模型

### 4.1 表结构

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE types (
  id          TEXT PRIMARY KEY NOT NULL,
  parent_id   TEXT REFERENCES types(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- 同一父级下名称唯一（根层级的 parent_id 为 NULL，用 '' 归一化）
CREATE UNIQUE INDEX types_parent_name_uq
  ON types(COALESCE(parent_id, ''), name);

CREATE INDEX types_parent_sort_idx ON types(parent_id, sort_order);

CREATE TABLE todos (
  id           TEXT PRIMARY KEY NOT NULL,
  name         TEXT NOT NULL,
  type_id      TEXT NOT NULL REFERENCES types(id) ON DELETE CASCADE,
  priority     INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 4),
  due_at       INTEGER,
  detail       TEXT NOT NULL DEFAULT '',
  completed_at INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX todos_pending_sort_idx
  ON todos(priority, updated_at DESC) WHERE completed_at IS NULL;
CREATE INDEX todos_completed_idx
  ON todos(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX todos_type_idx ON todos(type_id);
CREATE INDEX todos_due_idx ON todos(due_at) WHERE completed_at IS NULL;

CREATE TABLE settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
```

### 4.2 约定

- 时间统一用 Unix 毫秒（INTEGER）；UI 选择到分钟，秒补 0。
- 优先级用 `1..4` 表示 P1..P4。
- `updated_at`：修改属性或完成/取消完成时更新；无改动保存不更新。
- `completed_at`：完成时写入，取消完成时清空。
- 不做软删除。删除时先取快照，再硬删除，撤销靠内存快照（5 秒）。
- 类型层级无深度限制；同父级名称唯一。
- `sort_order`：同层递增；新增/移动追加到末尾；拖拽后重排同层。
- 预置类型只在首次启动写入一次（`seeded` 标记），删光不复活。

### 4.3 设置项

| key | 类型 | 默认 | 说明 |
|---|---|---|---|
| `reminders_enabled` | boolean | true | 提醒总开关 |
| `daily_summary_time` | string `HH:mm` | `10:00` | 每日汇总时间 |
| `sort_mode` | enum | `priority_desc` | 待完成排序方式 |
| `seeded` | boolean | false | 是否已写入预置类型 |
| `notification_prompted` | boolean | false | 是否已申请过通知权限 |

## 5. 数据访问层

### 5.1 仓储接口

```ts
type Priority = 1 | 2 | 3 | 4;
type SortMode = 'priority_desc' | 'priority_asc' | 'created_asc' | 'created_desc';

interface TodoFilter {
  typeId?: string;
  keyword?: string;
  priorities?: Priority[];
  overdueOnly?: boolean;
}
```

- `listPending(filter, sortMode)`：加载全部待完成（个人应用规模；后续如需再窗口化）。
- `listCompleted(filter, cursor?)`：按 `completed_at DESC` 分页，每页 30 条，使用 keyset。
- `listByDateRange(start, end)`：日历用，只取待完成。
- `getStats()`：一条 SQL 返回总数/待完成/已完成。
- `listPendingWithDue()`：提醒对账用，返回待完成且有 `due_at` 的记录。
- `getOverdueTodos(now)`：每日汇总判断用。
- `getTypeTree()`：全量类型，内存建树。
- `getTypeDescendantIds(typeId)`：递归 CTE。
- `createTodo / updateTodo / completeTodo / uncompleteTodo / deleteTodos`。
- `createType / updateType / moveType / deleteTypeSubtree / restoreTypeSnapshot`。

### 5.2 查询要点

**类型子树**

```sql
WITH RECURSIVE subtree(id) AS (
  SELECT id FROM types WHERE id = ?
  UNION ALL
  SELECT t.id FROM types t JOIN subtree s ON t.parent_id = s.id
)
SELECT id FROM subtree;
```

筛选时把子树 id 拼进 `IN (...)`；类型树规模小，可接受。

**排序映射**

| SortMode | ORDER BY |
|---|---|
| `priority_desc` | `priority ASC, updated_at DESC` |
| `priority_asc` | `priority DESC, updated_at DESC` |
| `created_asc` | `created_at ASC, updated_at DESC` |
| `created_desc` | `created_at DESC, updated_at DESC` |
| 已完成固定 | `completed_at DESC` |

**关键词**

- `name LIKE ? OR detail LIKE ?`，前后 `%`。
- 对 `%`、`_`、`\` 做转义，并指定 `ESCAPE '\'`。
- 不区分大小写；不搜索类型名。

**筛选组合**

- 类型（子树）AND 关键词 AND 优先级（OR）AND 只看逾期。
- 只看逾期：`completed_at IS NULL AND due_at IS NOT NULL AND due_at < now`。

**分页**

- 已完成用 `(completed_at, id)` keyset，避免 OFFSET 漂移。
- 待完成一次加载全部；FlashList 负责渲染性能。

### 5.3 事务与快照

- 类型删除、批量删除、撤销恢复使用 `withTransactionAsync`。
- 删除前收集：

```ts
interface TodoDeleteSnapshot {
  todos: TodoRecord[];
}

interface TypeDeleteSnapshot {
  types: TypeRecord[];   // 父级在前
  todos: TodoRecord[];   // 含已完成
}
```

- 类型删除顺序：收集子树 id → 收集 todos → 快照 → 删除 types（级联）→ 取消通知 → 放入全局撤销槽 → 5 秒后失效。
- 恢复顺序：types 按父级优先插入 → todos 插入 → 恢复通知 → 刷新列表。
- 恢复时若同级重名：自动加「（已恢复）」，仍冲突则「（已恢复 2）」递增。

## 6. 状态管理

| Store | 内容 | 持久化 |
|---|---|---|
| `filter-store` | 两个 tab 各自的 typeId / keyword / priorities / overdueOnly | 否（重启清空） |
| `settings-store` | 提醒开关、汇总时间、排序方式 | 是（SQLite） |
| `selection-store` | 多选 id 集合、是否多选模式 | 否 |
| `undo-store` | 最近一次删除快照、文案、5 秒定时器 | 否 |
| `data-version-store` | 数据变更计数器 | 否 |
| `highlight-store` | 待高亮的 todo/type id + 过期时间 | 否 |
| `navigation-intent-store` | 通知点击后的待处理路由 | 否 |

- 数据查询用“仓储 + hook”：hook 依赖 `dataVersion`、筛选、排序，变更后自动重查。
- 不引入服务端缓存框架；本地 SQLite 足够快。
- `dataVersion` 在每次写操作后 +1；列表、统计、日历、类型树统一失效。

## 7. 页面与导航

### 7.1 路由

```text
(tabs)/
  index         待完成
  completed     已完成
  profile       我的
todo/new        新建
todo/[id]       详情/编辑
types/index     类型管理
types/new       添加类型
types/[id]      编辑类型
calendar        日历视图
settings        设置
```

- 底部 tab 三个：待完成 / 已完成 / 我的。
- 待完成页右上角：日历图标。
- 待完成页右下角：FAB（Floating Action Button，悬浮圆形「＋」按钮）新建 todo。
- 详情/编辑、类型相关页面、日历、设置均为 stack push。

### 7.2 待完成页布局

```text
[标题 待完成]                    [日历图标]
[搜索框                      ] [筛选]
[排序：优先级 ↓] [类型 chip] [只看逾期]
------------------------------------------
FlashList（待完成 todo）
------------------------------------------
                                [＋ FAB]
```

- 点击筛选打开 bottom sheet：类型树单选、优先级 P1-P4 多选、只看逾期开关、清空。
- 排序按钮打开 action sheet，切换 4 种排序。
- 多选模式：顶部切换为「已选 N 条 / 取消」，底部或顶部出现删除按钮。
- 撤销条：全局组件，悬浮于 tab bar 上方。
- FAB 与撤销条同处底部：撤销条出现时 FAB 上移或隐藏，避免遮挡。

### 7.3 已完成页

- 搜索 + 筛选（类型/优先级，无「只看逾期」）。
- FlashList 分页加载，触底加载 30 条。
- 长按多选删除。

### 7.4 新建/详情页

- 底部主按钮（创建/保存）。
- 详情页右上角「…」菜单：删除；类型编辑页同样用「…」菜单删除。
- 详情页展示只读完成状态（待完成 / 已完成 + 完成时间），不提供完成/取消完成按钮。
- 有未保存修改时，返回需二次确认。
- 拦截实现：React Navigation 的 `usePreventRemove` + 自定义确认弹窗；Android 物理返回键走同一拦截。
- 保存成功返回来源列表并触发定位高亮。

## 8. 核心流程

### 8.1 启动

1. 初始化 SQLite、执行迁移。
2. 首次启动写入预置类型。
3. 读取 settings。
4. 初始化通知渠道，执行 `reconcileNotifications()`。
5. 处理 `notifee.getInitialNotification()`，路由到详情或逾期列表。
6. 隐藏 splash。

### 8.2 新建 todo

1. 表单校验（名称、类型；优先级默认 P3）。
2. 插入 DB（`created_at = updated_at = now`）。
3. `reconcileNotifications()`。
4. 清空待完成筛选/搜索。
5. 返回待完成，写入 `highlight-store`，列表定位并高亮 2 秒。

### 8.3 编辑 todo

1. 读取 todo，填表单。
2. 比较字段是否真的变化（trim 后）；无变化则保存按钮置灰。
3. 保存时校验名称非空。
4. 更新 DB，`updated_at = now`。
5. 名称或预计时间变化时，重排对应通知；完成状态不变。
6. 返回来源列表，触发定位高亮。
7. 若不再符合来源列表筛选/搜索，弹出提示 + 「清除筛选」。

### 8.4 滑动完成 / 取消完成

- `Gesture.Pan`：阈值 = 行宽 30%；过阈值触发 `expo-haptics`。
- 松手后：超过阈值 → 动画滑出 → 更新 DB → 取消/重排通知 → 刷新列表。
- 未超过 → spring 回弹。
- 多选模式下禁用。
- 不提供撤销。
- 完成：`completed_at = now, updated_at = now`。
- 取消完成：`completed_at = null, updated_at = now`；若 due_at 在未来，重新排到期提醒。

### 8.5 删除 + 撤销

- 入口：详情「…」、列表多选、类型删除。
- 二次确认弹窗：单条显示名称，多选显示条数，类型显示 todo/子类型数量。
- 确认后：
  1. 事务内快照并删除。
  2. 取消相关通知。
  3. 写入 `undo-store`，显示撤销条，启动 5 秒定时器。
  4. 新删除会覆盖旧撤销并清掉旧定时器。
- 撤销：
  1. 事务内恢复快照。
  2. `reconcileNotifications()`。
  3. 关闭撤销条，刷新数据。
- 删除成功后返回来源列表；类型删除成功后返回类型管理。
- 撤销条跨 tab/页面保留；App 重启后自然失效。

### 8.6 类型添加 / 编辑 / 移动

- 添加：校验名称非空、同父不重名；`sort_order = max + 1`；可直接在待完成页类型选择器内联创建。
- 编辑：校验；父层级不可选自身/子孙（递归检查）。
- 移动：设置新 `parent_id`，`sort_order = 新父级 max + 1`；子树跟随。
- 保存后返回类型管理，定位高亮该节点。
- 无层级深度限制。

### 8.7 类型删除

- 取子树 id、todos、完成状态、时间戳、排序位置。
- 事务删除。
- 取消通知；重置两个 tab 中指向该类型的筛选。
- 撤销恢复整棵子树与 todos，但不恢复筛选。
- 重名自动加后缀。

### 8.8 筛选 / 排序

- 筛选状态按 tab 独立；重启清空。
- 搜索 250ms 防抖。
- 排序方式持久化；切换后重查。
- 新建成功后清空待完成筛选/搜索。
- 通知「只看逾期」入口：清空待完成的其他筛选/搜索，设置 `pending.overdueOnly = true`，切到待完成 tab。

### 8.9 日历

- 只查待完成、`due_at` 在当月范围内的 todo。
- 在 JS 侧按本地日期分组，统计每天数量。
- 月视图 7 列，周一为起始；每天显示数量/圆点，逾期标红。
- 点击某天打开 bottom sheet，列出当天待完成 todo；点击进入详情。
- 数据变化（`dataVersion`）时重查。

### 8.10 统计

- `SELECT COUNT(*) ...` 一次返回三个数字。
- 全局、实时，不受筛选影响。
- 每次 `dataVersion` 变化重查。

### 8.11 主题与组件

- `theme/` 定义颜色、间距、字号。
- 优先级颜色：P1 红、P2 橙、P3 蓝、P4 灰。
- 逾期红色。
- 复用组件：`TodoRow`、`PriorityChip`、`TypeLabel`、`DueLabel`、`EmptyState`、`ConfirmDialog`、`Sheet`。

## 9. 通知方案

### 9.1 基本约定

- 只用本地通知，不接系统日历。
- 两个 Android 渠道：
  - `due`：到期提醒，高重要性。
  - `overdue`：每日逾期汇总，默认重要性。
- 通知 ID：
  - 到期：`due:<todoId>`
  - 汇总：`summary:<yyyy-MM-dd>`
- 点击：
  - 到期提醒 → `/todo/<id>`
  - 汇总 → 待完成 tab，并开启「只看逾期」

### 9.2 权限

- 通知权限：
  - Android 13+ 通过 Notifee 请求 `POST_NOTIFICATIONS`。
  - 旧版本检查通知是否被系统关闭。
- 精确闹钟权限：
  - Android 12+ 检查 `AlarmManager.canScheduleExactAlarms()`。
  - Notifee 不暴露该状态，需要一个小型 Expo Module（Kotlin）提供：
    - `canScheduleExactAlarms(): boolean`
    - `openExactAlarmSettings(): void`
    - `isIgnoringBatteryOptimizations(): boolean`
    - `openBatteryOptimizationSettings(): void`
- **硬规则**：通知权限或精确闹钟权限任一未授予 → **不发送任何提醒**，也不做不精确降级。
- 申请时机：
  - 首次保存带预计时间的 todo 时申请通知权限。
  - 权限缺失时弹出说明 + 跳转系统设置；todo 仍可正常保存。
  - 设置页常驻显示两项权限状态和跳转按钮。
- 用户从系统设置返回后，前台恢复时重新检查并 `reconcileNotifications()`。

### 9.3 到期提醒

- 每个待完成且 `due_at > now` 的 todo，安排一条 `TimestampTrigger`。
- 内容：标题 = todo 名称；正文 = 预计完成时间；data 带 `todoId`。
- 取消/重排：修改预计时间、完成、取消完成、删除、撤销删除。
- 已完成、无预计时间、已过期 → 不安排。
- 通知权限或精确闹钟权限缺失 → 取消全部。

### 9.4 每日逾期汇总

- 存在逾期 todo 时，每天在设置时间（默认 10:00）发一条汇总通知。
- 内容泛化：「有逾期待办 / 点击查看逾期列表」，不显示精确条数（App 未运行时无法更新）。
- 点击 → 待完成 tab + 只看逾期。
- 持续到所有逾期 todo 完成或删除；之后取消后续汇总。
- **滚动预排**：每次对账时，预排未来 14 天的汇总通知（ID `summary:<date>`），这样 App 关闭期间也能触发；超过 14 天未打开 App、或 due 时间在窗口之外，会等下次打开 App 再续排。
  - iOS 后续再做时，需要把窗口缩小到 7 天以内，避免撞 64 条待发通知上限。
- 触发条件（按天计算）：某天汇总时刻之前存在至少一条待完成且 `due_at < 当天汇总时刻` 的 todo；只排未来时刻，今天的汇总时间已过则从明天开始。
- 设置里修改汇总时间后，取消旧 ID 并重排。

### 9.5 对账

统一入口 `reconcileNotifications()`，在所有写操作后、启动/回前台时调用；用串行队列防止并发。

```ts
async function reconcileNotifications() {
  await cancelAppNotifications(); // 只取消 due:/summary: 前缀

  if (!settings.remindersEnabled) return;
  if (!(await canPostNotifications())) return;
  if (!(await canScheduleExactAlarms())) return;

  const now = Date.now();
  const pending = await todoRepo.listPendingWithDue();

  // 到期提醒
  for (const todo of pending) {
    if (!todo.dueAt || todo.dueAt <= now) continue;
    await scheduleTrigger({
      id: `due:${todo.id}`,
      when: todo.dueAt,
      title: todo.name,
      body: `预计完成时间：${formatDue(todo.dueAt)}`,
      channelId: 'due',
      data: { route: `/todo/${todo.id}` },
    });
  }

  // 每日逾期汇总：未来 14 天滚动窗口
  const days = computeSummaryDays(pending, now, settings.dailySummaryTime, 14);
  for (const day of days) {
    await scheduleTrigger({
      id: `summary:${formatDay(day)}`,
      when: day,
      title: '有逾期待办',
      body: '点击查看逾期列表',
      channelId: 'overdue',
      data: { route: '/?overdue=1' },
    });
  }
}
```

- `computeSummaryDays` 为纯函数，便于单元测试。
- 对账失败只记录日志并重试，不阻塞 UI。
- 关闭提醒开关时立即取消全部。

### 9.6 重启与开机恢复

- 先验证 Notifee 的触发通知在 Android 重启后是否保留。
- 若不保留：增加本地 Expo Module 的 `BOOT_COMPLETED` / `TIME_SET` / `TIMEZONE_CHANGED` receiver，触发 headless JS 执行 `reconcileNotifications()`；或由原生侧持久化通知计划并重排。
- 这是 Phase 4 的真机验证项，不通过就加 receiver。

### 9.7 点击通知

- 前台：`notifee.onForegroundEvent` → 路由。
- 后台：`notifee.onBackgroundEvent` → 记录待处理路由。
- 冷启动：`getInitialNotification()`，等 DB/路由就绪后跳转。
- 用 `navigation-intent-store` 暂存，避免 root layout 未挂载时导航失败。

### 9.8 OEM / 电池优化

- 设置页提供「提醒可靠性」说明：
  - 通知权限、精确闹钟权限的状态。
  - 小米/华为/OPPO 等自启动、电池优化引导。
- 不强制，但给出入口。

## 10. UI 与交互实现

### 10.1 滑动完成

- `Gesture.Pan()`，`activeOffsetX` 防止与纵向滚动冲突。
- 双向滑动都触发同一动作；方向只影响退出动画。
- 阈值 30% 行宽，过阈值触发 haptic。
- 拖拽跟随 + 松手动画；多选时禁用。

### 10.2 多选

- 长按 400ms 进入多选；点击行切换选中。
- 顶部显示已选数量，提供「取消」「删除」。
- 删除弹确认，删除后进入全局撤销。
- 切换 tab、改筛选、返回时退出多选。

### 10.3 类型树与拖拽

- 类型管理页使用扁平化树（节点 + depth）渲染。
- 每行：缩进、图标、名称、添加子类型、删除、拖拽手柄。
- 拖拽只允许同父级内排序；跨层级移动走编辑页的父层级选择。
- 实现建议：`react-native-draggable-flatlist` + 自定义 drop 校验；若限制多，改用 Reanimated 自绘拖拽层。
- 拖拽结束后事务内重排同层 `sort_order`。
- 这是 UI 风险点，建议早做原型。

### 10.4 日期时间选择

- 新建：日期 + 时间两步选择；合并后必须 ≥ 当前时间，否则提示且不写入。
- 编辑已有逾期值：打开选择器不自动改动原值；用户主动改时同样受最小值限制。
- 使用 `@react-native-community/datetimepicker`；Android 上日期和时间分开弹出。

### 10.5 撤销条

- 全局组件，悬浮在 tab bar 上方。
- 显示文案 + 「撤销」。
- 5 秒后自动消失；新删除覆盖旧撤销。
- 动画进入/退出用 Reanimated。

### 10.6 无障碍

- 图标按钮加 `accessibilityLabel`。
- 滑动完成提供 `accessibilityActions`（如「完成」），不新增可见按钮，兼顾读屏用户。
- 触控目标 ≥ 44dp。

### 10.7 空态与加载

- 待完成空、筛选无结果、已完成空、日历空、类型树空。
- 首次启动显示 splash；DB 迁移期间不渲染业务页面。
- 数据库/通知错误用 toast 提示，不阻断主流程。

## 11. 测试

### 11.1 单元

- 排序 SQL 映射。
- 类型子树递归。
- 关键词转义。
- 通知计划纯函数：到期提醒、汇总窗口、过期判断。
- 名称/时间校验。
- 撤销快照与重名后缀。

### 11.2 组件

- TodoRow、SwipeableTodoRow、PriorityChip、FilterSheet、TypeTree、MonthGrid。
- 表单校验与未保存拦截。

### 11.3 集成

- 仓储层用内存 SQLite：增删改查、类型删除与恢复、批量删除。
- 迁移脚本执行。
- 首次 seed。

### 11.4 E2E（Maestro）

- 新建 → 筛选 → 滑动完成 → 已完成 tab 取消完成。
- 长按多选删除 → 撤销。
- 类型添加/移动/删除 → 撤销。
- 日历按天查看。

### 11.5 通知真机清单

- 到期提醒准时（权限开启）。
- 通知权限关闭 → 不提醒，设置页状态正确。
- 精确闹钟权限关闭 → 不提醒。
- 每日汇总在 10:00 触发（可把时间改到 1 分钟后测试）。
- 修改时间/完成/删除/撤销后，通知取消或重排。
- 重启手机后提醒仍在（验证 boot receiver）。
- 深色模式/勿扰/电池优化下的行为记录。
- 小米/华为/OPPO 等 OEM 真机验证。

## 12. 构建与发布

- `app.config.ts`：
  - `name: "小陈待办"`
  - `scheme: "todoapp"`
  - Android package：`com.curechen.todo`
  - `POST_NOTIFICATIONS`、`SCHEDULE_EXACT_ALARM`、`RECEIVE_BOOT_COMPLETED`
  - Notifee / boot receiver 的 config plugin
  - `expo-build-properties`：`minSdkVersion: 31`
- EAS：
  - `development`：dev client，真机调试。
  - `preview`：内部测试包。
  - `production`：正式签名包。
- 也可 `npx expo prebuild` 后用本地 Gradle 构建。
- `targetSdkVersion` 按 Google Play 当年度要求；`minSdkVersion` 31（Android 12）。
- 版本号 `versionCode` 每次发版递增。
- OTA 更新（EAS Update）可选；本地 SQLite 迁移要保证向前兼容。

## 13. 实施阶段

| 阶段 | 内容 | 产出 |
|---|---|---|
| P0 | Expo 工程、TS、Router、主题、SQLite/Drizzle、迁移、seed、启动流程 | 可运行的骨架 |
| P1 | 待完成/已完成列表、排序、筛选、新建、详情编辑、滑动完成、删除+撤销、统计 | 核心闭环 |
| P2 | 类型管理树、类型选择器、内联新建、拖拽排序、类型删除+撤销 | 类型完整 |
| P3 | 日历视图、按天列表、逾期标红 | 日历完整 |
| P4 | 通知：权限、到期提醒、每日汇总、对账、开机恢复、设置页 | 提醒闭环 |
| P5 | 动画、空态、无障碍、性能、错误处理、真机测试 | 可发布 |
| P6 | 打包、签名、内部测试、上架准备 | Android 发布 |

建议顺序：**P0 → P1 → P2 → P4 → P3 → P5**。通知是最大风险，尽早做真机验证；日历相对独立，可以后置。

## 14. 风险与备选

| 风险 | 影响 | 应对 |
|---|---|---|
| Android 14+ 精确闹钟权限默认不授予（12/13 通常默认授予） | 到期提醒无法准时 | 首次设置时间时引导开启；无权限则按需求不提醒；设置页常驻入口 |
| OEM 后台限制 | 提醒延迟/不触发 | 真机验证；提供自启动/电池优化引导 |
| 重启后触发通知丢失 | 重启后不提醒 | 验证 Notifee；不保留则加 boot receiver + headless reconcile |
| Notifee 与 Expo prebuild 集成 | 构建/原生配置复杂 | 用 dev build；必要时 prebuild 后手动配置；保留 expo-notifications 备选 |
| 每日汇总在 App 关闭时的预排 | 超过窗口后停止 | 14 天滚动窗口；每次打开续排；文档注明 |
| 类型树拖拽 | 嵌套树拖拽实现复杂 | 限制同层拖拽；用 draggable-flatlist + drop 校验；早做原型 |
| 冷启动通知跳转 | 路由未就绪导致失效 | pending navigation store，根布局就绪后消费 |
| 日期选择器“不能选过去”与已有逾期值冲突 | 编辑体验 | 原值保留，仅在用户主动改动时校验 |
| SQLite 迁移 | 升级丢数据 | Drizzle 迁移纳入版本控制；启动时事务执行；测试迁移 |
| 大量待完成/已完成 | 渲染卡顿 | FlashList；已完成分页；索引；按需窗口化 |

## 15. 已确认的技术决定

1. **App 名称**：小陈待办。
2. **Android package**：`com.curechen.todo`。
3. **图标方案**：Lucide 内置图标集。
4. **最低 Android 版本**：Android 12（API 31）。
5. **构建方式**：EAS Build。
6. **新建入口**：待完成页右下角 FAB（Floating Action Button，悬浮圆形「＋」按钮）。
7. **汇总预排窗口**：14 天；iOS 后续再缩到 7 天以内。
8. **重启恢复**：先验证 Notifee；不保留再加 boot receiver。
9. **深色模式 / 多语言**：本期不做。

## 16. 附：关键实现约定

- 通知 ID 与取消逻辑统一在 `features/notifications`，业务层不直接操作 Notifee。
- 所有写操作后调用 `bumpDataVersion()` + `reconcileNotifications()`。
- 所有时间比较用毫秒时间戳；展示用本地时区。
- 类型子树查询、通知计划计算保持纯函数，方便单测。
- 撤销快照只存内存；过期即丢弃。
- 筛选状态只存 Zustand，不落库；排序和设置落库。
- 不引入网络层、不引入分析 SDK。

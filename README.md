# 小陈待办

本地优先的待办事项 App，Android 优先，使用 React Native + Expo 构建。

## 技术栈

- Expo SDK 58 / React Native 0.88 / React 19
- TypeScript + Expo Router
- SQLite（expo-sqlite）+ Drizzle ORM
- Notifee 本地通知（到期提醒 + 每日汇总）
- App 名称：小陈待办；包名：`com.curechen.todo`；minSdk 31（Android 12）

## 当前阶段

**P0：工程骨架（已完成）**

- Expo 工程、TypeScript、Expo Router
- SQLite 连接、迁移、首次启动预置类型（公司 / 自我提升 / 阅读 / 健身）
- 启动流程（DB 初始化 → splash → tabs），初始化失败可重试
- 三个底部 tab 的空壳页面
- 待完成 / 已完成 / 我的 / 新建 / 详情 / 日历 / 设置 / 类型管理占位页
- 我的页读取并展示统计与类型数量，验证 DB 写入

P0 已验证：

- `npm run typecheck` 通过
- `npx expo config --type public` 通过
- `npx expo export --platform android` 成功
- `npx expo-doctor` 20/20 通过
- SQLite schema / seed / 唯一索引 / 级联删除用 sqlite3 验证通过
- release APK 构建成功（arm64-v8a，36MB，debug 签名，可侧载）

**P1：核心闭环（已完成）**

- 待完成 / 已完成真实列表，含加载与空态
- 新建待办：名称、类型、优先级、预计完成时间、详情；校验与未保存拦截
- 详情编辑：保存、删除二次确认、已完成状态只读展示
- 右滑完成 / 取消完成，触感反馈，超过行宽 30% 触发
- 长按进入多选，批量删除 + 5 秒撤销
- 筛选：类型（含子类型）、优先级多选、只看逾期
- 搜索：名称 / 详情，250ms 防抖
- 排序：优先级高低 / 创建时间远近，持久化记住
- 已完成列表分页加载
- 新建后清空待完成筛选并滚动高亮；编辑后不符合当前筛选时提示清除
- 我的页统计随数据操作刷新

P1 已验证：

- `npm run typecheck` 通过
- `npx expo export --platform android` 成功（4218 modules，7.1MB HBC）
- SQL 冒烟测试通过（类型子树、LIKE 转义、完成列表 keyset、删除/恢复）
- P1 release APK 构建成功，已在 Android 36 / arm64 模拟器完成安装与核心流程验证
- 图标：基于提供的蓝色渐变清单图标，生成 adaptive icon、splash、favicon
- v0.2.1 修复：滑动完成背景在静止时不再透出；底部 tab 移除大范围点击动画

**P2：类型管理（已完成）**

- 类型树按层级展示，不限深度；根类型 / 子类型添加、编辑、删除
- 添加 / 编辑：内置图标集、名称（≤20 字）、父层级选择；同父层级重名校验
- 编辑支持移动父层级（禁止选择自身及子孙），移动后追加到新父级末尾
- 删除整棵子树：二次确认展示 todo 数与子类型数；5 秒内可撤销；恢复类型、全部 todo 及状态/时间戳/排序；重名自动加「（已恢复）」
- 同层拖拽排序：类型管理右上「排序」进入排序模式，按住行尾手柄拖动，完成后点「完成」；排序写入数据库
- 待办新建 / 编辑的类型选择器支持内联新建类型（图标、名称、父层级），创建后自动选中并保留
- 类型删除时重置两个 tab 中指向该类型的筛选
- 未保存返回二次确认；无改动时保存置灰

P2 已验证：

- `npm run typecheck` 通过
- 类型相关 SQL 冒烟测试通过（子树快照、逐层恢复、重名后缀、同层重排、级联删除）
- P2 release APK 构建成功，并在 Android 36 / arm64 模拟器完成以下流程验证：
  - 添加根类型 / 子类型、改名、换图标、移动父层级
  - 删除带 todo 的类型，确认文案显示 1 条 todo，撤销后类型和 todo 均恢复
  - 待办类型选择器内联新建（含父层级选择），新类型自动选中并保留
  - 「排序」模式拖拽重排、刷新后顺序保留
  - 同层重名创建被拦截并提示
  - 未保存返回二次确认

**P3：日历（已完成）**

- 待完成 tab 右上角进入日历
- 月视图 7 列、周一为起始；显示当前月每天待完成 todo 数量
- 今天用蓝色圆圈标记；有逾期 todo 的日期数字和数量标红
- 支持上个月 / 下个月 / 今天；只查询未完成且设置了预计完成时间的 todo
- 点击某天弹出当天列表：todo 名称、类型、优先级、时间；点击进入详情
- 空日期显示「当天没有待完成的待办」
- 数据变化（完成/删除/编辑 due）后重新查询

P3 已验证：

- `npm run typecheck` 通过
- P3 release APK 构建成功，并在 Android 36 / arm64 模拟器验证：
  - 2026 年 10 月月视图、周一开头、今天 22 日圆圈
  - 明天 23 日显示 1 条待完成
  - 点击 23 日弹出「10月23日 周五」列表，点击 todo 进入详情后可返回
  - 点击空日期显示空态
  - 下个月 / 今天按钮切换正常

**P4：本地通知（已完成）**

- Notifee；两个 Android 渠道：到期提醒（高重要性）/ 逾期汇总（默认）
- 到期提醒：每个待完成且 due 在未来的 todo 单独安排；无 due、已完成、已过期不安排
- 每日逾期汇总：默认 10:00，可在设置修改；未来 14 天滚动预排；内容泛化；点击进入待完成并开启「只看逾期」
- 通知点击：到期 → 该 todo 详情；汇总 → 待完成 + 只看逾期；支持前台/后台/冷启动
- 权限：Android 13+ 通知权限、Android 12+ 精确闹钟权限；设置页常驻显示状态并可跳系统设置
- 首次保存带预计完成时间的 todo 时申请通知权限；权限缺失时待办仍正常保存
- **硬规则**：通知权限或精确闹钟权限任一缺失 → 取消全部触发通知，不做不精确降级
- 每次数据变更 / 启动 / 回前台自动对账重排；关闭提醒开关取消全部；修改汇总时间重排
- R8 保留 WorkManager/Room 类，修复 Notifee 触发通知导致的启动崩溃

P4 已验证：

- P4 release APK 构建成功，并在 Android 36 / arm64 模拟器验证：
  - 首次保存带 due 的 todo，系统通知权限弹窗出现，允许后待办保存成功
  - 设置页精确闹钟状态显示「已开启」；通知权限、电池优化状态与入口正常
  - 到期提醒 00:05 准时送达，标题/正文正确；点击进入该 todo 详情
  - 每日汇总 00:10 送达；点击进入待完成并自动开启「只看逾期」，逾期时间标红
  - R8/WorkManager 启动崩溃已修复

**QA / 细节打磨（0.5.1，已完成）**

本轮 QA 在 0.5.0 基础上做了两项修复，并重新走了一遍 prebuild + release + 模拟器回归：

- 类型拖拽：改为以手指最终绝对 Y（叠加 ScrollView 偏移）计算落点，修复偶发拖到相邻位置的问题；排序模式下列表在未拖拽时可滚动
- 构建可复现：把 Notifee / WorkManager / Room 的 R8 keep 规则放进 `app.config.ts` 的 `extraProguardRules`；新增 `plugins/withNotificationIcon.js` 在 prebuild 时复制通知小图标，避免重新 prebuild 后启动崩溃或通知图标丢失
- 版本 0.5.1（versionCode 7）；debug keystore 在 prebuild 后保持不变，仍可覆盖升级

QA 已验证：

- `expo prebuild` 重新生成 android 后，通知权限、R8 规则、通知图标、版本号都正确；release 包启动无 WorkManager 崩溃
- 类型拖拽把「自我提升」拖到根类型第一位，落点准确；类型选择器顺序同步更新
- 新建含 due 的 todo、筛选、搜索、已完成 tab、日历日详情、详情编辑均正常
- 首次保存带 due 的 todo：通知权限系统弹窗 → 精确闹钟 Alert → 跳系统「闹钟和提醒」页授权 → 返回后设置页显示两项「已开启」
- 到期提醒在 13:20 送达（标题 `QA Notify` / 正文 `预计完成时间：今天 13:20`），点击进入该 todo 详情
- 设置页 v0.5.1、汇总时间、权限与电池优化状态正常

仍保留的已知边界（与 P4 设计一致）：

- 每日汇总采用 14 天滚动预排；超过 14 天未打开 App 会等下次打开后续排
- 汇总内容泛化，不携带关闭期间的精确逾期数量
- 任一通知/精确闹钟权限缺失时取消全部提醒（硬规则），不做不精确降级
- 本轮 QA 重点回归了到期提醒链路；每日汇总链路沿用 P4 已验证实现

## 本地运行

```bash
npm install
npm run start
```

需要 Android 12+ 真机或模拟器。如果 Expo Go 版本低于 SDK 58，请使用 development build（`npx expo run:android` 或 EAS）。

通知相关功能（P4）需要 development build 和 Android 12+ 真机。

## 本地 APK

已生成可侧载的 QA release APK：

- 文件：[artifacts/xiaochen-todo-0.5.1-arm64.apk](artifacts/xiaochen-todo-0.5.1-arm64.apk)
- 包名：`com.curechen.todo`；版本 0.5.1（versionCode 7）
- 最低 Android 12（API 31）；`arm64-v8a`；约 39 MB
- 签名：Android debug keystore（与 0.5.0 同一签名，可直接覆盖升级）
- SHA-256：`b53686e1c2a213a0be3fa0bdf26cbea43e29e87171d62fb8590bff839628494c`

安装：

```bash
adb install -r artifacts/xiaochen-todo-0.5.1-arm64.apk
```

或者把 APK 传到手机，允许“安装未知应用”后点击安装。首次启动会初始化 SQLite 并写入预置类型；「我的」页应显示 4 个类型。P1 列表/新建编辑/滑动完成/筛选排序/删除撤销、P2 类型管理、P3 日历、P4 本地通知、QA 修复都已包含在内。

### 重新构建

推荐用脚本：

```bash
./scripts/build-apk.sh                 # arm64-v8a
ABI=all ./scripts/build-apk.sh         # 通用包
ABI=armeabi-v7a ./scripts/build-apk.sh # 32 位
```

脚本会自动选择 JDK 17、优先使用项目内 `.android-sdk`、复用 `.gradle` 缓存，产物复制到 `artifacts/`。

手动构建等价命令：

```bash
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a
```

也可以打开 Android Studio：`File > Open` 选择 `android/`，Gradle JDK 设为 17，Build Variants 选 `release`，再 `Build > Build Bundle(s)/APK(s) > Build APK(s)`。

需要 JDK 17、Android SDK Platform 37.0、Build-Tools 37.0.0、NDK 27.1.12297006、CMake 3.22.1。首次构建约 17 分钟，增量约 2 分钟。

构建工具链缓存在 `.android-sdk/` 和 `.gradle/`（已 gitignore，约 5GB）；不需要可删除。`android/` 是 prebuild 生成目录，已 gitignore；缺失时运行 `npx expo prebuild --platform android`。

## 校验

```bash
npm run typecheck
```

## 文档

- 需求文档：[doc/guide.md](doc/guide.md)
- 技术方案：[doc/tech-plan.md](doc/tech-plan.md)

## 目录

```text
src/
  app/        Expo Router 路由
  components/ UI 组件
  db/         SQLite / Drizzle / 迁移 / seed
  lib/        常量与工具
  theme/      颜色、间距、字号
```

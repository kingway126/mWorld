# mWorld AI 协作指南

最近更新：2026-05-30
适用仓库：`mWorld`
文档性质：根级 AI coding agent 协作契约

本文档是 AI 在本仓库中工作的项目指南。创建、移动、命名文件，修改模块边界，新增依赖，或初始化代码前，应先阅读本文件。用户的明确指令高于本文档；如果用户指令与本文档冲突，按用户指令执行，并在最终总结中说明冲突点与处理方式。

---

## OVERVIEW

mWorld 项目骨架已完成初始化，当前进入 Admin 瓦片地图编辑器 POC 阶段。

本仓库采用：

- `apps/admin`：Admin/Studio 前端应用。
- `apps/portal`：Portal 玩家运行时前端应用。
- `backend`：单一 Go 后端模块，使用 Go + chi，并按 DDD 领域驱动设计组织边界。

当前阶段允许在 `apps/admin` 内实现瓦片地图编辑器前端 POC。后端仍不预设具体业务上下文，不迁移旧项目业务实现。

---

## STRUCTURE

```text
mWorld/
  apps/
    admin/
      public/
      src/
        app/
        api/
        routes/
        features/
        shared/
    portal/
      public/
      src/
        app/
        api/
        routes/
        features/
        shared/

  backend/
    cmd/
      admin/
      portal/
    configs/
    migrations/
    internal/
      apps/
        admin/
          config/
          dto/
          http/
          service/
        portal/
          config/
          dto/
          http/
          service/
      domain/
      engine/
      infrastructure/
        persistence/
        storage/
        cache/
        queue/
        external/
      platform/
        config/
        clock/
        id/
        httpx/
        jsonx/
        logging/
        errors/
        response/
      architecture/

  docs/
    active/
    focus/
    implemented/
    adr/

  poc/
  ops/
    env/
    docker/
```

---

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Admin frontend | `apps/admin` | 独立 React + TypeScript 应用。 |
| Portal frontend | `apps/portal` | 独立 React + TypeScript 应用。 |
| Admin backend entry | `backend/cmd/admin` | 只做配置加载、依赖装配和进程启动。 |
| Portal backend entry | `backend/cmd/portal` | 只做配置加载、依赖装配和进程启动。 |
| Admin app boundary | `backend/internal/apps/admin` | Admin 专属 config、DTO、HTTP、service。 |
| Portal app boundary | `backend/internal/apps/portal` | Portal 专属 config、DTO、HTTP、service。 |
| Domain model | `backend/internal/domain` | 领域模型与领域规则。当前不预设业务上下文。 |
| Shared engine | `backend/internal/engine` | 跨应用复用的纯计算、规则或运行时能力。 |
| Infrastructure | `backend/internal/infrastructure` | PostgreSQL、Redis、对象存储、队列、外部 API 等适配实现。 |
| Platform tools | `backend/internal/platform` | 无业务含义的通用工具。 |
| Architecture checks | `backend/internal/architecture` | 后续放架构测试和依赖边界检查。 |
| Active docs | `docs/active` | 当前讨论、设计草案、任务拆解。 |
| Focus docs | `docs/focus` | 长期架构边界和关键规则。 |
| Implemented docs | `docs/implemented` | 已实现事实。 |
| ADR | `docs/adr` | 架构决策记录。 |
| Experiments | `poc` | 原型和技术验证，不是正式实现目录。 |
| Operations | `ops` | 本地环境、Docker 和部署辅助配置。 |

---

## ARCHITECTURE INVARIANTS

### Frontend

- `apps/admin` 与 `apps/portal` 是两个独立前端应用。
- 不创建根级 `packages/` 共享前端源码包。
- 不让 Portal 依赖 Admin 的页面、状态、编辑器结构或内部模块。
- 每个前端应用可以有自己的 `src/shared/`，但只服务当前应用。
- 新功能先进入各自应用的 `src/features/`。确认稳定后，再在当前应用内部提取共享能力。

### Backend

- 主后端只保留一个 Go module，位置为 `backend/`。
- `backend/cmd/admin` 与 `backend/cmd/portal` 是进程入口，不加 `-server` 后缀。
- `cmd/*` 保持轻薄，只负责配置加载、应用组装、进程启动和进程级错误处理。
- Admin 专属后端代码放在 `backend/internal/apps/admin`。
- Portal 专属后端代码放在 `backend/internal/apps/portal`。
- Admin 与 Portal 不互相依赖。需要共享的领域概念进入 `domain`，共享计算能力进入 `engine`，通用技术能力进入 `platform` 或 `infrastructure`。
- `poc/` 只能放实验验证。POC 代码验证通过后，也必须按正式边界重新落地。

---

## DDD RULES

本项目后端以 DDD 领域驱动设计作为长期约束。新增能力时，先确认领域概念、聚合边界、用例和端口，再决定 HTTP、数据库、缓存、队列或外部服务实现。

默认依赖方向：

```text
apps/*/http
  -> apps/*/service
  -> domain

infrastructure
  -> domain 或 apps/*/service 中定义的端口

cmd
  -> apps + infrastructure + platform 的装配
```

必须遵守：

- 业务规则必须进入 `domain` 或 `apps/*/service`，不得写在 `cmd`、HTTP handler、DTO、repository adapter、cache adapter、queue adapter 或 platform 工具中。
- HTTP 层只做协议适配、路由、参数解析、DTO 转换和错误映射。
- DTO 靠近应用边界，不污染 domain model。
- Domain 不得导入 `apps`、HTTP、chi、pgx、Redis client、SQL 细节、对象存储 client、配置读取器或 infrastructure 实现。
- 外部技术只能通过端口进入应用层；不要让技术 client 或请求/响应对象泄漏进 domain。
- 跨层调用如果需要反向 import，应调整端口或用例边界，而不是放宽依赖方向。
- 修改业务流程时，应同步补充或调整 `backend/internal/architecture` 下的架构测试，防止依赖边界回退。
- 不确定放在哪一层时，先补充设计说明或 ADR，再落代码。

### Bounded Contexts

当前阶段不预设任何具体业务上下文。

只有当 bounded context 被明确确认后，才创建：

```text
backend/internal/domain/<bounded-context>/
backend/internal/apps/<app>/service/<use-case-group>/
backend/internal/infrastructure/persistence/<driver>/<bounded-context>/
```

不要为了方便调用提前创建旧项目里的业务目录。

### Adapter Layout

repository、cache、queue adapter 必须带技术实现维度：

```text
backend/internal/infrastructure/persistence/<driver>/<bounded-context>
backend/internal/infrastructure/cache/<driver>/<bounded-context>
backend/internal/infrastructure/queue/<driver>/<bounded-context>
```

允许示例：

```text
backend/internal/infrastructure/persistence/postgres/<bounded-context>
backend/internal/infrastructure/cache/redis/<bounded-context>
```

禁止示例：

```text
backend/internal/infrastructure/persistence/<bounded-context>
backend/internal/infrastructure/cache/<bounded-context>
```

数据库 client、连接池、配置和 health/readiness 能力属于 driver 基础设施；repository adapter 属于 `<driver>/<bounded-context>`。

---

## DIRECTORY CONTRACTS

### `apps/admin`

Admin/Studio 前端应用。

- `public/`：静态资源。
- `src/app/`：应用启动、全局 Provider、应用级装配。
- `src/api/`：Admin API 访问适配。
- `src/routes/`：路由声明。
- `src/features/`：Admin 功能入口，不预设业务模块。
- `src/shared/`：Admin 内部共享能力。

### `apps/portal`

Portal 玩家运行时前端应用。

- `public/`：静态资源。
- `src/app/`：应用启动、全局 Provider、应用级装配。
- `src/api/`：Portal API 访问适配。
- `src/routes/`：路由声明。
- `src/features/`：Portal 功能入口，不预设业务模块。
- `src/shared/`：Portal 内部共享能力。

### `backend/internal/apps`

应用边界目录。

- `config/`：应用专属配置结构和解析。
- `dto/`：当前应用 API 入参与出参结构。
- `http/`：chi router、handler、middleware 接入和协议适配。
- `service/`：应用用例编排、事务边界和端口调用。

### `backend/internal/domain`

领域层目录。

这里放稳定领域模型、值对象、聚合、领域服务、领域事件和领域仓储接口。当前保持中性，不创建具体业务上下文。

### `backend/internal/engine`

共享领域计算或运行时能力目录。

只有跨应用复用，且不属于单一应用用例编排的纯能力，才放在这里。`engine` 不应成为业务杂物箱。

### `backend/internal/infrastructure`

基础设施适配目录。

- `persistence/`：数据库持久化 adapter。
- `storage/`：本地文件、OSS、S3 等对象存储 adapter。
- `cache/`：Redis 或其他缓存 adapter。
- `queue/`：消息队列、任务队列 adapter。
- `external/`：第三方 API 和外部服务 client。

### `backend/internal/platform`

无业务含义的后端通用工具目录。

`platform` 可以服务多个应用边界，但不能承载业务规则。

### `docs`

- `active/`：当前任务上下文、草案、阶段计划。
- `focus/`：长期架构边界和关键规则。
- `implemented/`：已实现事实，只记录现状。
- `adr/`：Architecture Decision Record。

---

## ANTI-PATTERNS

不要创建或恢复：

```text
admin/backend
admin/frontend
frontstage/backend
frontstage/frontend
frontend/
apps/portal/frontend
packages/
```

不要做：

- 从旧项目复制业务实现代码。
- 在当前阶段预设旧项目业务目录。
- 为 Admin 或 Portal 新建独立 Go module。
- 把业务逻辑堆进 `cmd/*`、HTTP handler、DTO、repository adapter 或 platform。
- 让 Portal 运行时依赖 Admin server。
- 在 domain 中引入 chi、pgx、Redis、SQL、HTTP request/response 或环境变量读取逻辑。
- 创建不带 driver 维度的 persistence/cache/queue adapter。

---

## DOCUMENTATION RULES

- 长期边界写入 `docs/focus/`。
- 已实现事实写入 `docs/implemented/`。
- 当前任务拆解、临时方案和审查记录写入 `docs/active/`。
- 架构决策写入 `docs/adr/`。
- 不要把 speculative design 写进 `implemented`。
- 如果实现变化导致目录边界或 DDD 规则变化，应同步更新本文件和相关 focus/ADR 文档。

---

## CURRENT STAGE

当前阶段目标：

```text
1. 在 apps/admin 初始化 React + TypeScript 前端应用。
2. 使用 Leafer.js 实现 Admin 瓦片地图编辑器画布 POC。
3. 产出独立地图文档模型，并提供 Phaser/Tiled JSON 导出能力。
```

当前阶段约束：

- 瓦片地图编辑器代码只放在 `apps/admin/src/features/tile-map-editor`。
- Leafer.js 只作为 Admin 编辑器画布层，不进入 `apps/portal`。
- 地图文档模型不得绑定 Leafer 节点结构，Portal 后续通过导出数据渲染。
- 第一阶段只支持正交瓦片地图和前端本地状态。
- 可以在 `apps/admin` 引入 React、TypeScript、Vite、Leafer.js 等前端依赖。
- 不创建具体业务上下文目录。
- 不初始化旧项目业务结构。
- 不从旧项目复制实现代码。
- 不修改后端持久化或创建后端业务模块。

---

## WHEN TO UPDATE THIS FILE

出现以下情况时，应更新 `AGENTS.md`：

- 顶层目录结构变化。
- Admin / Portal / backend 边界变化。
- DDD 分层规则变化。
- 新增或废弃主要命令。
- 文档组织规则变化。
- 用户明确提出新的长期协作偏好。

更新时保持短、准、可执行。不要把具体 feature backlog 写进本文件。

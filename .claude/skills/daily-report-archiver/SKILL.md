---
name: daily-report-archiver
description: 接收员工日报并进行结构化信息提取与存档。当员工提交日报、写日报、录入日报、发送日报、日报存档时，使用此技能提取结构化指标并写入 SQLite 数据库。包括 save-report 录入命令和 check-missing 漏交检测功能。
---

# Daily Report Archiver

员工提交日报后，将非结构化文本解析为结构化指标并存入数据库。

## 工作流程

1. **接收日报**（由飞书智能体或定时器触发）
2. **提取指标**（AI 从非结构化文本中提取：`clients_contacted`, `leads_generated`, `visits_conducted`, `prospective_projects`, `prospective_amount`, `opportunity_projects`, `bidding_signing_projects`, `collection_projects`）
3. **调用 CLI 写入数据库**

## CLI 命令

### save-report

```bash
node cli.js save-report \
  --employee "员工姓名或拼音" \
  --date "2026-05-25" \
  --raw "原始日报文本内容" \
  --metrics '{"clients_contacted":3,"leads_generated":1,"visits_conducted":1,"prospective_projects":0,"prospective_amount":0,"opportunity_projects":1,"bidding_signing_projects":0,"collection_projects":0}' \
  --projects '[{"name":"碧桂园项目","amount":600000,"stage":"opportunity","status":"normal"}]'
```

### check-missing

```bash
node cli.js check-missing --date "2026-05-25"
# 输出: {"date":"2026-05-25","missing_count":3,"missing_employees":[...]}
```

## 数据库表结构

- `departments` - 部门表
- `employees` - 员工表
- `daily_metrics` - 每日指标（UNIQUE employee_id + date，支持 Upsert）
- `projects` - 项目表（UNIQUE employee_id + name，支持 Upsert）

## AI 提取指导

从日报文本中识别以下指标：

| 字段 | 说明 |
|------|------|
| `clients_contacted` | 当日联系客户数 |
| `leads_generated` | 新增商机线索数 |
| `visits_conducted` | 拜访次数 |
| `prospective_projects` | 意向阶段项目数 |
| `prospective_amount` | 意向总金额 |
| `opportunity_projects` | 商机阶段项目数 |
| `bidding_signing_projects` | 招标/签约阶段项目数 |
| `collection_projects` | 回款阶段项目数 |

项目阶段枚举：`prospective` \| `opportunity` \| `bidding` \| `collection`
项目状态枚举：`normal` \| `risk` \| `stagnant`
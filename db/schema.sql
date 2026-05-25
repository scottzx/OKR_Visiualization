-- 谛听 (Diting) OKR & MTL 数据库 Schema

-- 如果表已存在，则删除
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS daily_metrics;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

-- 1. 部门表 (Departments)
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    target REAL NOT NULL
);

-- 2. 员工表 (Employees)
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    pinyin TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    annual_target REAL NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 3. 每日汇总指标表 (Daily Metrics)
CREATE TABLE daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    clients_contacted INTEGER DEFAULT 0, -- 接触客户数
    leads_generated INTEGER DEFAULT 0, -- 商机线索数
    visits_conducted INTEGER DEFAULT 0, -- 拜访次数
    prospective_projects INTEGER DEFAULT 0, -- 意向项目数
    prospective_amount REAL DEFAULT 0.0, -- 意向总金额
    opportunity_projects INTEGER DEFAULT 0, -- 商机阶段项目数
    bidding_signing_projects INTEGER DEFAULT 0, -- 招标/签合同项目数
    collection_projects INTEGER DEFAULT 0, -- 回款中项目数
    raw_content TEXT, -- 原始日报非结构化文本
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, date)
);

-- 4. 活跃项目明细表 (Projects)
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- 项目名称
    amount REAL NOT NULL DEFAULT 0.0, -- 项目金额
    stage TEXT NOT NULL CHECK(stage IN ('prospective', 'opportunity', 'bidding', 'collection')), -- 漏斗阶段 (意向, 商机, 招标/签约, 回款)
    employee_id INTEGER NOT NULL, -- 负责人外键
    status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'risk', 'stagnant')), -- 状态 (正常, 风险, 停滞)
    last_updated TEXT NOT NULL, -- YYYY-MM-DD
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, name)
);

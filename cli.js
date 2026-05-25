#!/usr/bin/env node

import { Command } from 'commander';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db', 'diting.db');

const program = new Command();

program
  .name('diting')
  .description('谛听 (Diting) - OKR & MTL 智能体数据落库与统计 CLI 工具')
  .version('1.0.0');

// 数据库连接助手
function getDbConnection() {
  try {
    return new DatabaseSync(DB_PATH);
  } catch (err) {
    console.error('❌ 无法连接到 SQLite 数据库:', err.message);
    process.exit(1);
  }
}

// 员工匹配助手
function findEmployee(db, nameOrPinyin) {
  // 1. 先尝试姓名或拼音完全匹配
  const exactStmt = db.prepare('SELECT id, name, pinyin FROM employees WHERE name = ? OR pinyin = ?');
  let row = exactStmt.get(nameOrPinyin, nameOrPinyin.toLowerCase());
  
  if (row) return row;

  // 2. 尝试模糊匹配（比如拼音前缀或者姓名包含）
  const fuzzyStmt = db.prepare('SELECT id, name, pinyin FROM employees WHERE name LIKE ? OR pinyin LIKE ?');
  row = fuzzyStmt.get(`%${nameOrPinyin}%`, `%${nameOrPinyin}%`);
  
  return row;
}

// 命令 1: save-report (录入/更新日报数据)
program
  .command('save-report')
  .description('录入非结构化日报文本及智能体提取出来的结构化指标与项目卡片')
  .requiredOption('--employee <name_or_pinyin>', '汇报员工姓名或拼音')
  .requiredOption('--date <yyyy-mm-dd>', '日报汇报日期')
  .requiredOption('--raw <content>', '原始非结构化日报内容')
  .requiredOption('--metrics <json_string>', '结构化过程与漏斗统计指标 (JSON)')
  .option('--projects <json_string>', '日报中提到的具体项目进度卡片列表 (JSON)', '[]')
  .action((options) => {
    const db = getDbConnection();
    
    // 1. 查找员工
    const employee = findEmployee(db, options.employee);
    if (!employee) {
      console.error(`❌ 未找到员工: "${options.employee}"，请先录入员工信息`);
      process.exit(1);
    }

    // 2. 解析指标 metrics JSON
    let metrics = {};
    try {
      metrics = JSON.parse(options.metrics);
    } catch (e) {
      console.error('❌ 指标 metrics 必须是合法的 JSON 字符串');
      process.exit(1);
    }

    // 3. 解析项目 projects JSON
    let projects = [];
    try {
      projects = JSON.parse(options.projects);
    } catch (e) {
      console.error('❌ 项目列表 projects 必须是合法的 JSON 字符串数组');
      process.exit(1);
    }

    // 4. 数据整理归档，提供默认值
    const clients_contacted = Number(metrics.clients_contacted || 0);
    const leads_generated = Number(metrics.leads_generated || 0);
    const visits_conducted = Number(metrics.visits_conducted || 0);
    const prospective_projects = Number(metrics.prospective_projects || 0);
    const prospective_amount = Number(metrics.prospective_amount || 0.0);
    const opportunity_projects = Number(metrics.opportunity_projects || 0);
    const bidding_signing_projects = Number(metrics.bidding_signing_projects || 0);
    const collection_projects = Number(metrics.collection_projects || 0);

    try {
      // 开启事务 (Node SQLite 同步事务：直接执行 SQL 命令即可)
      db.exec('BEGIN TRANSACTION;');

      // 4.1 Upsert 写入 daily_metrics 表
      const insertMetric = db.prepare(`
        INSERT INTO daily_metrics (
          employee_id, date, clients_contacted, leads_generated, visits_conducted,
          prospective_projects, prospective_amount, opportunity_projects,
          bidding_signing_projects, collection_projects, raw_content
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(employee_id, date) DO UPDATE SET
          clients_contacted = excluded.clients_contacted,
          leads_generated = excluded.leads_generated,
          visits_conducted = excluded.visits_conducted,
          prospective_projects = excluded.prospective_projects,
          prospective_amount = excluded.prospective_amount,
          opportunity_projects = excluded.opportunity_projects,
          bidding_signing_projects = excluded.bidding_signing_projects,
          collection_projects = excluded.collection_projects,
          raw_content = excluded.raw_content,
          created_at = datetime('now', 'localtime');
      `);

      insertMetric.run(
        employee.id,
        options.date,
        clients_contacted,
        leads_generated,
        visits_conducted,
        prospective_projects,
        prospective_amount,
        opportunity_projects,
        bidding_signing_projects,
        collection_projects,
        options.raw
      );

      // 4.2 Upsert 循环写入 projects 详情表
      if (Array.isArray(projects) && projects.length > 0) {
        const insertProj = db.prepare(`
          INSERT INTO projects (name, amount, stage, employee_id, status, last_updated)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(employee_id, name) DO UPDATE SET
            amount = excluded.amount,
            stage = excluded.stage,
            status = excluded.status,
            last_updated = excluded.last_updated;
        `);

        for (const proj of projects) {
          if (!proj.name) continue;
          const stage = proj.stage || 'prospective';
          const status = proj.status || 'normal';
          const amount = Number(proj.amount || 0.0);
          
          insertProj.run(
            proj.name,
            amount,
            stage,
            employee.id,
            status,
            options.date
          );
        }
      }

      db.exec('COMMIT;');
      console.log(`🎉 成功录入员工 [${employee.name}] 在 ${options.date} 的日报及项目数据！`);
      process.exit(0);

    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('❌ 录入数据事务执行失败，已全部回滚:', err.message);
      process.exit(1);
    }
  });

// 命令 2: check-missing (定时催交检测)
program
  .command('check-missing')
  .description('检查特定日期没有交日报的员工名单')
  .option('--date <yyyy-mm-dd>', '需要排查的日期，默认今天', '2026-05-25')
  .action((options) => {
    const db = getDbConnection();
    
    try {
      const query = db.prepare(`
        SELECT e.name, e.pinyin, d.name AS department_name
        FROM employees e
        JOIN departments d ON e.department_id = d.id
        LEFT JOIN daily_metrics m ON e.id = m.employee_id AND m.date = ?
        WHERE m.id IS NULL
        ORDER BY d.id, e.name;
      `);

      const rows = query.all(options.date);
      
      const result = {
        date: options.date,
        missing_count: rows.length,
        missing_employees: rows.map(r => ({
          name: r.name,
          pinyin: r.pinyin,
          department: r.department_name
        }))
      };

      // 输出标准 JSON 到 stdout，方便飞书智能体抓取与解析
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);

    } catch (err) {
      console.error('❌ 漏交检查失败:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

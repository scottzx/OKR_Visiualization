import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'diting.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// 获取过去天数的 YYYY-MM-DD
function getPastDateString(daysAgo) {
  const date = new Date('2026-05-25T20:00:00'); // 锁定基准日期
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function seed() {
  console.log('🔄 开始初始化数据库并导入演示数据 (使用 Node.js 原生 node:sqlite)...');

  // 1. 创建 db 目录
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 2. 如果存在旧的 db 文件先删除，以求干净的数据种子
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
    } catch (e) {
      console.log('⚠️ 无法删除旧数据库，正在跳过...', e.message);
    }
  }

  // 3. 初始化原生 SQLite 实例
  const db = new DatabaseSync(DB_PATH);

  try {
    // 4. 读取并执行 Schema
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schemaSql);
    console.log('✅ 数据库 Schema 初始化成功！');

    // 5. 导入部门
    const departments = [
      { name: '业务一部', target: 24000000.0 },
      { name: '业务二部', target: 24000000.0 },
      { name: '业务三部', target: 24000000.0 }
    ];

    const insertDept = db.prepare('INSERT INTO departments (name, target) VALUES (?, ?)');
    for (const dept of departments) {
      insertDept.run(dept.name, dept.target);
    }
    console.log('✅ 部门数据导入完成！');

    // 6. 导入 18 位员工 (每个部门 6 人，个人目标 400 万)
    const employees = [
      // 业务一部
      { name: '陈明', pinyin: 'chenming', dept: '业务一部', target: 4000000.0 },
      { name: '张华', pinyin: 'zhanghua', dept: '业务一部', target: 4000000.0 },
      { name: '刘洋', pinyin: 'liuyang', dept: '业务一部', target: 4000000.0 },
      { name: '李娜', pinyin: 'lina', dept: '业务一部', target: 4000000.0 },
      { name: '王磊', pinyin: 'wanglei', dept: '业务一部', target: 4000000.0 },
      { name: '赵敏', pinyin: 'zhaomin', dept: '业务一部', target: 4000000.0 },
      // 业务二部
      { name: '郭涛', pinyin: 'guotao', dept: '业务二部', target: 4000000.0 },
      { name: '孙超', pinyin: 'sunchao', dept: '业务二部', target: 4000000.0 },
      { name: '周杰', pinyin: 'zhoujie', dept: '业务二部', target: 4000000.0 },
      { name: '吴婷', pinyin: 'wuting', dept: '业务二部', target: 4000000.0 },
      { name: '徐伟', pinyin: 'xuwei', dept: '业务二部', target: 4000000.0 },
      { name: '朱莉', pinyin: 'zhuli', dept: '业务二部', target: 4000000.0 },
      // 业务三部
      { name: '何军', pinyin: 'hejun', dept: '业务三部', target: 4000000.0 },
      { name: '郑勇', pinyin: 'zhengyong', dept: '业务三部', target: 4000000.0 },
      { name: '高飞', pinyin: 'gaofei', dept: '业务三部', target: 4000000.0 },
      { name: '林芳', pinyin: 'linfang', dept: '业务三部', target: 4000000.0 },
      { name: '马俊', pinyin: 'majun', dept: '业务三部', target: 4000000.0 },
      { name: '梁晨', pinyin: 'liangchen', dept: '业务三部', target: 4000000.0 }
    ];

    const getDeptId = db.prepare('SELECT id FROM departments WHERE name = ?');
    const insertEmp = db.prepare('INSERT INTO employees (name, pinyin, department_id, annual_target) VALUES (?, ?, ?, ?)');

    for (const emp of employees) {
      const deptRow = getDeptId.get(emp.dept);
      insertEmp.run(emp.name, emp.pinyin, deptRow.id, emp.target);
    }
    console.log('✅ 员工数据导入完成！');

    // 7. 定义企业级 ToB 软件合同项目（最终大屏看到的当前节点）
    const projectTemplates = [
      // 业务一部
      { emp: '陈明', name: '中石油智能化油站系统二期', amount: 1200000, finalStage: 'collection', startDaysAgo: 28, status: 'normal' },
      { emp: '陈明', name: '大庆油田数据湖分析看板', amount: 800000, finalStage: 'bidding', startDaysAgo: 18, status: 'normal' },
      { emp: '陈明', name: '中石化移动商城AI运营升级', amount: 450000, finalStage: 'opportunity', startDaysAgo: 10, status: 'normal' },
      { emp: '张华', name: '招商银行AI智能客服系统', amount: 1800000, finalStage: 'collection', startDaysAgo: 25, status: 'normal' },
      { emp: '张华', name: '平安银行财富管理辅助推荐', amount: 1100000, finalStage: 'bidding', startDaysAgo: 15, status: 'normal' },
      { emp: '刘洋', name: '国家电网智能配电调度系统', amount: 2200000, finalStage: 'bidding', startDaysAgo: 22, status: 'risk' }, // 风险大单
      { emp: '刘洋', name: '南方电网电力负荷预测大屏', amount: 750000, finalStage: 'opportunity', startDaysAgo: 12, status: 'normal' },
      { emp: '李娜', name: '太极集团中药供应链溯源平台', amount: 950000, finalStage: 'collection', startDaysAgo: 29, status: 'normal' },
      { emp: '李娜', name: '同仁堂智慧零售CRM系统', amount: 600000, finalStage: 'opportunity', startDaysAgo: 8, status: 'normal' },
      { emp: '王磊', name: '比亚迪车联网数据分析看板', amount: 1500000, finalStage: 'opportunity', startDaysAgo: 20, status: 'stagnant' }, // 停滞项目
      { emp: '王磊', name: '吉利汽车精准营销推荐引擎', amount: 900000, finalStage: 'prospective', startDaysAgo: 6, status: 'normal' },
      { emp: '赵敏', name: '中粮集团粮食进销存智能看板', amount: 1300000, finalStage: 'bidding', startDaysAgo: 16, status: 'normal' },
      { emp: '赵敏', name: '蒙牛牧场智能化设备监控系统', amount: 500000, finalStage: 'prospective', startDaysAgo: 4, status: 'normal' },

      // 业务二部
      { emp: '郭涛', name: '腾讯云政务数字孪生底座', amount: 2000000, finalStage: 'collection', startDaysAgo: 27, status: 'normal' },
      { emp: '郭涛', name: '深圳市政务服务智能推荐', amount: 950000, finalStage: 'bidding', startDaysAgo: 14, status: 'normal' },
      { emp: '孙超', name: '万科集团智慧物业决策大屏', amount: 1050000, finalStage: 'bidding', startDaysAgo: 21, status: 'normal' },
      { emp: '孙超', name: '碧桂园售楼管家AI客服平台', amount: 600000, finalStage: 'opportunity', startDaysAgo: 11, status: 'normal' },
      { emp: '周杰', name: '美团大仓储供应链路径规划', amount: 1600000, finalStage: 'opportunity', startDaysAgo: 24, status: 'risk' }, // 风险项目
      { emp: '周杰', name: '货拉拉智能运力调度引擎', amount: 800000, finalStage: 'prospective', startDaysAgo: 7, status: 'normal' },
      { emp: '吴婷', name: '字节跳动火山引擎海外数据看板', amount: 1400000, finalStage: 'collection', startDaysAgo: 26, status: 'normal' },
      { emp: '吴婷', name: '抖音创作者成长AI画像平台', amount: 500000, finalStage: 'opportunity', startDaysAgo: 9, status: 'normal' },
      { emp: '徐伟', name: '百威啤酒智能库存推荐系统', amount: 1150000, finalStage: 'bidding', startDaysAgo: 17, status: 'normal' },
      { emp: '徐伟', name: '伊利集团奶站分发智能算法', amount: 700000, finalStage: 'prospective', startDaysAgo: 5, status: 'normal' },
      { emp: '朱莉', name: '华润万家新零售智能推荐一期', amount: 850000, finalStage: 'opportunity', startDaysAgo: 19, status: 'stagnant' }, // 停滞
      { emp: '朱莉', name: '华润置地智能楼宇运营系统', amount: 1200000, finalStage: 'prospective', startDaysAgo: 3, status: 'normal' },

      // 业务三部
      { emp: '何军', name: '华为手机消费者业务舆情分析', amount: 1700000, finalStage: 'collection', startDaysAgo: 30, status: 'normal' },
      { emp: '何军', name: '华为终端供应链协同分析大屏', amount: 900000, finalStage: 'bidding', startDaysAgo: 13, status: 'normal' },
      { emp: '郑勇', name: '联想集团全球制造供应链大盘', amount: 2400000, finalStage: 'bidding', startDaysAgo: 23, status: 'normal' }, // 超级大单
      { emp: '郑勇', name: '联想会员中心精准推荐升级', amount: 650000, finalStage: 'opportunity', startDaysAgo: 10, status: 'normal' },
      { emp: '高飞', name: '百度智能云Apollo自动驾驶展示', amount: 1350000, finalStage: 'opportunity', startDaysAgo: 20, status: 'normal' },
      { emp: '高飞', name: '百度网盘企业版AI搜索优化', amount: 850000, finalStage: 'prospective', startDaysAgo: 7, status: 'normal' },
      { emp: '林芳', name: '京东物流亚洲一号无人仓看板', amount: 1900000, finalStage: 'collection', startDaysAgo: 25, status: 'normal' },
      { emp: '林芳', name: '京东健康在线智能问诊系统', amount: 800000, finalStage: 'opportunity', startDaysAgo: 12, status: 'normal' },
      { emp: '马俊', name: '小米智能家居全屋定制设计推荐', amount: 1000000, finalStage: 'opportunity', startDaysAgo: 15, status: 'normal' },
      { emp: '马俊', name: '小米之家线下智能选址系统', amount: 550000, finalStage: 'prospective', startDaysAgo: 5, status: 'normal' },
      { emp: '梁晨', name: '顺丰控股无人机路径规划模拟', amount: 1250000, finalStage: 'bidding', startDaysAgo: 16, status: 'normal' },
      { emp: '梁晨', name: '顺丰速运AI智能客服语音助手', amount: 600000, finalStage: 'prospective', startDaysAgo: 4, status: 'normal' }
    ];

    const getEmpId = db.prepare('SELECT id FROM employees WHERE name = ?');
    const insertProj = db.prepare('INSERT INTO projects (name, amount, stage, employee_id, status, last_updated) VALUES (?, ?, ?, ?, ?, ?)');

    for (const proj of projectTemplates) {
      const empRow = getEmpId.get(proj.emp);
      insertProj.run(proj.name, proj.amount, proj.finalStage, empRow.id, proj.status, '2026-05-25');
    }
    console.log(`✅ 成功导入 ${projectTemplates.length} 个活跃项目明细！`);

    // 8. 模拟 30 天的历史日报
    console.log('⏳ 正在生成 30 天的历史日报与统计指标（请稍候）...');
    const reportTemplates = [
      "今日主要跟进 ${projectName}。当前项目处于 ${stageName} 阶段，今天与对方业务线负责人进行了半小时的电话沟通，详细介绍了我们的技术方案，对方表示认可，但也提出了对安全性的担忧。已约好本周五进行安全专题汇报。另外，今天还电话维系了 ${clientCount} 家客户，主要发掘潜在需求。",
      "今天现场拜访了 ${projectName} 的核心干系人，项目金额大概 ${amount} 万。我们在现场进行了系统 Demo 演示，演示效果非常好，达到了预期。目前处于 ${stageName} 阶段，对方正在组织内部预算审批。今日一共联系了 ${clientCount} 家客户，拿到 ${leadCount} 个新线索。",
      "今日主要精力放在商务和技术方案编写上。${projectName}（金额 ${amount} 万）目前处于 ${stageName} 阶段，今天和我们的研发团队就方案细节进行了对齐，排除了几个架构设计盲点。今天拜访了 ${visitCount} 次客户，持续推进销售管线。",
      "今天重点处理 ${projectName}，目前在 ${stageName} 阶段。今天和客户采购进行了初步沟通，对方表达了对我们方案的一致看好，但对回款周期提出了要求，目前在正常推进。今天还顺便开拓了 ${leadCount} 个潜在商机线索，打了 ${clientCount} 个电话。"
    ];

    const insertMetric = db.prepare(`
      INSERT OR REPLACE INTO daily_metrics 
      (employee_id, date, clients_contacted, leads_generated, visits_conducted, prospective_projects, prospective_amount, opportunity_projects, bidding_signing_projects, collection_projects, raw_content) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let day = 29; day >= 0; day--) {
      const dateStr = getPastDateString(day);
      const dateObj = new Date(dateStr + 'T12:00:00');
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      for (const emp of employees) {
        const empRow = getEmpId.get(emp.name);
        
        // 故意让李娜、孙超、高飞三人没有今天（day === 0）的日报，用来测试 check-missing 定时催交
        if (day === 0 && (emp.name === '孙超' || emp.name === '高飞' || emp.name === '李娜')) {
          continue; 
        }

        // 周末 5% 概率，工作日 92% 概率
        const submitThreshold = isWeekend ? 0.05 : 0.92;
        if (Math.random() > submitThreshold) {
          continue; 
        }

        const myProjects = projectTemplates.filter(p => p.emp === emp.name);
        let prospective_projects = 0;
        let prospective_amount = 0.0;
        let opportunity_projects = 0;
        let bidding_signing_projects = 0;
        let collection_projects = 0;
        let activeProjToday = null;

        for (const p of myProjects) {
          // 项目在 startDaysAgo 天前建立，并在剩余天数中分段前移
          const daysSinceCreation = (29 - day) - (29 - p.startDaysAgo);
          if (daysSinceCreation < 0) {
            continue; 
          }

          let currentStage = 'prospective';
          if (p.finalStage === 'prospective') {
            currentStage = 'prospective';
          } else if (p.finalStage === 'opportunity') {
            currentStage = daysSinceCreation > 5 ? 'opportunity' : 'prospective';
          } else if (p.finalStage === 'bidding') {
            if (daysSinceCreation > 12) currentStage = 'bidding';
            else if (daysSinceCreation > 5) currentStage = 'opportunity';
            else currentStage = 'prospective';
          } else if (p.finalStage === 'collection') {
            if (daysSinceCreation > 18) currentStage = 'collection';
            else if (daysSinceCreation > 10) currentStage = 'bidding';
            else if (daysSinceCreation > 4) currentStage = 'opportunity';
            else currentStage = 'prospective';
          }

          if (currentStage === 'prospective') {
            prospective_projects++;
            prospective_amount += p.amount;
          } else if (currentStage === 'opportunity') {
            opportunity_projects++;
          } else if (currentStage === 'bidding') {
            bidding_signing_projects++;
          } else if (currentStage === 'collection') {
            collection_projects++;
          }

          if (!activeProjToday || Math.random() > 0.5) {
            activeProjToday = { ...p, currentStage };
          }
        }

        const clients_contacted = isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 5) + 3;
        const leads_generated = isWeekend ? 0 : Math.floor(Math.random() * 2);
        const visits_conducted = isWeekend ? 0 : Math.floor(Math.random() * 2) + (Math.random() > 0.7 ? 1 : 0);

        let raw_content = '';
        if (activeProjToday) {
          const stageNameMap = { prospective: '意向推进', opportunity: '商机立项', bidding: '方案招标/签约', collection: '回款跟进' };
          const template = reportTemplates[Math.floor(Math.random() * reportTemplates.length)];
          raw_content = template
            .replace(/\${projectName}/g, activeProjToday.name)
            .replace(/\${stageName}/g, stageNameMap[activeProjToday.currentStage])
            .replace(/\${amount}/g, Math.floor(activeProjToday.amount / 10000))
            .replace(/\${clientCount}/g, clients_contacted)
            .replace(/\${leadCount}/g, leads_generated)
            .replace(/\${visitCount}/g, visits_conducted);
        } else {
          raw_content = `今天主要是常规的客户开发工作。通过电话和邮件联系了 ${clients_contacted} 家潜在客户，其中大部分客户表示目前暂无新的采购预算，有 ${leads_generated} 家留下联系方式，后续会继续跟进，寻找合适的 ToB 软件业务契机。`;
        }

        insertMetric.run(
          empRow.id,
          dateStr,
          clients_contacted,
          leads_generated,
          visits_conducted,
          prospective_projects,
          prospective_amount,
          opportunity_projects,
          bidding_signing_projects,
          collection_projects,
          raw_content
        );
      }
    }

    console.log('✅ 30 天高仿真日报与统计指标数据生成成功！');
    console.log('✨ 谛听 (Diting) 数据种子导入圆满完成，数据库随时可供查询！');

  } catch (error) {
    console.error('❌ 导入数据时发生错误:', error);
  }
}

seed();

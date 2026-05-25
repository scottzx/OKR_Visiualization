import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Target, AlertTriangle, Clock, 
  Send, User, BarChart2, Briefcase, FileText, ChevronRight,
  TrendingDown, CheckCircle2, DollarSign, Activity, RefreshCw, X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

export default function App() {
  // 过滤与视图状态
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dateFilter, setDateFilter] = useState('year'); // day, week, quarter, year
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, kanban, alerts
  
  // 接口数据状态
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState({ missingEmployees: [], stagnantProjects: [], riskProjects: [] });
  
  // 个人下钻弹窗状态
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [activeReportIndex, setActiveReportIndex] = useState(0);
  
  // UI 辅助状态
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 动态时钟效果
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取基础字典数据 (部门和员工)
  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error('获取部门字典失败:', err));

    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error('获取员工字典失败:', err));
  }, []);

  // 当过滤条件发生改变时，刷新大盘数据
  const refreshData = () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      departmentId,
      employeeId,
      dateFilter
    }).toString();

    const fetchOverview = fetch(`/api/overview?${queryParams}`).then(res => res.json());
    const fetchFunnel = fetch(`/api/funnel?${queryParams}`).then(res => res.json());
    const fetchProjects = fetch(`/api/projects?${queryParams}`).then(res => res.json());
    const fetchLeaderboard = fetch(`/api/leaderboard?departmentId=${departmentId}`).then(res => res.json());
    const fetchTrends = fetch(`/api/trends?${queryParams}`).then(res => res.json());
    const fetchAlerts = fetch('/api/alerts').then(res => res.json());

    Promise.all([fetchOverview, fetchFunnel, fetchProjects, fetchLeaderboard, fetchTrends, fetchAlerts])
      .then(([overviewData, funnelData, projectsData, leaderboardData, trendsData, alertsData]) => {
        setOverview(overviewData);
        setFunnel(funnelData);
        setProjects(projectsData);
        setLeaderboard(leaderboardData);
        setTrends(trendsData);
        setAlerts(alertsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取大盘接口失败:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshData();
  }, [departmentId, employeeId, dateFilter]);

  // 当选择特定员工下钻时，获取员工专属画像和原始日报归档
  useEffect(() => {
    if (selectedEmployeeId) {
      fetch(`/api/employee/${selectedEmployeeId}`)
        .then(res => res.json())
        .then(data => {
          setEmployeeDetail(data);
          setActiveReportIndex(0); // 默认选中最新的一篇日报
        })
        .catch(err => console.error('获取员工画像失败:', err));
    } else {
      setEmployeeDetail(null);
    }
  }, [selectedEmployeeId]);

  // 飞书催交与提醒模拟动作
  const triggerFeishuPing = (name, reason, type = 'daily') => {
    fetch('/api/ping-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: name,
        reason: type === 'daily' 
          ? `今日日报尚未提交，请及时处理。` 
          : `项目 [${reason}] 已超期未更新，存在进度失焦风险，请及时跟进。`
      })
    })
      .then(res => res.json())
      .then(data => {
        showToast(`💬 已通过飞书向 [${name}] 发送催交提醒！`);
        // 催交成功后，从本轮告警未交列表中移出，增强大屏操作反馈感
        if (type === 'daily') {
          setAlerts(prev => ({
            ...prev,
            missingEmployees: prev.missingEmployees.filter(e => e.name !== name)
          }));
        }
      })
      .catch(err => console.error('飞书催交失败:', err));
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // 格式化金额 (把元转为万元并保留0位小数)
  const formatMoney = (val) => {
    if (val === undefined || val === null) return '0';
    return (Number(val) / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  };

  return (
    <div className="dashboard-container">
      {/* 消息弹出气泡 (Toast) */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 999,
          background: 'rgba(13, 17, 39, 0.9)', border: '1px solid rgba(251, 191, 36, 0.4)',
          borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
          boxShadow: '0 0 24px rgba(251, 191, 36, 0.25)', animation: 'slideIn 0.3s ease forwards',
          color: '#fbbf24', fontSize: '0.9rem', fontWeight: '500', backdropFilter: 'blur(12px)'
        }}>
          <Send size={16} />
          {toast}
        </div>
      )}

      {/* ==========================================
          HEADER SECTION (大屏标题栏)
          ========================================== */}
      <header className="dashboard-header slide-in">
        <div className="header-title-box">
          <h1>谛听 <span style={{ fontFamily: 'sans-serif', fontSize: '1.8rem', fontWeight: '300' }}>DITING</span></h1>
          <div className="header-slogan">
            <span className="neon-dot" style={{ backgroundColor: '#fbbf24' }}></span>
            不用人盯的运营，不会跑偏的战略
          </div>
        </div>

        {/* 顶部中央多维过滤器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* 时间过滤器 */}
          <div style={{ display: 'flex', gap: '0.25rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem' }}>
            <button className={`glass-btn ${dateFilter === 'day' ? 'active' : ''}`} onClick={() => { setDateFilter('day'); setEmployeeId(''); }}>本日</button>
            <button className={`glass-btn ${dateFilter === 'week' ? 'active' : ''}`} onClick={() => { setDateFilter('week'); setEmployeeId(''); }}>本周</button>
            <button className={`glass-btn ${dateFilter === 'quarter' ? 'active' : ''}`} onClick={() => { setDateFilter('quarter'); setEmployeeId(''); }}>本季</button>
            <button className={`glass-btn ${dateFilter === 'year' ? 'active' : ''}`} onClick={() => { setDateFilter('year'); setEmployeeId(''); }}>全年</button>
          </div>

          {/* 部门筛选器 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={departmentId} 
              onChange={(e) => { setDepartmentId(e.target.value); setEmployeeId(''); }}
              style={{
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1', borderRadius: '8px', padding: '0.35rem 1rem', fontSize: '0.85rem',
                outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">全公司大盘</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* 员工快速筛选 */}
            <select 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1', borderRadius: '8px', padding: '0.35rem 1rem', fontSize: '0.85rem',
                outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">全体员工</option>
              {employees
                .filter(e => !departmentId || e.department_id === Number(departmentId))
                .map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.department_name.substring(2)})</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* 右侧数字时钟 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'Outfit, sans-serif' }}>
          <Clock size={16} className="neon-dot" style={{ color: '#06b6d4', width: 'auto', height: 'auto' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f1f5f9' }}>
              {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>
              {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          TABS NAVIGATION (视图选择)
          ========================================== */}
      <div className="slide-in" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button 
          className={`glass-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', borderRadius: '12px' }}
        >
          <BarChart2 size={16} />
          📊 战略运营总盘
        </button>
        <button 
          className={`glass-btn ${activeTab === 'kanban' ? 'active' : ''}`} 
          onClick={() => setActiveTab('kanban')}
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', borderRadius: '12px' }}
        >
          <Briefcase size={16} />
          📋 MTL 项目看板 ({projects.length})
        </button>
        <button 
          className={`glass-btn ${activeTab === 'alerts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('alerts')}
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem', borderRadius: '12px', borderLeftColor: alerts.missingEmployees.length > 0 ? 'rgba(244,63,94,0.4)' : '' }}
        >
          <AlertTriangle size={16} style={{ color: alerts.missingEmployees.length > 0 ? '#f43f5e' : '' }} />
          ⚠️ 运营异常与告警
          {alerts.missingEmployees.length > 0 && (
            <span style={{ background: '#f43f5e', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>
              {alerts.missingEmployees.length}
            </span>
          )}
        </button>

        <button 
          className="glass-btn" 
          onClick={refreshData}
          style={{ marginLeft: 'auto', padding: '0.5rem', borderRadius: '12px' }}
          title="刷新大盘"
        >
          <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '1rem' }}>
          <RefreshCw size={36} className="spin-slow" style={{ color: '#fbbf24' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>正在从 SQLite 同步大盘指标...</div>
        </div>
      )}

      {/* ==========================================
          TAB 1: STRATEGIC OVERVIEW (战略运营总盘)
          ========================================== */}
      {!loading && activeTab === 'dashboard' && overview && (
        <div className="dashboard-grid slide-in">
          
          {/* A. OKR 四大核心 KPI 卡片 */}
          {/* KPI 1: 年度总目标业绩进度 */}
          <div className="glass-card glow-card-gold" style={{ gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>年度业绩总目标</div>
              <Target size={18} style={{ color: '#fbbf24' }} />
            </div>
            <div className="font-outfit" style={{ fontSize: '2rem', fontWeight: '700', color: '#f1f5f9', margin: '0.5rem 0 0.2rem 0' }}>
              ¥ {formatMoney(overview.totalTarget)} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.4)' }}>万</span>
            </div>
            {/* 炫酷进度条 */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>
                <span>战略签单进度</span>
                <span className="font-outfit" style={{ color: '#fbbf24', fontWeight: '600' }}>{overview.completionRate.toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(overview.completionRate, 100)}%`, background: 'linear-gradient(90deg, #d97706, #fbbf24)', borderRadius: '3px', boxShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}></div>
              </div>
            </div>
          </div>

          {/* KPI 2: 已签约额 (MTL 招签 & 回款总额) */}
          <div className="glass-card glow-card-cyan" style={{ gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>已签约销售额 (MTL)</div>
              <CheckCircle2 size={18} style={{ color: '#06b6d4' }} />
            </div>
            <div className="font-outfit" style={{ fontSize: '2rem', fontWeight: '700', color: '#06b6d4', margin: '0.5rem 0 0.2rem 0' }}>
              ¥ {formatMoney(overview.signedAmount)} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.4)' }}>万</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '1.2rem' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span>本期漏斗转化率健康</span>
            </div>
          </div>

          {/* KPI 3: 已收回款额 */}
          <div className="glass-card glow-card-collection" style={{ gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>已收财务回款</div>
              <DollarSign size={18} style={{ color: '#10b981' }} />
            </div>
            <div className="font-outfit" style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', margin: '0.5rem 0 0.2rem 0' }}>
              ¥ {formatMoney(overview.collectedAmount)} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.4)' }}>万</span>
            </div>
            {/* 回款占比 */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem' }}>
                <span>回款到账率</span>
                <span className="font-outfit" style={{ color: '#10b981', fontWeight: '600' }}>{overview.collectionRate.toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(overview.collectionRate, 100)}%`, background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: '3px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></div>
              </div>
            </div>
          </div>

          {/* KPI 4: 蓄水管线池 (意向 + 商机在跟) */}
          <div className="glass-card" style={{ gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>未来蓄水销售管线</div>
              <Activity size={18} style={{ color: '#a855f7' }} />
            </div>
            <div className="font-outfit" style={{ fontSize: '2rem', fontWeight: '700', color: '#a855f7', margin: '0.5rem 0 0.2rem 0' }}>
              ¥ {formatMoney(overview.prospectiveAmount + overview.opportunityAmount)} <span style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.4)' }}>万</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', marginTop: '1.2rem' }}>
              <span>意向 ¥{formatMoney(overview.prospectiveAmount)}万</span>
              <span>商机 ¥{formatMoney(overview.opportunityAmount)}万</span>
            </div>
          </div>

          {/* B. 大屏左侧：折线/面积增长走势图 (30 天累计业绩爬坡图) */}
          <div className="glass-card" style={{ gridColumn: 'span 7' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: '#fbbf24' }} />
              过去30天销售签约与回款累计演进曲线
            </h2>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSigned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(val) => `¥${formatMoney(val)}万`} 
                  />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(13, 17, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(val) => [`¥${(Number(val)/10000).toFixed(0)}万`, '']}
                  />
                  <Area type="monotone" name="已签约销售额" dataKey="signed" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSigned)" />
                  <Area type="monotone" name="已回款到账额" dataKey="collected" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* C. 大屏右侧：MTL 营销漏斗图 (横向 BarChart 自定义样式) */}
          <div className="glass-card" style={{ gridColumn: 'span 5' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} style={{ color: '#06b6d4' }} />
              MTL 营销销售漏斗与全链条转换率
            </h2>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.5)" 
                    fontSize={10.5} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(13, 17, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value) => [value, '数量/次数']}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {funnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* D. 底部左侧：员工绩效龙虎榜 (8 cols) */}
          <div className="glass-card" style={{ gridColumn: 'span 8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} style={{ color: '#fbbf24' }} />
                本期销售经理与业务顾问绩效龙虎榜
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>点击员工姓名可钻取 360° 画像及最原始日报文本</span>
            </div>
            
            <div className="leaderboard-list">
              {leaderboard.map((emp, index) => {
                const rate = emp.annual_target > 0 ? (emp.signed_amount / emp.annual_target) * 100 : 0;
                return (
                  <div 
                    key={emp.id} 
                    className="leaderboard-item"
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  >
                    <div className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </div>
                    
                    <div style={{ width: '80px', fontWeight: '600' }}>{emp.name}</div>
                    <div style={{ width: '100px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{emp.department_name}</div>
                    
                    {/* 30天过程活动指标 */}
                    <div style={{ display: 'flex', gap: '1rem', width: '180px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#06b6d4' }}>📞 {emp.reports_submitted * 5} 接触</span>
                      <span style={{ color: '#fbbf24' }}>🤝 {emp.visits_30_days} 拜访</span>
                    </div>

                    {/* OKR 完成进度度量 */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                      <div style={{ width: '90px', textAlign: 'right', fontSize: '0.8rem' }}>
                        <span className="font-outfit" style={{ fontWeight: '600', color: rate >= 100 ? '#10b981' : rate >= 50 ? '#fbbf24' : '#f43f5e' }}>
                          {rate.toFixed(1)}%
                        </span>
                      </div>
                      {/* 微型进度条 */}
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${Math.min(rate, 100)}%`, 
                            background: rate >= 100 
                              ? 'linear-gradient(90deg, #059669, #10b981)' 
                              : 'linear-gradient(90deg, #d97706, #fbbf24)', 
                            borderRadius: '2px' 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="font-outfit" style={{ width: '120px', textAlign: 'right', fontWeight: '600' }}>
                      ¥{formatMoney(emp.signed_amount)}万 <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'rgba(255,255,255,0.3)' }}>/ {formatMoney(emp.annual_target)}万</span>
                    </div>
                    
                    <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '0.5rem' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* E. 底部右侧：运营异常与催收大盘 (4 cols) */}
          <div className="glass-card glow-card-gold" style={{ gridColumn: 'span 4' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
              DITING 实时运营诊断与催收督导
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* 今日未提交日报警告 */}
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: '#f43f5e', marginBottom: '0.5rem' }}>
                  <span>今日漏交日报人员</span>
                  <span>{alerts.missingEmployees.length} 人</span>
                </div>
                
                {alerts.missingEmployees.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.4rem 0' }}>🎉 今日全员日报已收齐，运营大盘已更新</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {alerts.missingEmployees.slice(0, 4).map(emp => (
                      <span 
                        key={emp.id} 
                        onClick={() => triggerFeishuPing(emp.name, 'daily')}
                        style={{
                          fontSize: '0.72rem', background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185',
                          padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex',
                          alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(244, 63, 94, 0.2)'
                        }}
                        title="点击一键发送飞书催交"
                      >
                        {emp.name}
                        <Send size={10} />
                      </span>
                    ))}
                    {alerts.missingEmployees.length > 4 && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', padding: '0.2rem 0.2rem' }}>等...</span>
                    )}
                  </div>
                )}
              </div>

              {/* 停滞项目警示 */}
              <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.5rem' }}>
                  <span>超7天没有跟进停滞项目</span>
                  <span>{alerts.stagnantProjects.length} 个</span>
                </div>
                
                {alerts.stagnantProjects.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.4rem 0' }}>所有跟进项目均处于健康活动状态</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {alerts.stagnantProjects.slice(0, 3).map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#e2e8f0' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>⚠️ {p.name}</span>
                        <span 
                          onClick={() => triggerFeishuPing(p.employee_name, p.name, 'stagnant')}
                          style={{ color: '#fbbf24', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          催促{p.employee_name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 战略对齐建议 */}
              <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.1)', borderRadius: '12px', padding: '0.85rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
                <strong style={{ color: '#06b6d4', display: 'block', marginBottom: '0.2rem' }}>💡 战略AI运营纠偏小贴士：</strong>
                当前大盘年度目标完成率达 <span style={{ color: '#fbbf24' }}>{(overview.completionRate).toFixed(1)}%</span>。建议对一部负责的<strong>大单进行重点盯防</strong>，回款到账率达 <span style={{ color: '#10b981' }}>{(overview.collectionRate).toFixed(1)}%</span>，可针对停滞项目进行排兵布阵。
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==========================================
          TAB 2: KANBAN BOARD (MTL 项目看板列)
          ========================================== */}
      {!loading && activeTab === 'kanban' && (
        <div className="glass-card slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>MTL 四阶段项目跟踪与风险矩阵</h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                通过日报实时推移项目，一键看清所有停滞与丢单风险点
              </p>
            </div>
            
            {/* 看板顶部分组说明 */}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span className="neon-dot" style={{ backgroundColor: '#10b981', width: '6px', height: '6px' }}></span> 正常活跃</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span className="neon-dot" style={{ backgroundColor: '#fbbf24', width: '6px', height: '6px' }}></span> 进度停滞</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span className="neon-dot" style={{ backgroundColor: '#f43f5e', width: '6px', height: '6px' }}></span> 高危防丢</span>
            </div>
          </div>

          <div className="kanban-columns">
            {/* 阶段 1: 意向推进 (Prospective) */}
            <div className="kanban-column">
              <div className="kanban-column-header" style={{ borderBottom: '2.5px solid #38bdf8', color: '#38bdf8' }}>
                <span>1. 意向推进</span>
                <span>{projects.filter(p => p.stage === 'prospective').length}</span>
              </div>
              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {projects.filter(p => p.stage === 'prospective').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>暂无意向项目</div>
                ) : (
                  projects.filter(p => p.stage === 'prospective').map(p => (
                    <KanbanCard key={p.id} project={p} onOpenDetail={setSelectedEmployeeId} onFeishuRemind={triggerFeishuPing} />
                  ))
                )}
              </div>
            </div>

            {/* 阶段 2: 商机立项 (Opportunity) */}
            <div className="kanban-column">
              <div className="kanban-column-header" style={{ borderBottom: '2.5px solid #a855f7', color: '#a855f7' }}>
                <span>2. 商机立项</span>
                <span>{projects.filter(p => p.stage === 'opportunity').length}</span>
              </div>
              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {projects.filter(p => p.stage === 'opportunity').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>暂无商机项目</div>
                ) : (
                  projects.filter(p => p.stage === 'opportunity').map(p => (
                    <KanbanCard key={p.id} project={p} onOpenDetail={setSelectedEmployeeId} onFeishuRemind={triggerFeishuPing} />
                  ))
                )}
              </div>
            </div>

            {/* 阶段 3: 方案招标/签约 (Bidding) */}
            <div className="kanban-column">
              <div className="kanban-column-header" style={{ borderBottom: '2.5px solid #f43f5e', color: '#f43f5e' }}>
                <span>3. 方案招标签约</span>
                <span>{projects.filter(p => p.stage === 'bidding').length}</span>
              </div>
              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {projects.filter(p => p.stage === 'bidding').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>暂无招签项目</div>
                ) : (
                  projects.filter(p => p.stage === 'bidding').map(p => (
                    <KanbanCard key={p.id} project={p} onOpenDetail={setSelectedEmployeeId} onFeishuRemind={triggerFeishuPing} />
                  ))
                )}
              </div>
            </div>

            {/* 阶段 4: 回款跟进 (Collection) */}
            <div className="kanban-column">
              <div className="kanban-column-header" style={{ borderBottom: '2.5px solid #10b981', color: '#10b981' }}>
                <span>4. 回款跟进结案</span>
                <span>{projects.filter(p => p.stage === 'collection').length}</span>
              </div>
              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
                {projects.filter(p => p.stage === 'collection').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>暂无回款中项目</div>
                ) : (
                  projects.filter(p => p.stage === 'collection').map(p => (
                    <KanbanCard key={p.id} project={p} onOpenDetail={setSelectedEmployeeId} onFeishuRemind={triggerFeishuPing} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: ALERTS DIAGNOSTICS (运营告警诊断)
          ========================================== */}
      {!loading && activeTab === 'alerts' && (
        <div className="dashboard-grid slide-in">
          
          {/* 左侧：今日漏交日报人员与一键催收 */}
          <div className="glass-card glow-card-gold" style={{ gridColumn: 'span 6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} />
                今日（2026-05-25）未提交日报漏斗督导
              </h2>
              <span style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: '8px' }}>
                漏交 {alerts.missingEmployees.length} 人
              </span>
            </div>

            {alerts.missingEmployees.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '0.5rem' }}>
                <CheckCircle2 size={36} style={{ color: '#10b981' }} />
                <div style={{ color: '#10b981', fontWeight: '600' }}>运营数据全部收齐</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>今天全员均按时通过飞书上传了业务数据</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.missingEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      padding: '0.75rem 1rem', borderRadius: '10px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{emp.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '1rem' }}>{emp.department}</span>
                    </div>
                    <button 
                      onClick={() => triggerFeishuPing(emp.name, 'daily')}
                      className="glass-btn" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                    >
                      <Send size={12} />
                      飞书催交
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：超期停滞与丢单风险项目矩阵 */}
          <div className="glass-card" style={{ gridColumn: 'span 6' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              管线停滞与丢单风险合同矩阵 ({alerts.stagnantProjects.length + alerts.riskProjects.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 高危风险项目 */}
              <div>
                <div style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: '600', marginBottom: '0.5rem' }}>🚨 丢单/烂尾高危项目 (需介入盯防)</div>
                {alerts.riskProjects.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', padding: '0.5rem' }}>暂无高危标记项目</div>
                ) : (
                  alerts.riskProjects.map(p => (
                    <div 
                      key={p.id}
                      style={{
                        background: 'rgba(244, 63, 94, 0.03)', border: '1px solid rgba(244, 63, 94, 0.12)',
                        padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem'
                      }}
                    >
                      <span>{p.name} (¥{formatMoney(p.amount)}万)</span>
                      <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>负责人: {p.employee_name}</span>
                        <span 
                          onClick={() => triggerFeishuPing(p.employee_name, p.name, 'stagnant')}
                          style={{ color: '#fb7185', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          飞书施压
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* 停滞跟进项目 */}
              <div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600', marginBottom: '0.5rem' }}>⏳ 进度超期停滞项目 (需督导回款/签约)</div>
                {alerts.stagnantProjects.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', padding: '0.5rem' }}>暂无长期停滞项目</div>
                ) : (
                  alerts.stagnantProjects.map(p => (
                    <div 
                      key={p.id}
                      style={{
                        background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.12)',
                        padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem'
                      }}
                    >
                      <span>{p.name} (¥{formatMoney(p.amount)}万)</span>
                      <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>负责人: {p.employee_name}</span>
                        <span 
                          onClick={() => triggerFeishuPing(p.employee_name, p.name, 'stagnant')}
                          style={{ color: '#fbbf24', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          督促更新
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EMPLOYEE DRILL-DOWN (员工360°个人大盘下钻)
          ========================================== */}
      {selectedEmployeeId && employeeDetail && (
        <div className="modal-overlay" onClick={() => setSelectedEmployeeId(null)}>
          <div className="modal-content glass-card glow-card-gold" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9' }}>{employeeDetail.info.name}</h2>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                    {employeeDetail.info.department_name}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                  邮箱/拼音: {employeeDetail.info.pinyin}@diting-tech.com | OKR个人年度签单目标: ¥{formatMoney(employeeDetail.info.annual_target)}万
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployeeId(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Left and Right Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
              
              {/* Left Column (5 cols): OKR Completion & Projects list */}
              <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 个人指标卡 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>OKR 个人签约业绩进度</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: '700', color: '#fbbf24' }}>
                      ¥{formatMoney(employeeDetail.summary.signedAmount)}万
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                      完成度 {((employeeDetail.summary.signedAmount / employeeDetail.info.annual_target) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* 微型进度条 */}
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '0.65rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((employeeDetail.summary.signedAmount / employeeDetail.info.annual_target) * 100, 100)}%`, background: 'var(--primary-gold)', borderRadius: '3px' }}></div>
                  </div>

                  {/* 30天过程指标统计 */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>30天接触客户</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#06b6d4', marginTop: '0.2rem' }}>{employeeDetail.summary.totalClients} <span style={{ fontSize: '0.75rem', fontWeight: '400' }}>人</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>30天生成线索</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fbbf24', marginTop: '0.2rem' }}>{employeeDetail.summary.totalLeads} <span style={{ fontSize: '0.75rem', fontWeight: '400' }}>个</span></div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>30天现场拜访</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981', marginTop: '0.2rem' }}>{employeeDetail.summary.totalVisits} <span style={{ fontSize: '0.75rem', fontWeight: '400' }}>次</span></div>
                    </div>
                  </div>
                </div>

                {/* 个人名下活跃项目列表 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#cbd5e1' }}>个人活跃管线项目 ({employeeDetail.projects.length})</div>
                  
                  <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                    {employeeDetail.projects.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>暂无管线合同</div>
                    ) : (
                      employeeDetail.projects.map(p => {
                        const stageMap = { prospective: '意向', opportunity: '商机', bidding: '签约', collection: '回款' };
                        return (
                          <div key={p.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.65rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={p.name}>💼 {p.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '600', color: '#cbd5e1' }}>¥{formatMoney(p.amount)}万</span>
                              <span style={{
                                fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px',
                                background: p.stage === 'collection' ? 'rgba(16,185,129,0.15)' : p.stage === 'bidding' ? 'rgba(244,63,94,0.15)' : 'rgba(255,255,255,0.06)',
                                color: p.stage === 'collection' ? '#10b981' : p.stage === 'bidding' ? '#f43f5e' : '#94a3b8'
                              }}>
                                {stageMap[p.stage]}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Historical Daily Reports & Raw text Traceability */}
              <div style={{ gridColumn: 'span 7', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', height: '480px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} style={{ color: '#06b6d4' }} />
                  AI 提取之前的最原始非结构化日报文本回溯
                </h3>

                {employeeDetail.dailyReports.length === 0 ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                    该员工近期暂无提交日报记录
                  </div>
                ) : (
                  <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
                    
                    {/* 左侧日期选择轨 */}
                    <div style={{ width: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderRight: '1px solid rgba(255,255,255,0.04)', paddingRight: '0.5rem' }}>
                      {employeeDetail.dailyReports.map((report, idx) => (
                        <button
                          key={report.date}
                          onClick={() => setActiveReportIndex(idx)}
                          style={{
                            background: activeReportIndex === idx ? 'rgba(6, 182, 212, 0.15)' : 'none',
                            border: '1px solid',
                            borderColor: activeReportIndex === idx ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
                            color: activeReportIndex === idx ? '#06b6d4' : 'rgba(255,255,255,0.4)',
                            fontSize: '0.75rem', padding: '0.35rem 0.5rem', borderRadius: '6px', textAlign: 'left',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {report.date}
                        </button>
                      ))}
                    </div>

                    {/* 右侧日报文本归档 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingLeft: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                        <span>汇报时间: {employeeDetail.dailyReports[activeReportIndex].created_at}</span>
                      </div>
                      
                      {/* 结构化过程指标快照 */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#06b6d4' }}>📞 接触客户 {employeeDetail.dailyReports[activeReportIndex].clients_contacted} 家</span>
                        <span style={{ color: '#fbbf24' }}>🤝 现场拜访 {employeeDetail.dailyReports[activeReportIndex].visits_conducted} 次</span>
                        <span style={{ color: '#10b981' }}>📝 录入线索 {employeeDetail.dailyReports[activeReportIndex].leads_generated} 个</span>
                      </div>

                      {/* 原始非结构化文本 */}
                      <div style={{ 
                        flex: 1, padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.82rem', lineHeight: '1.6',
                        color: '#cbd5e1', whiteSpace: 'pre-line', overflowY: 'auto'
                      }}>
                        {employeeDetail.dailyReports[activeReportIndex].raw_content}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="neon-dot" style={{ backgroundColor: '#10b981', width: '4px', height: '4px' }}></span>
                        经“谛听”人工智能语义引擎解析，此段非结构化数据已安全进行结构化解耦与指标沉淀。
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 辅助组件: 看板卡片 (KanbanCard)
function KanbanCard({ project, onOpenDetail, onFeishuRemind }) {
  const statusColorMap = {
    normal: '#10b981',
    stagnant: '#fbbf24',
    risk: '#f43f5e'
  };

  const statusTextMap = {
    normal: '正常活跃',
    stagnant: '超期停滞',
    risk: '高危流失'
  };

  return (
    <div 
      className="project-card" 
      onClick={() => onOpenDetail(project.id)}
      style={{
        borderLeft: `3px solid ${statusColorMap[project.status]}`,
        animation: 'slideIn 0.3s ease forwards'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }} title={project.name}>
          {project.name}
        </span>
        <span className={`project-badge badge-${project.status}`}>
          {statusTextMap[project.status]}
        </span>
      </div>

      <div className="project-card-amount font-outfit" style={{ color: statusColorMap[project.status] }}>
        ¥{(project.amount / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 })}<span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'rgba(255,255,255,0.4)', marginLeft: '1px' }}>万</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
        <span>负责人: <strong style={{ color: '#e2e8f0' }}>{project.employee_name}</strong></span>
        <span>更新于: {project.last_updated.substring(5)}</span>
      </div>

      {project.status !== 'normal' && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onFeishuRemind(project.employee_name, project.name, project.status);
          }}
          style={{
            position: 'absolute', bottom: '6px', right: '8px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 6px',
            fontSize: '0.65rem', color: statusColorMap[project.status], cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '2px'
          }}
        >
          <Send size={8} />
          督办
        </button>
      )}
    </div>
  );
}

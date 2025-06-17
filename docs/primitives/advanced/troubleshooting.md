# 原语组件高级故障排除指南

本文档提供了原语组件系统的高级故障排除技巧，重点介绍策引平台提供的信号分析工具和数据分析方法。通过这些工具，您可以深度分析策略信号，诊断问题并优化策略配置。

## 策引信号分析工具

策引平台提供了强大的在线信号分析功能，让您可以深度分析组合策略的交易信号数据库。

### 访问信号分析工具

1. **在线分析页面**：登录策引平台后，访问 **我的页面 → 我的策略组合 → 分析诊断 → 信号分析**
2. **信号分析手册**：访问 [信号分析查询手册](https://www.myinvestpilot.com/help/signal-analysis/) 获取详细的SQL查询示例
3. **数据库下载**：如果在线分析页面出现404错误，可以直接下载SQLite数据库进行本地分析

### 下载策略信号数据库

当在线分析工具不可用时，您可以直接下载SQLite数据库文件：

```
https://api.myinvestpilot.com/strategy_portfolio/portfolios/signals/[您的组合ID]
```

**使用步骤**：
1. 确保已登录策引平台
2. 将URL中的 `[您的组合ID]` 替换为实际的组合ID（如：`myinvestpilot_us_3_a`）
3. 在浏览器中访问该URL即可下载SQLite数据库文件

**示例**：
```
https://api.myinvestpilot.com/strategy_portfolio/portfolios/signals/myinvestpilot_us_3_a
```

## 信号分析SQL查询手册

以下是策引平台提供的专业SQL查询，用于诊断策略信号的质量和合理性。

### 数据表结构说明

- **主数据表**: `trade_signals` - 包含所有交易信号数据
- **信号类型**: 
  - `B` (Buy/买入)
  - `S` (Sell/卖出) 
  - `H` (Hold/持有)
  - `E` (Empty/空仓)
- **主要字段**: `date`(日期)、`symbol`(股票代码)、`signal`(信号类型)

### 1. 信号健康检查

快速诊断数据质量，检查数据完整性、记录数量、时间范围和信号有效性：

```sql
-- 信号数据健康检查
WITH health_metrics AS (
    SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT symbol) as symbol_count,
        COUNT(DISTINCT date) as date_count,
        MIN(date) as start_date,
        MAX(date) as end_date,
        COUNT(CASE WHEN signal NOT IN ('B','S','H','E') OR signal IS NULL THEN 1 END) as invalid_signals
    FROM trade_signals
)
SELECT
    '数据规模' as check_item,
    total_records || ' records, ' || symbol_count || ' symbols' as result,
    CASE WHEN total_records > 0 THEN '✅ 正常' ELSE '❌ 无数据' END as status
FROM health_metrics
UNION ALL
SELECT
    '时间范围',
    start_date || ' to ' || end_date || ' (' || date_count || ' days)',
    CASE WHEN date_count > 0 THEN '✅ 正常' ELSE '❌ 无数据' END
FROM health_metrics
UNION ALL
SELECT
    '信号有效性',
    CASE WHEN invalid_signals = 0 THEN 'All signals are valid (B/S/H/E)'
         ELSE invalid_signals || ' invalid signals found' END,
    CASE WHEN invalid_signals = 0 THEN '✅ 正常' ELSE '❌ 发现无效信号' END
FROM health_metrics;
```

### 2. 信号切换逻辑检查

检测不符合交易逻辑的信号切换，识别异常的买卖时机：

**正常切换逻辑**：
- 标准流程: `E → B → H → S → E`
- 定投场景: `H → B` (继续加仓)
- 必须卖出: `H → E` 必须经过 `S`

```sql
-- 信号切换逻辑验证
WITH signal_transitions AS (
    SELECT
        date,
        symbol,
        signal as current_signal,
        LAG(signal) OVER (PARTITION BY symbol ORDER BY date) as prev_signal
    FROM trade_signals
),
transition_analysis AS (
    SELECT
        prev_signal || ' → ' || current_signal as transition,
        COUNT(*) as count,
        CASE
            -- 异常切换
            WHEN prev_signal = 'H' AND current_signal = 'E' THEN '❌ 异常: 持有直接空仓(应经过卖出)'
            WHEN prev_signal = 'B' AND current_signal = 'S' THEN '❌ 异常: 买入直接卖出'
            WHEN prev_signal = 'E' AND current_signal = 'S' THEN '❌ 异常: 空仓时卖出'
            WHEN prev_signal = 'S' AND current_signal = 'B' THEN '❌ 异常: 卖出直接买入'
            -- 正常切换
            WHEN prev_signal = 'E' AND current_signal = 'B' THEN '✅ 正常: 空仓买入'
            WHEN prev_signal = 'B' AND current_signal = 'H' THEN '✅ 正常: 买入后持有'
            WHEN prev_signal = 'H' AND current_signal = 'S' THEN '✅ 正常: 持有后卖出'
            WHEN prev_signal = 'S' AND current_signal = 'E' THEN '✅ 正常: 卖出后空仓'
            WHEN prev_signal = 'H' AND current_signal = 'B' THEN '✅ 正常: 定投加仓'
            WHEN prev_signal = current_signal THEN '⚪ 无变化: 状态保持'
            ELSE '❓ 其他: ' || prev_signal || ' → ' || current_signal
        END as logic_check
    FROM signal_transitions
    WHERE prev_signal IS NOT NULL
    GROUP BY prev_signal, current_signal
)
SELECT
    transition,
    count,
    ROUND(count * 100.0 / (SELECT SUM(count) FROM transition_analysis), 2) as percentage,
    logic_check
FROM transition_analysis
WHERE count > 0
ORDER BY
    CASE WHEN logic_check LIKE '❌%' THEN 1
         WHEN logic_check LIKE '❓%' THEN 2
         WHEN logic_check LIKE '✅%' THEN 3
         ELSE 4 END,
    count DESC
LIMIT 50;
```

### 3. 信号分布分析

分析策略的交易特征和风格，了解主动交易与被动持仓的比例：

```sql
-- 信号分布和策略特征分析
WITH signal_stats AS (
    SELECT
        signal,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM trade_signals), 2) as percentage
    FROM trade_signals
    GROUP BY signal
),
activity_summary AS (
    SELECT
        SUM(CASE WHEN signal IN ('B', 'S') THEN count ELSE 0 END) as active_count,
        SUM(CASE WHEN signal IN ('H', 'E') THEN count ELSE 0 END) as passive_count,
        SUM(count) as total_count
    FROM signal_stats
)
SELECT
    signal || ' (' ||
    CASE
        WHEN signal = 'B' THEN 'Buy'
        WHEN signal = 'S' THEN 'Sell'
        WHEN signal = 'H' THEN 'Hold'
        WHEN signal = 'E' THEN 'Empty'
        ELSE 'Unknown'
    END || ')' as signal_type,
    count,
    percentage || '%' as percentage_str,
    CASE
        WHEN signal IN ('B', 'S') THEN '🔥 Active Trading'
        WHEN signal IN ('H', 'E') THEN '💤 Passive Holding'
        ELSE '❓ Unknown'
    END as activity_style
FROM signal_stats
UNION ALL
SELECT
    '--- 策略风格评估 ---',
    NULL,
    ROUND(active_count * 100.0 / total_count, 2) || '% Active, ' ||
    ROUND(passive_count * 100.0 / total_count, 2) || '% Passive',
    CASE
        WHEN active_count * 100.0 / total_count > 10 THEN '🔥 激进型策略'
        WHEN active_count * 100.0 / total_count > 2 THEN '⚖️ 平衡型策略'
        ELSE '💤 保守型策略'
    END
FROM activity_summary
ORDER BY count DESC NULLS LAST;
```

### 4. 最近信号状态查询

查看最新的信号状态，了解当前策略的持仓情况：

```sql
-- 最近信号状态查询
SELECT
    date,
    symbol,
    signal,
    CASE
        WHEN signal = 'B' THEN '🟢 Buy'
        WHEN signal = 'S' THEN '🔴 Sell'
        WHEN signal = 'H' THEN '🟡 Hold'
        WHEN signal = 'E' THEN '⚪ Empty'
        ELSE '❓ Unknown'
    END as signal_status
FROM trade_signals
WHERE date >= (SELECT date(MAX(date), '-7 days') FROM trade_signals)
ORDER BY date DESC, symbol
LIMIT 30;
```

### 5. 交易频率分析

分析策略的交易频率和换手率：

```sql
-- 交易频率分析
WITH trading_activity AS (
    SELECT
        date,
        symbol,
        signal,
        LAG(signal) OVER (PARTITION BY symbol ORDER BY date) as prev_signal,
        CASE WHEN signal != LAG(signal) OVER (PARTITION BY symbol ORDER BY date) 
             THEN 1 ELSE 0 END as signal_change
    FROM trade_signals
),
monthly_stats AS (
    SELECT
        strftime('%Y-%m', date) as month,
        COUNT(*) as total_signals,
        SUM(signal_change) as total_changes,
        ROUND(SUM(signal_change) * 100.0 / COUNT(*), 2) as change_rate
    FROM trading_activity
    WHERE prev_signal IS NOT NULL
    GROUP BY strftime('%Y-%m', date)
)
SELECT
    month,
    total_signals,
    total_changes,
    change_rate || '%' as change_rate_pct,
    CASE
        WHEN change_rate > 20 THEN '🔥 高频交易'
        WHEN change_rate > 5 THEN '⚖️ 中频交易'
        ELSE '💤 低频交易'
    END as trading_style
FROM monthly_stats
ORDER BY month DESC;
```

### 6. 指标数值分析

如果策略包含技术指标，可以分析指标的数值分布：

```sql
-- 技术指标数值分析（以RSI为例）
SELECT
    date,
    symbol,
    signal,
    -- 假设存在RSI指标列
    ROUND(rsi, 2) as rsi_value,
    CASE
        WHEN rsi > 70 THEN '🔴 超买区域'
        WHEN rsi < 30 THEN '🟢 超卖区域'
        ELSE '⚪ 正常区域'
    END as rsi_zone
FROM trade_signals
WHERE rsi IS NOT NULL
ORDER BY date DESC
LIMIT 50;
```

## 实际案例分析

### 案例1：策略信号异常诊断

**问题现象**：策略频繁买入卖出，收益不佳

**分析步骤**：

1. **运行信号健康检查**，确认数据完整性
2. **运行信号切换逻辑检查**，发现异常切换模式：
   ```
   B → S: 45次 (❌ 异常: 买入直接卖出)
   ```
3. **运行信号分布分析**，发现交易过于频繁：
   ```
   策略风格评估: 35% Active, 65% Passive (🔥 激进型策略)
   ```

**解决方案**：调整策略参数，增加持有期限制，减少频繁交易。

### 案例2：策略长期空仓问题

**问题现象**：策略长期处于空仓状态，错失市场机会

**分析步骤**：

1. **运行最近信号状态查询**，确认当前全部为空仓信号
2. **运行信号分布分析**，发现：
   ```
   E (Empty): 2847次, 89.5% (💤 Passive Holding)
   B (Buy): 123次, 3.9% (🔥 Active Trading)
   ```
3. **分析指标数值**，发现买入条件过于严格

**解决方案**：放宽买入条件，调整技术指标参数。

## 故障排除最佳实践

### 1. 系统性分析流程

1. **数据完整性检查** → 运行信号健康检查
2. **逻辑一致性验证** → 运行信号切换逻辑检查  
3. **策略特征分析** → 运行信号分布分析
4. **近期状态确认** → 运行最近信号状态查询
5. **深度诊断** → 根据具体问题运行专项分析

### 2. 常见问题及解决方案

| 问题类型 | 症状 | 分析方法 | 解决方案 |
|---------|------|----------|----------|
| 过度交易 | 买卖信号频繁切换 | 信号切换逻辑检查 | 增加信号确认机制 |
| 长期空仓 | E信号占比过高 | 信号分布分析 | 放宽买入条件 |
| 逻辑错误 | 异常信号切换 | 信号切换逻辑检查 | 修正策略逻辑 |
| 数据异常 | 信号数值异常 | 指标数值分析 | 检查数据源和计算 |

### 3. 性能优化建议

- **定期运行健康检查**：确保策略数据质量
- **监控交易频率**：避免过度交易影响收益
- **验证逻辑一致性**：确保信号切换符合预期
- **分析历史表现**：通过数据驱动优化策略

## 使用技巧

### SQL查询优化

- **时间范围限制**：使用 `WHERE date >= '2024-01-01'` 限制查询范围
- **符号筛选**：使用 `WHERE symbol = 'AAPL'` 分析特定标的
- **结果排序**：使用 `ORDER BY date DESC` 查看最新数据
- **限制记录数**：使用 `LIMIT 100` 控制返回结果数量

### 数据导出

- **CSV格式**：在Datasette中可以导出CSV格式数据
- **JSON格式**：支持导出JSON格式进行程序化分析
- **图表可视化**：结合数据可视化工具分析趋势

## 相关资源

**官方工具**：
- [信号分析查询手册](https://www.myinvestpilot.com/help/signal-analysis/) - 完整的SQL查询示例
- 策引平台 - 我的策略组合 - 分析诊断 - 信号分析

**相关文档**：
- [原语架构概述](/docs/primitives/architecture)
- [策略组合分析](/docs/guides/portfolio-analysis)
- [市场指标详解](/docs/primitives/advanced/market-indicators)
- [策略优化指南](/docs/primitives/advanced/optimization)

---

**免责声明**：本指南提供的所有分析工具和方法仅用于策略研究和学习，不构成任何投资建议。策略分析结果不代表未来表现，用户应独立做出投资决策并承担相应风险。

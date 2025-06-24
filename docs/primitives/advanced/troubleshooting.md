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

以下是策引平台提供的9个专业SQL查询工具，用于全面诊断策略信号的质量和合理性。

### 数据表结构说明

- **主数据表**: `trade_signals` - 包含所有交易信号数据
- **信号类型**: 
  - `B` (Buy/买入)
  - `S` (Sell/卖出) 
  - `H` (Hold/持有)
  - `E` (Empty/空仓)
- **主要字段**: `date`(日期)、`symbol`(股票代码)、`signal`(信号类型)、`close`(收盘价)、`high`(最高价)、`low`(最低价)

### 1. 🏥 信号健康检查

**信号数据质量诊断** - 快速发现数据问题

检查项目：
- 数据完整性（记录数、时间范围、股票数量）
- 信号有效性（是否只包含B/S/H/E）
- 基本统计信息

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
FROM health_metrics
UNION ALL
SELECT
    '股票列表',
    (SELECT GROUP_CONCAT(DISTINCT symbol) FROM trade_signals),
    '📋 详细信息'
FROM health_metrics;
```

### 2. 🔄 信号切换逻辑检查

**信号状态切换逻辑验证** - 检测不符合交易逻辑的信号切换

正常切换逻辑：
- 标准流程: E -> B -> H -> S -> E
- 定投场景: H -> B (继续加仓)
- 必须卖出: H -> E 必须经过 S

异常切换检测：
- ❌ H -> E (跳过卖出直接空仓)
- ❌ B -> S (买入直接卖出)
- ❌ E -> S (空仓时卖出)
- ❌ S -> B (卖出直接买入)

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

### 3. 📊 信号分布分析

**策略交易特征分析** - 了解策略的交易风格和活跃度

分析维度：
- 信号分布：各信号类型占比
- 交易活跃度：主动交易 vs 被动持仓
- 策略风格评估

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

### 4. 📈 波动性分析

**价格波动性风险评估** - 识别高风险资产和杠杆特征

分析指标：
- 日收益率标准差（年化波动率）
- 最大单日涨跌幅
- 波动性排名和风险分级
- 杠杆ETF识别

风险等级：
- 🟢 低风险: 年化波动率 < 15%
- 🟡 中风险: 15% - 30%
- 🔴 高风险: > 30%

```sql
-- 波动性分析查询
WITH daily_returns AS (
    SELECT
        symbol,
        date,
        close,
        LAG(close) OVER (PARTITION BY symbol ORDER BY date) as prev_close,
        CASE 
            WHEN LAG(close) OVER (PARTITION BY symbol ORDER BY date) IS NOT NULL 
            THEN (close - LAG(close) OVER (PARTITION BY symbol ORDER BY date)) / LAG(close) OVER (PARTITION BY symbol ORDER BY date)
            ELSE NULL
        END as daily_return
    FROM trade_signals
    WHERE close IS NOT NULL AND close > 0
),
volatility_stats AS (
    SELECT
        symbol,
        COUNT(*) as trading_days,
        ROUND(AVG(daily_return) * 252 * 100, 2) as annualized_return_pct,
        ROUND(SQRT(AVG(daily_return * daily_return) - AVG(daily_return) * AVG(daily_return)) * SQRT(252) * 100, 2) as annualized_volatility_pct,
        ROUND(MAX(daily_return) * 100, 2) as max_daily_gain_pct,
        ROUND(MIN(daily_return) * 100, 2) as max_daily_loss_pct,
        ROUND((MAX(close) - MIN(close)) / MIN(close) * 100, 2) as total_range_pct
    FROM daily_returns
    WHERE daily_return IS NOT NULL
    GROUP BY symbol
    HAVING COUNT(*) >= 10  -- 至少10个交易日
)
SELECT
    symbol,
    trading_days,
    annualized_return_pct || '%' as annual_return,
    annualized_volatility_pct || '%' as annual_volatility,
    max_daily_gain_pct || '%' as max_gain,
    max_daily_loss_pct || '%' as max_loss,
    total_range_pct || '%' as total_range,
    CASE
        WHEN annualized_volatility_pct < 15 THEN '🟢 低风险'
        WHEN annualized_volatility_pct < 30 THEN '🟡 中风险'
        ELSE '🔴 高风险'
    END as risk_level,
    CASE
        WHEN annualized_volatility_pct > 50 OR ABS(max_daily_gain_pct) > 15 OR ABS(max_daily_loss_pct) > 15 
        THEN '⚠️ 疑似杠杆ETF'
        ELSE '📊 普通资产'
    END as leverage_indicator
FROM volatility_stats
ORDER BY annualized_volatility_pct DESC;
```

### 5. 🎯 信号有效性分析

**买卖信号成功率评估** - 验证信号的实际预测能力

分析维度：
- 短期成功率（5日后价格变化）
- 中期成功率（20日后价格变化）
- 平均收益率和风险收益比
- 信号可靠性评级

```sql
-- 分析买卖信号的有效性
WITH signal_performance AS (
    SELECT 
        date,
        symbol,
        signal,
        close as signal_price,
        LEAD(close, 5) OVER (PARTITION BY symbol ORDER BY date) as price_5d_later,
        LEAD(close, 20) OVER (PARTITION BY symbol ORDER BY date) as price_20d_later
    FROM trade_signals
    WHERE signal IN ('B', 'S')
),
effectiveness_stats AS (
    SELECT
        signal,
        COUNT(*) as total_signals,
        -- 5天后的成功率
        COUNT(CASE 
            WHEN signal = 'B' AND price_5d_later > signal_price THEN 1
            WHEN signal = 'S' AND price_5d_later < signal_price THEN 1
        END) as successful_5d,
        -- 20天后的成功率
        COUNT(CASE 
            WHEN signal = 'B' AND price_20d_later > signal_price THEN 1
            WHEN signal = 'S' AND price_20d_later < signal_price THEN 1
        END) as successful_20d,
        -- 平均收益率
        AVG(CASE 
            WHEN signal = 'B' THEN (COALESCE(price_5d_later, signal_price) - signal_price) / signal_price * 100
            WHEN signal = 'S' THEN (signal_price - COALESCE(price_5d_later, signal_price)) / signal_price * 100
        END) as avg_return_5d
    FROM signal_performance
    GROUP BY signal
)
SELECT
    CASE 
        WHEN signal = 'B' THEN '🟢 买入信号'
        WHEN signal = 'S' THEN '🔴 卖出信号'
    END as signal_type,
    total_signals || ' 次' as signal_count,
    ROUND(successful_5d * 100.0 / total_signals, 1) || '%' as success_rate_5d,
    ROUND(successful_20d * 100.0 / total_signals, 1) || '%' as success_rate_20d,
    ROUND(avg_return_5d, 2) || '%' as avg_return_5d,
    CASE 
        WHEN successful_5d * 100.0 / total_signals > 70 THEN '🌟 优秀'
        WHEN successful_5d * 100.0 / total_signals > 55 THEN '✅ 良好'
        WHEN successful_5d * 100.0 / total_signals > 45 THEN '⚠️ 一般'
        ELSE '❌ 较差'
    END as reliability_rating
FROM effectiveness_stats
WHERE total_signals > 0;
```

### 6. ⏰ 交易时机分析

**策略交易节奏特征** - 了解策略的交易频率和持仓周期

分析维度：
- 信号间隔时间分布
- 持仓周期统计
- 交易活跃度评估
- 市场时机把握能力

```sql
-- 分析策略的时机特征
WITH signal_gaps AS (
    SELECT 
        symbol,
        date,
        signal,
        LAG(date) OVER (PARTITION BY symbol ORDER BY date) as prev_date,
        LAG(signal) OVER (PARTITION BY symbol ORDER BY date) as prev_signal,
        julianday(date) - julianday(LAG(date) OVER (PARTITION BY symbol ORDER BY date)) as days_gap
    FROM trade_signals
    WHERE signal IN ('B', 'S')
),
frequency_analysis AS (
    SELECT
        signal,
        COUNT(*) as signal_count,
        ROUND(AVG(days_gap), 1) as avg_gap_days,
        MIN(days_gap) as min_gap_days,
        MAX(days_gap) as max_gap_days,
        COUNT(CASE WHEN days_gap < 7 THEN 1 END) as weekly_signals,
        COUNT(CASE WHEN days_gap BETWEEN 7 AND 30 THEN 1 END) as monthly_signals,
        COUNT(CASE WHEN days_gap > 30 THEN 1 END) as quarterly_signals
    FROM signal_gaps
    WHERE days_gap IS NOT NULL
    GROUP BY signal
)
SELECT
    CASE 
        WHEN signal = 'B' THEN '🟢 买入信号'
        WHEN signal = 'S' THEN '🔴 卖出信号'
    END as signal_type,
    signal_count || ' 次' as total_count,
    avg_gap_days || ' 天' as avg_interval,
    min_gap_days || '-' || max_gap_days || ' 天' as gap_range,
    weekly_signals || '/' || monthly_signals || '/' || quarterly_signals as frequency_distribution,
    CASE 
        WHEN avg_gap_days < 14 THEN '🔥 高频交易 (< 2周)'
        WHEN avg_gap_days < 60 THEN '⚖️ 中频交易 (2周-2月)'
        ELSE '💤 低频交易 (> 2月)'
    END as trading_style
FROM frequency_analysis
UNION ALL
SELECT
    '📊 整体特征',
    (SELECT COUNT(*) FROM signal_gaps WHERE signal IN ('B', 'S') AND days_gap IS NOT NULL) || ' 次交易',
    ROUND((SELECT AVG(days_gap) FROM signal_gaps WHERE days_gap IS NOT NULL), 1) || ' 天',
    '平均交易间隔',
    '周/月/季度分布',
    CASE 
        WHEN (SELECT AVG(days_gap) FROM signal_gaps WHERE days_gap IS NOT NULL) < 21 THEN '🔥 活跃策略'
        WHEN (SELECT AVG(days_gap) FROM signal_gaps WHERE days_gap IS NOT NULL) < 90 THEN '⚖️ 平衡策略'
        ELSE '💤 稳健策略'
    END;
```

### 7. 🌍 市场适应性分析

**策略在不同市场环境下的表现** - 评估策略的适应性和局限性

分析维度：
- 趋势市场 vs 震荡市场表现
- 高波动 vs 低波动环境适应性
- 信号在不同市场条件下的分布
- 策略适用场景识别

```sql
-- 分析策略在不同市场环境下的表现
WITH market_conditions AS (
    SELECT 
        date,
        symbol,
        close,
        signal,
        high,
        low,
        -- 计算20日移动平均来判断趋势
        AVG(close) OVER (
            PARTITION BY symbol 
            ORDER BY date 
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        ) as ma20,
        -- 计算20日波动率
        (MAX(high) OVER (
            PARTITION BY symbol 
            ORDER BY date 
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        ) - MIN(low) OVER (
            PARTITION BY symbol 
            ORDER BY date 
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        )) / close as volatility_20d
    FROM trade_signals
    WHERE close IS NOT NULL AND high IS NOT NULL AND low IS NOT NULL
),
classified_signals AS (
    SELECT 
        signal,
        CASE 
            WHEN close > ma20 * 1.02 THEN '📈 上涨趋势'
            WHEN close > ma20 * 0.98 THEN '📊 横盘整理'
            ELSE '📉 下跌趋势'
        END as market_trend,
        CASE 
            WHEN volatility_20d > 0.15 THEN '🌊 高波动'
            WHEN volatility_20d > 0.08 THEN '〰️ 中波动'
            ELSE '📏 低波动'
        END as volatility_level
    FROM market_conditions
    WHERE signal IN ('B', 'S') AND ma20 IS NOT NULL AND volatility_20d IS NOT NULL
),
adaptation_stats AS (
    SELECT 
        signal,
        market_trend,
        volatility_level,
        COUNT(*) as signal_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY signal), 1) as percentage
    FROM classified_signals
    GROUP BY signal, market_trend, volatility_level
)
SELECT 
    CASE 
        WHEN signal = 'B' THEN '🟢 买入信号'
        WHEN signal = 'S' THEN '🔴 卖出信号'
    END as signal_type,
    market_trend,
    volatility_level,
    signal_count || ' 次' as count,
    percentage || '%' as proportion,
    CASE 
        WHEN signal = 'B' AND market_trend = '📈 上涨趋势' THEN '✅ 顺势而为'
        WHEN signal = 'S' AND market_trend = '📉 下跌趋势' THEN '✅ 及时止损'
        WHEN signal = 'B' AND market_trend = '📉 下跌趋势' THEN '⚠️ 抄底风险'
        WHEN signal = 'S' AND market_trend = '📈 上涨趋势' THEN '⚠️ 过早获利'
        ELSE '📊 中性策略'
    END as strategy_assessment
FROM adaptation_stats
WHERE signal_count > 0
ORDER BY signal, signal_count DESC;
```

### 8. ⚠️ 风险信号识别

**策略潜在风险警示** - 识别可能影响策略表现的风险因素

风险维度：
- 连续错误信号
- 极端市场条件下的表现
- 信号密度过高警告
- 长期空仓风险

```sql
-- 识别策略中的潜在风险信号
WITH risk_analysis AS (
    SELECT 
        symbol,
        date,
        signal,
        close,
        LAG(signal, 1) OVER (PARTITION BY symbol ORDER BY date) as prev_signal_1,
        LAG(signal, 2) OVER (PARTITION BY symbol ORDER BY date) as prev_signal_2,
        LAG(close, 1) OVER (PARTITION BY symbol ORDER BY date) as prev_close,
        LEAD(close, 5) OVER (PARTITION BY symbol ORDER BY date) as future_close,
        COUNT(CASE WHEN signal IN ('B', 'S') THEN 1 END) OVER (
            PARTITION BY symbol 
            ORDER BY date 
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) as signals_30d
    FROM trade_signals
),
risk_patterns AS (
    SELECT
        '🔄 频繁交易风险' as risk_type,
        COUNT(*) as occurrence_count,
        CASE 
            WHEN COUNT(*) > 10 THEN '❌ 高风险'
            WHEN COUNT(*) > 5 THEN '⚠️ 中风险'
            ELSE '✅ 低风险'
        END as risk_level,
        '30天内交易超过' || MAX(signals_30d) || '次' as description
    FROM risk_analysis
    WHERE signals_30d > 8
    
    UNION ALL
    
    SELECT
        '📉 连续错误信号' as risk_type,
        COUNT(*) as occurrence_count,
        CASE 
            WHEN COUNT(*) > 3 THEN '❌ 高风险'
            WHEN COUNT(*) > 1 THEN '⚠️ 中风险'
            ELSE '✅ 低风险'
        END as risk_level,
        '发现' || COUNT(*) || '次买入后价格下跌' as description
    FROM risk_analysis
    WHERE signal = 'B' AND future_close < close * 0.95
    
    UNION ALL
    
    SELECT
        '🔀 信号混乱' as risk_type,
        COUNT(*) as occurrence_count,
        CASE 
            WHEN COUNT(*) > 5 THEN '❌ 高风险'
            WHEN COUNT(*) > 2 THEN '⚠️ 中风险'
            ELSE '✅ 低风险'
        END as risk_level,
        '发现' || COUNT(*) || '次B-S-B短期切换' as description
    FROM risk_analysis
    WHERE signal = 'B' AND prev_signal_1 = 'S' AND prev_signal_2 = 'B'
    
    UNION ALL
    
    SELECT
        '💤 长期空仓' as risk_type,
        COUNT(*) as occurrence_count,
        CASE 
            WHEN COALESCE(MAX(streak_days), 0) > 200 THEN '⚠️ 中风险'
            WHEN COALESCE(MAX(streak_days), 0) > 100 THEN '📊 正常'  
            WHEN COALESCE(MAX(streak_days), 0) > 30 THEN '✅ 活跃'
            ELSE '🚀 极活跃'
        END as risk_level,
        CASE 
            WHEN COUNT(*) = 0 THEN '未发现长期空仓'
            ELSE '发现' || COUNT(*) || '次空仓期，最长' || COALESCE(MAX(streak_days), 0) || '天'
        END as description
    FROM (
        WITH signal_groups AS (
            SELECT
                symbol,
                date,
                signal,
                (ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY date) - 
                 ROW_NUMBER() OVER (PARTITION BY symbol, signal ORDER BY date)) as grp
            FROM risk_analysis
            WHERE signal IS NOT NULL
        ),
        empty_streaks AS (
            SELECT
                symbol,
                signal,
                COUNT(*) as streak_days,
                MIN(date) as start_date,
                MAX(date) as end_date
            FROM signal_groups
            WHERE signal = 'E'
            GROUP BY symbol, signal, grp
            HAVING COUNT(*) > 30
        )
        SELECT 
            symbol,
            streak_days,
            start_date,
            end_date
        FROM empty_streaks
    ) long_empty_periods
)
SELECT 
    risk_type,
    occurrence_count,
    risk_level,
    description
FROM risk_patterns
WHERE occurrence_count > 0
ORDER BY 
    CASE 
        WHEN risk_level = '❌ 高风险' THEN 1
        WHEN risk_level = '⚠️ 中风险' THEN 2
        ELSE 3
    END,
    occurrence_count DESC;
```

### 9. 🔍 自定义分析

**灵活的自定义查询** - 根据需要自由查询数据

使用方法：
- 在SQL编辑器中输入自定义查询
- 可查询任意时间段、股票、条件

常用查询示例：
- 特定日期: WHERE date = '2022-01-01'
- 特定股票: WHERE symbol = 'AAPL'
- 信号变化: 使用LAG()函数分析转换

```sql
-- 自定义查询模板 - 可根据需要修改
SELECT
    date,
    symbol,
    signal
FROM trade_signals
ORDER BY date DESC
LIMIT 100;
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

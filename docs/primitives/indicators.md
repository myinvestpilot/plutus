# 指标原语参考指南

指标原语(Indicator Primitives)用于从价格数据计算技术指标。这些组件接收OHLCV(开盘价、最高价、最低价、收盘价、成交量)数据，并输出时间序列指标值。

## 通用参数

大多数指标原语支持以下通用参数：

- `field`: 指定用于计算的价格列名(默认通常为'Close')
- `period`: 计算的回溯期(如移动平均的窗口大小)

## 可用指标原语

### 移动平均类

#### SMA (简单移动平均)

计算价格的简单移动平均。

```json
{
  "id": "ma50",
  "type": "SMA",
  "params": {
    "period": 50,
    "field": "Close"
  }
}
```

**参数**:

- `period`: 移动平均的周期(默认: 20)
- `field`: 使用的价格列(默认: 'Close')

#### EMA (指数移动平均)

计算价格的指数移动平均，对近期价格赋予更高权重。

```json
{
  "id": "ema20",
  "type": "EMA",
  "params": {
    "period": 20,
    "field": "Close"
  }
}
```

**参数**:

- `period`: 移动平均的周期(默认: 20)
- `field`: 使用的价格列(默认: 'Close')

### 动量指标类

#### RSI (相对强弱指数)

计算RSI指标，用于测量价格变动的速度和变化。

```json
{
  "id": "rsi14",
  "type": "RSI",
  "params": {
    "period": 14,
    "field": "Close"
  }
}
```

**参数**:

- `period`: RSI计算周期(默认: 14)
- `field`: 使用的价格列(默认: 'Close')

**注意事项**:

- RSI值范围在0-100之间
- 传统上，RSI > 70被视为超买，RSI < 30被视为超卖
- RSI计算使用Wilder's平滑方法

#### MACD (移动平均收敛发散)

计算MACD指标，显示两条移动平均线之间的关系。

```json
{
  "id": "macd_indicator",
  "type": "MACD",
  "params": {
    "fast_period": 12,
    "slow_period": 26,
    "signal_period": 9,
    "field": "Close"
  }
}
```

**参数**:

- `fast_period`: 快线EMA周期(默认: 12)
- `slow_period`: 慢线EMA周期(默认: 26)
- `signal_period`: 信号线周期(默认: 9)
- `field`: 使用的价格列(默认: 'Close')

### 波动率指标类

#### ATR (真实波幅)

计算Average True Range，衡量市场波动性。

```json
{
  "id": "atr20",
  "type": "ATR",
  "params": {
    "period": 20
  }
}
```

**参数**:

- `period`: ATR计算周期(默认: 14)

#### BollingerBands (布林带)

计算布林带，包括中轨(SMA)、上轨和下轨。

```json
{
  "id": "bbands",
  "type": "BollingerBands",
  "params": {
    "period": 20,
    "stddev": 2,
    "field": "Close"
  }
}
```

**参数**:

- `period`: 中轨SMA周期(默认: 20)
- `stddev`: 标准差倍数(默认: 2)
- `field`: 使用的价格列(默认: 'Close')

### 极值指标类

#### HighestValue (最高值)

计算过去N个周期内的最高价。

```json
{
  "id": "highest_60",
  "type": "HighestValue",
  "params": {
    "period": 60,
    "field": "High"
  }
}
```

**参数**:

- `period`: 查找最高值的周期(默认: 20)
- `field`: 使用的价格列(默认: 'High')

#### LowestValue (最低值)

计算过去N个周期内的最低价。

```json
{
  "id": "lowest_60",
  "type": "LowestValue",
  "params": {
    "period": 60,
    "field": "Low"
  }
}
```

**参数**:

- `period`: 查找最低值的周期(默认: 20)
- `field`: 使用的价格列(默认: 'Low')

#### PercentFromHighest (距离最高点百分比)

计算当前价格距离过去N个周期最高价的百分比。

```json
{
  "id": "drawdown",
  "type": "PercentFromHighest",
  "params": {
    "period": 252,
    "field": "Close"
  }
}
```

**参数**:

- `period`: 查找最高值的周期(默认: 20)
- `field`: 使用的价格列(默认: 'Close')

### 吊灯指标类

#### ChandelierExit (吊灯出场)

基于ATR的止损策略，根据最高价减去ATR的倍数。

```json
{
  "id": "ce_long",
  "type": "ChandelierExit",
  "params": {
    "period": 22,
    "multiplier": 3.0,
    "direction": "long"
  }
}
```

**参数**:

- `period`: 回溯周期(默认: 22)
- `multiplier`: ATR乘数(默认: 3.0)
- `direction`: 方向，"long"或"short"(默认: "long")

### 常量类

#### Constant (常量值)

生成固定值的时间序列，常用于阈值。

```json
{
  "id": "upper_threshold",
  "type": "Constant",
  "params": {
    "value": 70
  }
}
```

**参数**:

- `value`: 常量值(必需)

## 最佳实践

1. **参数选择**:
   - 短期参数(如RSI 9)对市场变化反应更敏感，但可能产生更多假信号
   - 长期参数(如RSI 21)提供更平滑的信号，但可能反应较慢

2. **指标组合**:
   - 单一指标通常不足以构建可靠策略
   - 考虑组合趋势、动量和波动率指标

3. **常见错误**:
   - 过度拟合 - 不要仅基于历史数据优化参数
   - 忽略市场环境 - 某些指标在特定市场环境中表现更好

4. **数据质量**:
   - 确保输入的OHLCV数据没有缺失或异常值
   - 考虑调整股票分割、股息等因素

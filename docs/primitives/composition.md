# 原语组合模式与最佳实践

本文档介绍了常见的原语组合模式，以及如何有效地构建复杂策略。通过了解这些模式，您可以更高效地利用原语系统构建交易策略，而无需修改代码。

## 核心组合模式

### 1. 趋势跟随模式

趋势跟随策略在已确立的趋势方向上交易。

```json
{
  "indicators": [
    {
      "id": "sma_short",
      "type": "SMA",
      "params": {
        "period": 50,
        "field": "Close"
      }
    },
    {
      "id": "sma_long",
      "type": "SMA",
      "params": {
        "period": 200,
        "field": "Close"
      }
    }
  ],
  "signals": [
    {
      "id": "uptrend",
      "type": "GreaterThan",
      "epsilon": 0.5,
      "inputs": [
        { "ref": "sma_short" },
        { "ref": "sma_long" }
      ]
    },
    {
      "id": "price_above_trend",
      "type": "GreaterThan",
      "epsilon": 0.5,
      "inputs": [
        { "column": "Close" },
        { "ref": "sma_short" }
      ]
    },
    {
      "id": "buy_signal",
      "type": "And",
      "inputs": [
        { "ref": "uptrend" },
        { "ref": "price_above_trend" }
      ]
    }
  ]
}
```

**关键点**:

- 使用快速/慢速均线确定趋势方向
- 验证价格位于趋势线上方/下方
- 使用逻辑操作符组合多个条件

### 2. 反转交易模式

反转策略寻找价格可能改变方向的点。

```json
{
  "indicators": [
    {
      "id": "rsi_indicator",
      "type": "RSI",
      "params": {
        "period": 14,
        "field": "Close"
      }
    },
    {
      "id": "upper_threshold",
      "type": "Constant",
      "params": { "value": 70 }
    },
    {
      "id": "lower_threshold",
      "type": "Constant",
      "params": { "value": 30 }
    }
  ],
  "signals": [
    {
      "id": "oversold",
      "type": "Crossunder",
      "params": { "mode": "simple" },
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "lower_threshold" }
      ]
    },
    {
      "id": "overbought",
      "type": "Crossover",
      "params": { "mode": "simple" },
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "upper_threshold" }
      ]
    }
  ]
}
```

**关键点**:

- 使用震荡指标(RSI, Stochastic)识别超买/超卖条件
- 使用Crossover/Crossunder捕捉指标穿越阈值的瞬间
- 避免使用简单的GreaterThan/LessThan，它们会生成持续信号

### 3. 突破交易模式

突破策略寻找价格突破支撑或阻力位的时刻。

```json
{
  "indicators": [
    {
      "id": "highest_high",
      "type": "HighestValue",
      "params": {
        "period": 20,
        "field": "High"
      }
    },
    {
      "id": "lowest_low",
      "type": "LowestValue",
      "params": {
        "period": 20,
        "field": "Low"
      }
    }
  ],
  "signals": [
    {
      "id": "resistance_break",
      "type": "Crossover",
      "params": { "mode": "simple" },
      "inputs": [
        { "column": "Close" },
        { "ref": "highest_high" }
      ]
    },
    {
      "id": "support_break",
      "type": "Crossunder",
      "params": { "mode": "simple" },
      "inputs": [
        { "column": "Close" },
        { "ref": "lowest_low" }
      ]
    }
  ]
}
```

**关键点**:

- 使用HighestValue/LowestValue识别支撑/阻力位
- 使用Crossover/Crossunder捕捉突破时刻
- 考虑添加成交量确认或其他过滤器减少假突破

### 4. 波动性跟踪止损模式

使用动态止损跟踪价格走势，适应市场波动性。

```json
{
  "indicators": [
    {
      "id": "atr_indicator",
      "type": "ATR",
      "params": { "period": 14 }
    },
    {
      "id": "chandelier_exit",
      "type": "ChandelierExit",
      "params": {
        "period": 22,
        "multiplier": 3.0
      }
    }
  ],
  "signals": [
    {
      "id": "stop_hit",
      "type": "Crossunder",
      "params": { "mode": "simple" },
      "inputs": [
        { "column": "Close" },
        { "ref": "chandelier_exit" }
      ]
    }
  ]
}
```

**关键点**:

- 使用ATR或ChandelierExit创建动态止损位
- 止损位会随着价格的上涨而上移，但不会随价格下跌而下移
- Crossunder用于检测价格是否击穿止损位

## 高级组合模式

### 1. 多重确认模式

要求多个指标同时确认信号，减少假信号。

```json
{
  "signals": [
    {
      "id": "price_above_ma",
      "type": "GreaterThan",
      "inputs": [
        { "column": "Close" },
        { "ref": "ma200" }
      ]
    },
    {
      "id": "rsi_bull",
      "type": "GreaterThan",
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "rsi_midpoint" }
      ]
    },
    {
      "id": "volume_increasing",
      "type": "GreaterThan",
      "inputs": [
        { "column": "Volume" },
        { "ref": "volume_sma" }
      ]
    },
    {
      "id": "strong_buy_signal",
      "type": "And",
      "inputs": [
        { "ref": "price_above_ma" },
        { "ref": "rsi_bull" },
        { "ref": "volume_increasing" }
      ]
    }
  ]
}
```

**关键点**:

- 结合趋势、动量和成交量指标
- 使用And运算符要求所有条件同时满足
- 较少的交易信号，但可能质量更高

### 2. 趋势过滤模式

仅在主要趋势方向交易，避免逆势操作。

```json
{
  "signals": [
    {
      "id": "major_uptrend",
      "type": "GreaterThan",
      "inputs": [
        { "ref": "ma50" },
        { "ref": "ma200" }
      ]
    },
    {
      "id": "rsi_oversold",
      "type": "CrossBelow",
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "lower_threshold" }
      ]
    },
    {
      "id": "filtered_buy_signal",
      "type": "And",
      "inputs": [
        { "ref": "major_uptrend" },
        { "ref": "rsi_oversold" }
      ]
    }
  ]
}
```

**关键点**:

- 首先确定主要趋势方向
- 只有在趋势方向上的信号才被考虑
- 可显著减少逆势交易

### 3. 连续信号确认模式

使用Streak要求信号持续多个周期才采取行动。

```json
{
  "signals": [
    {
      "id": "price_above_ma",
      "type": "GreaterThan",
      "inputs": [
        { "column": "Close" },
        { "ref": "ma50" }
      ]
    },
    {
      "id": "consistent_strength",
      "type": "Streak",
      "params": {
        "condition": "true",
        "min_length": 3
      },
      "inputs": [
        { "ref": "price_above_ma" }
      ]
    }
  ]
}
```

**关键点**:

- 使用Streak要求信号持续一定天数
- 减少由市场噪声导致的假信号
- 可以与其他条件结合使用

### 4. 动态阈值模式

使用相对阈值而非固定阈值，使策略能够适应不同市场环境。

```json
{
  "indicators": [
    {
      "id": "bollinger_bands",
      "type": "BollingerBands",
      "params": {
        "period": 20,
        "std_dev": 2.0
      }
    }
  ],
  "signals": [
    {
      "id": "price_at_lower_band",
      "type": "CrossBelow",
      "inputs": [
        { "column": "Close" },
        { "ref": "bollinger_bands", "band": "lower" }
      ]
    }
  ]
}
```

**关键点**:

- 使用基于统计的动态阈值(如Bollinger Bands)
- 阈值根据市场波动性自动调整
- 适应不同的市场环境

## 特定策略模式示例

### 1. RSI超买超卖策略

```json
{
  "indicators": [
    {
      "id": "rsi_indicator",
      "type": "RSI",
      "params": {
        "period": 11,
        "field": "Close"
      }
    },
    {
      "id": "upper_threshold",
      "type": "Constant",
      "params": {
        "value": 63
      }
    },
    {
      "id": "lower_threshold",
      "type": "Constant",
      "params": {
        "value": 37
      }
    }
  ],
  "signals": [
    {
      "id": "is_below_lower",
      "type": "LessThan",
      "epsilon": 0.5,
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "lower_threshold" }
      ]
    },
    {
      "id": "is_above_upper",
      "type": "GreaterThan",
      "epsilon": 0.5,
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "upper_threshold" }
      ]
    },
    {
      "id": "buy_signal_cross",
      "type": "Crossunder",
      "params": { "mode": "simple" },
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "lower_threshold" }
      ]
    },
    {
      "id": "sell_signal_cross",
      "type": "Crossover",
      "params": { "mode": "simple" },
      "inputs": [
        { "ref": "rsi_indicator" },
        { "ref": "upper_threshold" }
      ]
    }
  ],
  "outputs": {
    "buy_signal": "buy_signal_cross",
    "sell_signal": "sell_signal_cross"
  }
}
```

**关键点**:

- 使用Crossunder/Crossover捕捉RSI穿越阈值的瞬间
- 同时暴露is_below_lower/is_above_upper状态指标
- 这种模式避免了传统RSI策略中常见的频繁交易问题

### 2. 吊灯止损策略

```json
{
  "indicators": [
    {
      "id": "ma_indicator",
      "type": "SMA",
      "params": {
        "period": 250,
        "field": "Close"
      }
    },
    {
      "id": "chandelier_exit_indicator",
      "type": "ChandelierExit",
      "params": {
        "period": 60,
        "multiplier": 4.0
      }
    }
  ],
  "signals": [
    {
      "id": "price_gt_ma",
      "type": "GreaterThan",
      "epsilon": 0.5,
      "inputs": [
        { "column": "Close" },
        { "ref": "ma_indicator" }
      ]
    },
    {
      "id": "price_gt_ce",
      "type": "GreaterThan",
      "epsilon": 0.5,
      "inputs": [
        { "column": "Close" },
        { "ref": "chandelier_exit_indicator" }
      ]
    },
    {
      "id": "buy_signal_condition",
      "type": "And",
      "inputs": [
        { "ref": "price_gt_ma" },
        { "ref": "price_gt_ce" }
      ]
    },
    {
      "id": "sell_signal_condition",
      "type": "Not",
      "inputs": [
        { "ref": "price_gt_ce" }
      ]
    }
  ],
  "outputs": {
    "buy_signal": "buy_signal_condition",
    "sell_signal": "sell_signal_condition"
  }
}
```

**关键点**:

- 结合长期均线和吊灯止损
- 均线确定趋势方向
- 吊灯出场提供动态止损位置
- 使用Not反转信号，在价格跌破止损时卖出

## 设计策略的最佳实践

1. **从简单开始**:
   - 先构建基本组件，再组合成复杂策略
   - 使用清晰的ID命名每个组件
   - 遵循自下而上的构建方法

2. **避免过度拟合**:
   - 参数越少越好
   - 避免过度优化回测期间的参数
   - 测试不同市场环境下的表现

3. **考虑信号质量与数量的平衡**:
   - 更严格的条件产生更少但可能更高质量的信号
   - 过于宽松的条件可能产生过多交易
   - 寻找适合您交易风格的平衡点

4. **增量测试**:
   - 在添加新条件前测试基本策略
   - 单独评估每个新添加的条件
   - 验证复合条件是否按预期工作

5. **关注输出映射**:
   - 仔细选择buy_signal和sell_signal的映射
   - 确保输出所有关键中间指标以便分析
   - 使用明确的输出名称

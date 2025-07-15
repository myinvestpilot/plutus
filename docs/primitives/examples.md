# 原语策略示例

本文档提供了使用原语系统构建的交易策略示例，包括详细配置、参数优化建议和性能分析。这些示例可以作为构建自己策略的起点。

## ⚠️ 重要说明：配置类型区别

本文档中的示例分为两种类型：

### 原语策略配置
- 只包含`trade_strategy`和`market_indicators`（如需要）
- 这是您在前端原语策略页面需要配置的部分
- 专注于交易逻辑，不包含资金管理、标的选择等

### 完整组合配置
- 包含所有参数：基本信息、交易标的、时间参数、资金管理等
- 用于完整的回测和实盘应用
- 包含原语策略配置作为其中的一部分

**重要提醒：** 如果您的策略中使用了市场指标引用，必须同时提供`market_indicators`配置，否则回测会失败。

## RSI超买超卖策略

### 策略概述

这个经典策略基于RSI（相对强弱指数）的超买超卖状态，在市场超卖时买入，超买时卖出。

### 原语策略配置

```json
{
  "trade_strategy": {
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
      "sell_signal": "sell_signal_cross",
      "indicators": [
        { "id": "rsi_indicator", "output_name": "rsi" },
        { "id": "upper_threshold", "output_name": "upper_bound" },
        { "id": "lower_threshold", "output_name": "lower_bound" },
        { "id": "is_below_lower", "output_name": "is_oversold" },
        { "id": "is_above_upper", "output_name": "is_overbought" },
        { "id": "buy_signal_cross", "output_name": "buy_signal" },
        { "id": "sell_signal_cross", "output_name": "sell_signal" }
      ]
    }
  }
}
```

**说明：** 这个策略不需要`market_indicators`，因为所有指标都基于当前标的的OHLC数据。

### 策略原理

1. **RSI指标**：计算过去11天的相对强弱指数
2. **阈值设置**：使用37作为超卖阈值，63作为超买阈值
3. **买入信号**：当RSI从上方穿越下阈值时触发（CrossBelow）
4. **卖出信号**：当RSI从下方穿越上阈值时触发（CrossAbove）
5. **状态跟踪**：额外跟踪持续超买（is_above_upper）和持续超卖（is_below_lower）状态

### 参数优化建议

| 参数 | 建议范围 | 说明 |
|------|----------|------|
| RSI周期 | 9-14 | 较短周期（9-11）对价格变化更敏感，较长周期（12-14）提供更平滑的信号 |
| 超买阈值 | 60-70 | 传统使用70，但可视市场波动性调整 |
| 超卖阈值 | 30-40 | 传统使用30，但可视市场波动性调整 |

**研究发现**：

- 标准设置（RSI 14，30/70）在多数市场环境中表现稳定
- 中等偏保守的设置（RSI 11-12，37/63）可能在回测中表现更佳
- 过于极端的阈值（如20/80）会减少交易频率，但可能错过机会

### 性能分析

典型表现指标（根据历史回测）：

- CAGR（年复合增长率）：10-15%
- 最大回撤：15-25%
- 胜率：55-65%
- 平均交易次数：每年20-30次

### 改进变体

#### 1. 带趋势过滤的RSI策略

```json
{
  "indicators": [
    // 原有RSI指标...
    {
      "id": "sma_indicator",
      "type": "SMA",
      "params": {
        "period": 200,
        "column": "Close"
      }
    }
  ],
  "signals": [
    // 原有RSI信号...
    {
      "id": "price_above_sma",
      "type": "GreaterThan",
      "inputs": [
        { "column": "Close" },
        { "ref": "sma_indicator" }
      ]
    },
    {
      "id": "filtered_buy_signal",
      "type": "And",
      "inputs": [
        { "ref": "buy_signal_cross" },
        { "ref": "price_above_sma" }
      ]
    }
  ],
  "outputs": {
    "buy_signal": "filtered_buy_signal",
    "sell_signal": "sell_signal_cross"
  }
}
```

**改进要点**：只在上升趋势中买入（价格在200日均线上方），但无论趋势如何都在RSI超买时卖出。

#### 2. 带连续确认的RSI策略

```json
{
  "signals": [
    // 原有RSI信号...
    {
      "id": "consistent_oversold",
      "type": "Streak",
      "params": {
        "condition": "true",
        "min_length": 2
      },
      "inputs": [
        { "ref": "is_below_lower" }
      ]
    },
    {
      "id": "buy_with_confirmation",
      "type": "And",
      "inputs": [
        { "ref": "buy_signal_cross" },
        { "ref": "consistent_oversold" }
      ]
    }
  ],
  "outputs": {
    "buy_signal": "buy_with_confirmation",
    "sell_signal": "sell_signal_cross"
  }
}
```

**改进要点**：要求RSI至少连续两天处于超卖区域才考虑买入信号，减少震荡市场中的假信号。

## 双均线交叉策略

### 策略概述

这个经典策略使用两条不同周期的移动平均线，在短期均线上穿长期均线时买入，下穿时卖出。

### 原语策略配置

```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "fast_ma",
        "type": "SMA",
        "params": {
          "period": 50,
          "field": "Close"
        }
      },
      {
        "id": "slow_ma",
        "type": "SMA",
        "params": {
          "period": 200,
          "field": "Close"
        }
      },
      {
        "id": "zero_constant",
        "type": "Constant",
        "params": {
          "value": 0
        }
      }
    ],
    "signals": [
      {
        "id": "ma_diff",
        "type": "Subtract",
        "inputs": [
          { "ref": "fast_ma" },
          { "ref": "slow_ma" }
        ]
      },
      {
        "id": "bull_trend",
        "type": "GreaterThan",
        "epsilon": 0.5,
        "inputs": [
          { "ref": "ma_diff" },
          { "ref": "zero_constant" }
        ]
      },
      {
        "id": "buy_signal",
        "type": "Crossover",
        "params": { "mode": "simple" },
        "inputs": [
          { "ref": "fast_ma" },
          { "ref": "slow_ma" }
        ]
      },
      {
        "id": "sell_signal",
        "type": "Crossunder",
        "params": { "mode": "simple" },
        "inputs": [
          { "ref": "fast_ma" },
          { "ref": "slow_ma" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "buy_signal",
      "sell_signal": "sell_signal",
      "indicators": [
        { "id": "fast_ma", "output_name": "fast_ma" },
        { "id": "slow_ma", "output_name": "slow_ma" },
        { "id": "ma_diff", "output_name": "ma_diff" },
        { "id": "bull_trend", "output_name": "is_bull_trend" }
      ]
    }
  }
}
```

**说明：** 这个策略同样不需要`market_indicators`，因为所有指标都基于当前标的的OHLC数据。

### 策略原理

1. **移动平均线**：计算50日和200日简单移动平均线
2. **差值计算**：计算短期均线与长期均线的差值
3. **趋势判断**：差值大于0表示多头趋势
4. **买入信号**：短期均线从下方穿越长期均线时触发（黄金交叉）
5. **卖出信号**：短期均线从上方穿越长期均线时触发（死亡交叉）

### 参数优化建议

| 参数 | 建议范围 | 说明 |
|------|----------|------|
| 短期均线周期 | 20-50 | 较短周期提供更频繁的信号，较长周期减少假突破 |
| 长期均线周期 | 100-250 | 设置足够长以确定主要趋势 |

**研究发现**：

- 50/200组合（"黄金交叉/死亡交叉"）是最经典的设置，适合长期投资
- 20/100组合对中期趋势变化更敏感
- 5/20组合适合短期交易，但可能产生更多噪声

### 性能分析

典型表现指标：

- CAGR：8-12%
- 最大回撤：20-30%
- 胜率：45-55%
- 平均交易次数：每年3-8次（比RSI策略少）

### 改进变体

#### 1. 带成交量确认的双均线策略

```json
{
  "indicators": [
    // 原有移动平均线...
    {
      "id": "volume_ma",
      "type": "SMA",
      "params": {
        "period": 20,
        "column": "Volume"
      }
    }
  ],
  "signals": [
    // 原有信号...
    {
      "id": "volume_surge",
      "type": "GreaterThan",
      "inputs": [
        { "column": "Volume" },
        { "ref": "volume_ma" }
      ]
    },
    {
      "id": "confirmed_buy_signal",
      "type": "And",
      "inputs": [
        { "ref": "buy_signal" },
        { "ref": "volume_surge" }
      ]
    }
  ],
  "outputs": {
    "buy_signal": "confirmed_buy_signal",
    "sell_signal": "sell_signal"
  }
}
```

**改进要点**：要求买入信号伴随成交量放大，减少低质量交叉信号。

## 股债轮动策略

### 策略概述

这是一个基于 `StockBondSwitch` 原语的资产轮动策略，根据市场趋势在股票ETF和债券ETF之间进行全仓切换。该策略使用沪深300指数相对于其200日移动平均线的位置作为趋势判断指标。

### 原语策略配置

```json
{
  "market_indicators": {
    "indicators": [
      {
        "code": "000300.SH"
      }
    ],
    "transformers": [
      {
        "name": "hs300_raw",
        "type": "IdentityTransformer",
        "params": {
          "indicator": "000300.SH",
          "field": "Close"
        }
      },
      {
        "name": "hs300_ma200",
        "type": "MovingAverageTransformer",
        "params": {
          "indicator": "000300.SH",
          "window": 200,
          "method": "simple",
          "field": "Close"
        }
      }
    ]
  },
  "trade_strategy": {
    "indicators": [
      {
        "id": "constant_one",
        "type": "Constant",
        "params": {
          "value": 1
        }
      }
    ],
    "signals": [
      {
        "id": "market_trend_up",
        "type": "GreaterThan",
        "inputs": [
          {
            "market": "000300.SH",
            "transformer": "hs300_raw"
          },
          {
            "market": "000300.SH",
            "transformer": "hs300_ma200"
          }
        ]
      },
      {
        "id": "stock_bond_buy",
        "type": "StockBondSwitch",
        "params": {
          "default_to_stock": true
        },
        "inputs": [
          {
            "ref": "market_trend_up"
          }
        ]
      },
      {
        "id": "stock_bond_sell",
        "type": "Not",
        "inputs": [
          {
            "ref": "stock_bond_buy"
          }
        ]
      },
      {
        "id": "constant_false_signal",
        "type": "Comparison",
        "params": {
          "comparison": "greater",
          "threshold": 2
        },
        "inputs": [
          {
            "ref": "constant_one"
          }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "stock_bond_buy",
      "sell_signal": "stock_bond_sell"
    }
  }
}
```

**重要说明：** 这个策略**必须**包含`market_indicators`配置，因为`trade_strategy`中使用了市场指标引用（`{"market": "000300.SH", "transformer": "hs300_raw"}`）。如果缺少这部分配置，回测会失败。

### 策略原理

1. **市场指标**：使用沪深300指数（000300.SH）作为市场基准
2. **趋势识别**：比较当前沪深300指数与其200日移动平均线
3. **股债切换逻辑**：
   - 当沪深300指数 > 200日均线时：全仓持有股票ETF（510300）
   - 当沪深300指数 < 200日均线时：全仓持有债券ETF（511260）
4. **全局上下文**：`StockBondSwitch` 通过调用栈检测当前评估的标的，并返回相应的买入信号

### 核心组件解析

#### 市场指标配置

```json
"market_indicators": {
  "indicators": [{"code": "000300.SH"}],
  "transformers": [
    {
      "name": "hs300_raw",
      "type": "IdentityTransformer",
      "params": {
        "indicator": "000300.SH",
        "field": "Close"
      }
    },
    {
      "name": "hs300_ma200",
      "type": "MovingAverageTransformer",
      "params": {
        "indicator": "000300.SH",
        "window": 200,
        "method": "simple",
        "field": "Close"
      }
    }
  ]
}
```

- **原始指数**：`hs300_raw` 提供沪深300指数的收盘价
- **移动平均**：`hs300_ma200` 计算200日简单移动平均线

#### 信号生成逻辑

```json
"signals": [
  {
    "id": "market_trend_up",
    "type": "GreaterThan", 
    "inputs": [
      {"market": "000300.SH", "transformer": "hs300_raw"},
      {"market": "000300.SH", "transformer": "hs300_ma200"}
    ]
  },
  {
    "id": "stock_bond_buy",
    "type": "StockBondSwitch",
    "params": {"default_to_stock": true},
    "inputs": [{"ref": "market_trend_up"}]
  }
]
```

- **趋势信号**：`market_trend_up` 判断市场是否处于上升趋势
- **轮动信号**：`StockBondSwitch` 根据趋势信号为不同标的生成买入信号

### 参数优化建议

| 参数 | 建议范围 | 说明 |
|------|----------|------|
| 移动平均周期 | 150-250天 | 较短周期对趋势变化更敏感，但可能增加切换频率 |
| default_to_stock | true/false | 在趋势不明确时的默认配置 |
| 资金使用比例 | 95-100% | 全仓策略通常使用99%，保留1%作为缓冲 |

**研究发现**：

- 200日均线是最经典的长期趋势判断指标
- 过短的均线周期（如50日）会导致过于频繁的切换
- 过长的均线周期（如300日）会降低策略的响应速度

### 性能分析

典型表现指标（基于历史回测）：

- **CAGR（年复合增长率）**：8-12%
- **最大回撤**：10-20%（显著低于纯股票策略）
- **胜率**：取决于市场环境，通常在45-60%
- **切换频率**：每年2-6次（相对较低）
- **夏普比率**：通常优于单纯持有股票或债券

### 策略特点

#### 优势

1. **风险分散**：在不同市场环境中持有不同资产类别
2. **趋势跟随**：能够捕捉长期趋势，减少短期噪音
3. **简单有效**：逻辑清晰，参数较少，不易过拟合
4. **全仓投资**：避免了择时不准确导致的现金拖累

#### 局限性

1. **滞后性**：基于移动平均线的策略有天然的滞后性
2. **震荡市场**：在趋势不明确的市场中可能频繁切换
3. **单一指标**：仅依赖一个市场指标，缺乏多重确认

### 改进变体

#### 1. 带确认机制的股债轮动

```json
{
  "signals": [
    {
      "id": "market_trend_up",
      "type": "GreaterThan",
      "inputs": [
        {"market": "000300.SH", "transformer": "hs300_raw"},
        {"market": "000300.SH", "transformer": "hs300_ma200"}
      ]
    },
    {
      "id": "trend_confirmed",
      "type": "Streak",
      "params": {
        "condition": "true",
        "min_length": 5
      },
      "inputs": [
        {"ref": "market_trend_up"}
      ]
    },
    {
      "id": "confirmed_stock_bond_buy",
      "type": "StockBondSwitch",
      "params": {"default_to_stock": true},
      "inputs": [
        {"ref": "trend_confirmed"}
      ]
    }
  ]
}
```

**改进要点**：要求趋势信号连续5天确认才进行切换，减少震荡市场中的频繁交易。

#### 2. 多指标股债轮动

```json
{
  "market_indicators": {
    "indicators": [
      {"code": "000300.SH"},
      {"code": "000016.SH"}  // 上证50指数
    ],
    "transformers": [
      // 沪深300相关转换器...
      {
        "name": "sz50_raw",
        "type": "IdentityTransformer", 
        "params": {
          "indicator": "000016.SH",
          "field": "Close"
        }
      },
      {
        "name": "sz50_ma200",
        "type": "MovingAverageTransformer",
        "params": {
          "indicator": "000016.SH",
          "window": 200,
          "method": "simple",
          "field": "Close"
        }
      }
    ]
  },
  "signals": [
    {
      "id": "hs300_trend_up",
      "type": "GreaterThan",
      "inputs": [
        {"market": "000300.SH", "transformer": "hs300_raw"},
        {"market": "000300.SH", "transformer": "hs300_ma200"}
      ]
    },
    {
      "id": "sz50_trend_up", 
      "type": "GreaterThan",
      "inputs": [
        {"market": "000016.SH", "transformer": "sz50_raw"},
        {"market": "000016.SH", "transformer": "sz50_ma200"}
      ]
    },
    {
      "id": "combined_trend_up",
      "type": "And",
      "inputs": [
        {"ref": "hs300_trend_up"},
        {"ref": "sz50_trend_up"}
      ]
    },
    {
      "id": "multi_index_stock_bond_buy",
      "type": "StockBondSwitch", 
      "params": {"default_to_stock": false},
      "inputs": [
        {"ref": "combined_trend_up"}
      ]
    }
  ]
}
```

**改进要点**：结合多个市场指数的趋势判断，只有当多个指数都处于上升趋势时才持有股票，提高信号质量。

#### 3. 动态阈值股债轮动

```json
{
  "market_indicators": {
    "transformers": [
      // 现有转换器...
      {
        "name": "hs300_volatility",
        "type": "VolatilityTransformer",
        "params": {
          "indicator": "000300.SH",
          "window": 20,
          "method": "std",
          "field": "Close"
        }
      }
    ]
  },
  "signals": [
    {
      "id": "low_volatility",
      "type": "LessThan",
      "inputs": [
        {"market": "000300.SH", "transformer": "hs300_volatility"},
        {"ref": "volatility_threshold"}
      ]
    },
    {
      "id": "stable_trend_up",
      "type": "And", 
      "inputs": [
        {"ref": "market_trend_up"},
        {"ref": "low_volatility"}
      ]
    },
    {
      "id": "volatility_adjusted_stock_bond_buy",
      "type": "StockBondSwitch",
      "params": {"default_to_stock": true},
      "inputs": [
        {"ref": "stable_trend_up"}
      ]
    }
  ]
}
```

**改进要点**：只在市场波动率较低时进行切换，避免在高波动期的频繁调整。

### 实际应用建议

1. **定期审查**：每月检查策略表现，确保符合预期
2. **参数稳定性**：避免频繁调整参数，保持策略的一致性
3. **成本控制**：考虑交易成本，避免过于频繁的切换
4. **风险管理**：结合个人风险承受能力调整资金使用比例

## 通道突破策略

### 策略概述

该策略基于价格突破布林带上轨和下轨生成交易信号，结合RSI过滤器减少假突破。

### 原语策略配置

```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "bbands",
        "type": "BollingerBands",
        "params": {
          "period": 20,
          "stddev": 2.0,
          "field": "Close"
        }
      },
      {
        "id": "rsi_indicator",
        "type": "RSI",
        "params": {
          "period": 14,
          "field": "Close"
        }
      },
      {
        "id": "rsi_low",
        "type": "Constant",
        "params": {
          "value": 40
        }
      },
      {
        "id": "rsi_high",
        "type": "Constant",
        "params": {
          "value": 60
        }
      }
    ],
    "signals": [
      {
        "id": "price_above_upper",
        "type": "Crossover",
        "params": { "mode": "simple" },
        "inputs": [
          { "column": "Close" },
          { "ref": "bbands", "band": "upper" }
        ]
      },
      {
        "id": "price_below_lower",
        "type": "Crossunder",
        "params": { "mode": "simple" },
        "inputs": [
          { "column": "Close" },
          { "ref": "bbands", "band": "lower" }
        ]
      },
      {
        "id": "rsi_bullish",
        "type": "GreaterThan",
        "epsilon": 0.5,
        "inputs": [
          { "ref": "rsi_indicator" },
          { "ref": "rsi_high" }
        ]
      },
      {
        "id": "rsi_bearish",
        "type": "LessThan",
        "epsilon": 0.5,
        "inputs": [
          { "ref": "rsi_indicator" },
          { "ref": "rsi_low" }
        ]
      },
      {
        "id": "buy_signal",
        "type": "And",
        "inputs": [
          { "ref": "price_below_lower" },
          { "ref": "rsi_bearish" }
        ]
      },
      {
        "id": "sell_signal",
        "type": "And",
        "inputs": [
          { "ref": "price_above_upper" },
          { "ref": "rsi_bullish" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "buy_signal",
      "sell_signal": "sell_signal",
      "indicators": [
        { "id": "bbands", "output_name": "bbands" },
        { "id": "rsi_indicator", "output_name": "rsi" },
        { "id": "rsi_bearish", "output_name": "rsi_bearish" },
        { "id": "rsi_bullish", "output_name": "rsi_bullish" },
        { "id": "price_below_lower", "output_name": "price_below_lower" },
        { "id": "price_above_upper", "output_name": "price_above_upper" }
      ]
    }
  }
}
```

**说明：** 这个策略不需要`market_indicators`，因为所有指标都基于当前标的的OHLC数据。

### 策略原理

1. **布林带**：20天SMA作为中轨，上下轨为中轨±2倍标准差
2. **RSI过滤器**：使用RSI确认突破方向
3. **买入信号**：价格下穿下轨且RSI显示超卖（低于40）
4. **卖出信号**：价格上穿上轨且RSI显示超买（高于60）

### 参数优化建议

| 参数 | 建议范围 | 说明 |
|------|----------|------|
| 布林带周期 | 15-25 | 调整以匹配市场周期 |
| 标准差倍数 | 1.5-2.5 | 较小值产生更频繁的信号，较大值减少假突破 |
| RSI阈值 | 35-45 / 55-65 | 根据市场波动性调整确认阈值 |

## 参数优化流程

无论使用哪种策略，都推荐以下优化流程：

1. **回测基线**：使用默认参数运行回测，记录基准性能
2. **单参数敏感性分析**：一次只调整一个参数，观察其对性能的影响
3. **定义优化目标**：明确优化的主要目标（最大化回报、最小化回撤、优化夏普比率等）
4. **网格搜索**：在合理范围内寻找参数最优组合
5. **前向测试**：使用未参与优化的数据集验证结果
6. **稳健性检查**：测试略微不同的参数设置，确保策略对参数不过度敏感

### 参数优化误区

1. **过度拟合**：过度优化历史数据会导致未来表现差
2. **忽略交易成本**：优化时应考虑手续费、滑点等
3. **单一指标优化**：不应只关注回报率，需兼顾风险控制
4. **忽略不同市场环境**：策略可能在不同市场环境中需要不同参数

## 实际应用建议

1. **从简单开始**：先使用基础策略，逐步添加复杂性
2. **保持策略可解释性**：了解每个组件的作用和意义
3. **定期回测和调整**：市场变化可能需要参数调整
4. **记录决策逻辑**：记录每次参数调整的原因和结果
5. **构建策略组合**：不同策略组合可能比单一策略表现更好


## 🆕 高级数学运算策略
### 策略概述
这是一个展示新数学运算功能的高级策略，利用纯数学模式计算复合指标和信号强度，结合内联常量实现灵活的参数调节。
### 完整配置
```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "macd_indicator",
        "type": "MACD",
        "params": {
          "column": "Close",
          "fast_period": 12,
          "slow_period": 26,
          "signal_period": 9
        }
      },
      {
        "id": "volume_ma",
        "type": "SMA",
        "params": {
          "column": "Volume",
          "period": 20
        }
      },
      {
        "id": "price_ma_short",
        "type": "SMA",
        "params": {
          "column": "Close",
          "period": 10
        }
      },
      {
        "id": "price_ma_long",
        "type": "SMA",
        "params": {
          "column": "Close",
          "period": 20
        }
      },
      {
        "id": "atr_indicator",
        "type": "ATR",
        "params": {
          "period": 14
        }
      }
    ],
    "signals": [
      {
        "id": "volume_ratio",
        "type": "Divide",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "column": "Volume"
          },
          {
            "ref": "volume_ma"
          }
        ]
      },
      {
        "id": "macd_difference",
        "type": "Subtract",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "ref": "macd_indicator.macd"
          },
          {
            "ref": "macd_indicator.signal"
          }
        ]
      },
      {
        "id": "macd_atr_ratio",
        "type": "Divide",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "ref": "macd_difference"
          },
          {
            "ref": "atr_indicator"
          }
        ]
      },
      {
        "id": "ma_difference",
        "type": "Subtract",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "ref": "price_ma_short"
          },
          {
            "ref": "price_ma_long"
          }
        ]
      },
      {
        "id": "ma_close_ratio",
        "type": "Divide",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "ref": "ma_difference"
          },
          {
            "column": "Close"
          }
        ]
      },
      {
        "id": "signal_strength",
        "type": "Multiply",
        "params": {
          "return_calculation": true
        },
        "inputs": [
          {
            "ref": "macd_atr_ratio"
          },
          {
            "ref": "ma_close_ratio"
          },
          {
            "type": "Constant",
            "value": 100
          }
        ]
      },
      {
        "id": "volume_filter",
        "type": "LessThan",
        "inputs": [
          {
            "ref": "volume_ratio"
          },
          {
            "type": "Constant",
            "value": 3
          }
        ]
      },
      {
        "id": "signal_threshold",
        "type": "GreaterThan",
        "inputs": [
          {
            "ref": "signal_strength"
          },
          {
            "type": "Constant",
            "value": 0.5
          }
        ]
      },
      {
        "id": "buy_signal",
        "type": "And",
        "inputs": [
          {
            "ref": "signal_threshold"
          },
          {
            "ref": "volume_filter"
          },
          {
            "type": "GreaterThan",
            "inputs": [
              {
                "ref": "volume_ratio"
              },
              {
                "type": "Constant",
                "value": 1.2
              }
            ]
          }
        ]
      },
      {
        "id": "sell_signal",
        "type": "Or",
        "inputs": [
          {
            "type": "LessThan",
            "inputs": [
              {
                "ref": "signal_strength"
              },
              {
                "type": "Constant",
                "value": -0.3
              }
            ]
          },
          {
            "type": "GreaterThan",
            "inputs": [
              {
                "ref": "volume_ratio"
              },
              {
                "type": "Constant",
                "value": 3
              }
            ]
          }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "buy_signal",
      "sell_signal": "sell_signal",
      "indicators": [
        {
          "id": "signal_strength",
          "output_name": "signal_score"
        },
        {
          "id": "volume_ratio",
          "output_name": "volume_factor"
        },
        {
          "id": "macd_atr_ratio",
          "output_name": "macd_momentum"
        },
        {
          "id": "ma_close_ratio",
          "output_name": "ma_trend"
        }
      ]
    }
  }
}
```
### 新功能特性说明
#### 1. 纯数学运算模式
使用 `return_calculation: true` 执行纯数学计算：
- **volume_ratio**: 计算成交量相对于平均值的倍数
- **macd_difference**: MACD线与信号线的差值
- **signal_strength**: 多因子复合信号强度评分
#### 2. 多操作数支持
`signal_strength` 信号展示了多操作数乘法：
```json
{
  "type": "Multiply",
  "params": {"return_calculation": true},
  "inputs": [
    {"ref": "macd_atr_ratio"},
    {"ref": "ma_close_ratio"}, 
    {"type": "Constant", "value": 100.0}
  ]
}
```
#### 3. 内联常量
无需预定义常量指标，直接使用内联格式：
```json
{"type": "Constant", "value": 1.2}
{"type": "Constant", "value": 3.0}
```
#### 4. 嵌套信号
在逻辑运算符中使用嵌套信号定义：
```json
{
  "type": "And",
  "inputs": [
    {"ref": "signal_threshold"},
    {
      "type": "GreaterThan",
      "inputs": [
        {"ref": "volume_ratio"},
        {"type": "Constant", "value": 1.2}
      ]
    }
  ]
}
```
### 策略优势
1. **灵活的数值计算**：直接获得计算结果，可用于复合指标构建
2. **简化配置**：减少中间指标定义，提高配置可读性
3. **动态阈值**：支持内联常量，便于快速调参
4. **复合评分**：多因子组合形成综合信号强度
### 参数调优建议
| 参数 | 位置 | 调优范围 | 说明 |
|------|------|----------|------|
| 信号强度阈值 | signal_threshold | 0.3-1.0 | 控制买入信号敏感度 |
| 成交量上限 | volume_filter | 2.0-5.0 | 过滤异常成交量 |
| 成交量下限 | buy_signal | 1.1-1.5 | 确保足够成交量支撑 |
| 强度缩放因子 | signal_strength | 50-200 | 调整复合评分的数值范围 |
## 实际应用建议

1. **从简单开始**：先使用基础策略，逐步添加复杂性
2. **保持策略可解释性**：了解每个组件的作用和意义
3. **定期回测和调整**：市场变化可能需要参数调整
4. **记录决策逻辑**：记录每次参数调整的原因和结果
5. **构建策略组合**：不同策略组合可能比单一策略表现更好
6. **🆕 善用新功能**：合理使用纯数学模式和内联常量提高策略灵活性

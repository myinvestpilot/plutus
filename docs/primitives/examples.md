# 完整策略示例

本文档提供了使用原语系统构建的完整交易策略示例，包括详细配置、参数优化建议和性能分析。这些示例可以作为构建自己策略的起点。

## RSI超买超卖策略

### 策略概述

这个经典策略基于RSI（相对强弱指数）的超买超卖状态，在市场超卖时买入，超买时卖出。

### 完整配置

```json
{
  "name": "RSI超买超卖策略",
  "code": "myinvestpilot_rsi_primitive",
  "description": "基于RSI指标的简单超买超卖交易策略",
  "strategy_definition": {
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
    },
    "capital_strategy": {
      "name": "PercentCapitalStrategy",
      "params": {
        "initial_capital": 100000,
        "percents": 50,
        "max_positions": null
      }
    }
  }
}
```

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

### 完整配置

```json
{
  "name": "双均线交叉策略",
  "code": "myinvestpilot_dual_ma_primitive",
  "description": "基于短期均线和长期均线交叉的趋势跟随策略",
  "strategy_definition": {
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
    },
    "capital_strategy": {
      "name": "PercentCapitalStrategy",
      "params": {
        "initial_capital": 100000,
        "percents": 100,
        "max_positions": null
      }
    }
  }
}
```

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

### 完整配置

```json
{
  "name": "沪深300股债轮动策略",
  "code": "stock_bond_switch_primitive",
  "description": "基于沪深300趋势的股债轮动策略",
  "symbols": [
    {"symbol": "510300", "name": "沪深300ETF"},
    {"symbol": "511260", "name": "10年期国债ETF"}
  ],
  "start_date": "2018-01-01",
  "end_date": "2025-01-01",
  "currency": "CNY",
  "market": "CN",
  "commission": 0.0003,
  "update_time": "01:00",
  "strategy_definition": {
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
    },
    "capital_strategy": {
      "name": "PercentCapitalStrategy",
      "params": {
        "initial_capital": 100000,
        "percents": 99,
        "max_positions": null
      }
    }
  }
}
```

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

### 完整配置

```json
{
  "name": "布林带突破策略",
  "code": "myinvestpilot_bbands_breakout",
  "description": "基于布林带突破的交易策略，使用RSI过滤假突破",
  "strategy_definition": {
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
    },
    "capital_strategy": {
      "name": "PercentCapitalStrategy",
      "params": {
        "initial_capital": 100000,
        "percents": 100,
        "max_positions": null
      }
    }
  }
}
```

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

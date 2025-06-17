# 市场指标原语指南

本文档介绍了如何在交易策略中使用市场指标原语，包括配置、转换器和与信号系统的集成使用。市场指标原语允许策略参考外部市场数据（如VIX、SPX等）进行决策，而不仅限于单一交易品种的价格数据。

## 基本概念

市场指标原语扩展了策略原语系统，使其能够引用和使用外部市场指标。这些指标通常代表整体市场状况（如VIX代表市场波动性）或特定市场细分（如SPX代表标普500指数）。

### 主要组件：

1. **市场指标管理器 (MarketIndicatorManager)**：负责加载和管理市场指标数据
2. **市场转换器 (MarketTransformers)**：对原始市场数据进行转换和处理
3. **信号评估器扩展 (SignalEvaluator)**：支持在信号树中引用市场指标

## 配置市场指标

在投资组合配置中添加市场指标需要在 `strategy_definition` 内部添加 `market_indicators` 部分：

```json
{
  "name": "使用市场指标的策略",
  "code": "market_aware_strategy",
  "description": "参考VIX指标的市场感知策略",
  "strategy_definition": {
    "market_indicators": {
      "indicators": [
        {
          "code": "VIX"
        }
      ],
      "transformers": [
        {
          "name": "vix_raw",
          "type": "IdentityTransformer",
          "params": {
            "indicator": "VIX",
            "field": "Close"
          }
        },
        {
          "name": "vix_percentile",
          "type": "PercentileRankTransformer",
          "params": {
            "indicator": "VIX",
            "lookback": 252,
            "field": "Close"
          }
        }
      ]
    },
    // 其余策略配置...
  }
}
```

### 指标配置选项：

| 字段 | 说明 | 示例 |
|------|------|------|
| code | 市场指标代码 | "VIX", "SPX" |
| start_date | 数据开始日期（可选） | "2018-01-01" |
| end_date | 数据结束日期（可选） | "2022-12-31" |

> **注意：** 如果不指定时间范围，系统将使用投资组合的时间范围

## 市场指标转换器

转换器允许对原始市场数据进行转换和处理，生成新的派生时间序列。系统内置了以下转换器：

### 1. 移动平均转换器 (MovingAverageTransformer)

计算指定窗口的移动平均值。

```json
{
  "name": "spx_ma50",
  "type": "MovingAverageTransformer",
  "params": {
    "indicator": "SPX",
    "window": 50,
    "method": "simple",  // simple/weighted/exponential
    "field": "Close"
  }
}
```

### 2. 百分位排名转换器 (PercentileRankTransformer)

计算当前值在历史窗口中的百分位排名（0-100）。

```json
{
  "name": "vix_percentile",
  "type": "PercentileRankTransformer",
  "params": {
    "indicator": "VIX",
    "lookback": 252,  // 注意：使用lookback而不是window
    "field": "Close"
  }
}
```

### 3. 相对强度转换器 (RelativeStrengthTransformer)

计算当前值相对于历史平均值的强度比率。

```json
{
  "name": "spx_rs",
  "type": "RelativeStrengthTransformer",
  "params": {
    "indicator": "SPX",
    "window": 90,
    "field": "Close",
    "reference": "ma"  // ma, value 或 lookback
  }
}
```

### 4. Z分数转换器 (ZScoreTransformer)

计算当前值在历史窗口中的标准化分数（Z分数）。

```json
{
  "name": "vix_zscore",
  "type": "ZScoreTransformer",
  "params": {
    "indicator": "VIX",
    "window": 252,
    "field": "Close"
  }
}
```

### 5. 原样返回转换器 (IdentityTransformer)

直接返回原始指标数据，不做任何转换。通常用于统一处理市场指标的原始数据。

```json
{
  "name": "vix_raw",
  "type": "IdentityTransformer",
  "params": {
    "indicator": "VIX",  // indicator 参数是必须的
    "field": "Close"
  }
}
```

使用示例：

```json
{
  "market_indicators": {
    "indicators": [{"code": "VIX"}],
    "transformers": [
      {
        "name": "vix_raw",
        "type": "IdentityTransformer",
        "params": {
          "indicator": "VIX",
          "field": "Close"
        }
      }
    ]
  },
  "outputs": {
    "market_indicators": [
      {
        "market": "VIX",
        "transformer": "vix_raw",
        "output_name": "vix_raw"
      }
    ]
  }
}
```

这种方式统一了市场指标的处理流程，无论是原始数据还是转换后的数据都通过转换器机制处理。

## 在信号中引用市场指标

市场指标可以在信号配置中使用 `market` 键进行引用：

### 1. 通过转换器引用

```json
{ "market": "VIX", "transformer": "vix_percentile" }  // 引用VIX的百分位转换
```

### 2. 原始指标数据引用

```json
{
  "market": "VIX",
  "transformer": "vix_raw"
}  // 使用 IdentityTransformer 引用VIX的原始数据
```

完整的信号配置示例：

```json
{
  "id": "market_volatility_low",
  "type": "LessThan",
  "epsilon": 0.5,  // 可选参数，用于处理浮点数比较的精度问题
  "inputs": [
    { "market": "VIX", "transformer": "vix_percentile" },
    { "ref": "constant_75" }  // 引用常量指标，而不是直接使用value
  ]
}
```

> **重要：** 系统要求所有市场指标数据的访问都通过转换器进行，这样可以保持数据处理流程的一致性。

## 逻辑操作符限制

在信号系统中，逻辑操作符（如 `And`、`Or`）有严格的输入限制：

1. **And 和 Or 操作符严格要求两个输入**，不多不少
2. 要组合多个条件，需要使用嵌套结构

示例：三个条件的组合需要嵌套实现

```json
// 错误 - And不能有3个输入
{
  "id": "combined_conditions",
  "type": "And",
  "inputs": [
    { "ref": "condition1" },
    { "ref": "condition2" },
    { "ref": "condition3" }
  ]
}

// 正确 - 使用嵌套And实现多条件组合
{
  "id": "conditions_1_2",
  "type": "And",
  "inputs": [
    { "ref": "condition1" },
    { "ref": "condition2" }
  ]
},
{
  "id": "combined_conditions",
  "type": "And",
  "inputs": [
    { "ref": "conditions_1_2" },
    { "ref": "condition3" }
  ]
}
```

## 市场指标策略示例

### 示例1：VIX过滤策略

此策略仅在VIX指标显示市场波动性相对较低（低于75百分位）或处于下降趋势（低于短期均线）时进行交易。

```json
{
  "strategy_definition": {
    "market_indicators": {
      "indicators": [{"code": "VIX"}],
      "transformers": [
        {
          "name": "vix_raw",
          "type": "IdentityTransformer",
          "params": {
            "indicator": "VIX",
            "field": "Close"
          }
        },
        {
          "name": "vix_percentile",
          "type": "PercentileRankTransformer",
          "params": {"indicator": "VIX", "lookback": 252, "field": "Close"}
        },
        {
          "name": "vix_ma",
          "type": "MovingAverageTransformer",
          "params": {"indicator": "VIX", "window": 20, "method": "simple", "field": "Close"}
        }
      ]
    },
    "trade_strategy": {
      "indicators": [
        {
          "id": "constant_75",
          "type": "Constant",
          "params": {
            "value": 75
          }
        }
      ],
      "signals": [
        {
          "id": "market_volatility_low",
          "type": "LessThan",
          "epsilon": 0.5,
          "inputs": [
            { "market": "VIX", "transformer": "vix_percentile" },
            { "ref": "constant_75" }
          ]
        },
        {
          "id": "market_volatility_declining",
          "type": "LessThan",
          "inputs": [
            { "market": "VIX", "transformer": "vix_raw" },
            { "market": "VIX", "transformer": "vix_ma" }
          ]
        },
        {
          "id": "market_condition_good",
          "type": "Or",
          "inputs": [
            { "ref": "market_volatility_low" },
            { "ref": "market_volatility_declining" }
          ]
        },
        {
          "id": "buy_signal_condition",
          "type": "And",
          "inputs": [
            { "ref": "price_gt_ma" },
            { "ref": "market_condition_good" }
          ]
        }
      ],
      "outputs": {
        "market_indicators": [
          {
            "market": "VIX",
            "transformer": "vix_raw",
            "output_name": "vix_raw"
          },
          {
            "market": "VIX",
            "transformer": "vix_percentile",
            "output_name": "vix_percentile"
          },
          {
            "market": "VIX",
            "transformer": "vix_ma",
            "output_name": "vix_ma"
          }
        ]
      }
    }
  }
}
```

### 示例2：市场趋势跟踪策略

此策略使用大盘指数（如SPX）的趋势来过滤交易机会，只有在市场处于上升趋势且相对强度良好时才买入。

```json
{
  "strategy_definition": {
    "market_indicators": {
      "indicators": [{"code": "SPX"}],
      "transformers": [
        {
          "name": "spx_raw",
          "type": "IdentityTransformer",
          "params": {
            "indicator": "SPX",
            "field": "Close"
          }
        },
        {
          "name": "spx_ma50",
          "type": "MovingAverageTransformer",
          "params": {"indicator": "SPX", "window": 50, "method": "simple", "field": "Close"}
        },
        {
          "name": "spx_ma200",
          "type": "MovingAverageTransformer",
          "params": {"indicator": "SPX", "window": 200, "method": "simple", "field": "Close"}
        },
        {
          "name": "spx_rs",
          "type": "RelativeStrengthTransformer",
          "params": {
            "indicator": "SPX",
            "window": 90,
            "field": "Close",
            "reference": "ma"
          }
        }
      ]
    },
    "trade_strategy": {
      "signals": [
        {
          "id": "market_uptrend",
          "type": "GreaterThan",
          "inputs": [
            { "market": "SPX", "transformer": "spx_ma50" },
            { "market": "SPX", "transformer": "spx_ma200" }
          ]
        },
        {
          "id": "market_strength_rising",
          "type": "GreaterThan",
          "inputs": [
            { "market": "SPX", "transformer": "spx_rs" },
            { "type": "Constant", "value": 1.0 }
          ]
        },
        {
          "id": "market_environment_bullish",
          "type": "And",
          "inputs": [
            { "ref": "market_uptrend" },
            { "ref": "market_strength_rising" }
          ]
        },
        {
          "id": "market_price_reference",
          "type": "GreaterThan",
          "inputs": [
            { "market": "SPX", "transformer": "spx_raw" },
            { "type": "Constant", "value": 0 }
          ]
        },
        {
          "id": "buy_signal_condition",
          "type": "And",
          "inputs": [
            { "ref": "stock_technical_bullish" },
            { "ref": "market_environment_bullish" }
          ]
        }
      ],
      "outputs": {
        "market_indicators": [
          {
            "market": "SPX",
            "transformer": "spx_raw",
            "output_name": "spx"
          },
          {
            "market": "SPX",
            "transformer": "spx_ma50",
            "output_name": "spx_ma50"
          },
          {
            "market": "SPX",
            "transformer": "spx_ma200",
            "output_name": "spx_ma200"
          },
          {
            "market": "SPX",
            "transformer": "spx_rs",
            "output_name": "spx_rs"
          }
        ]
      }
    }
  }
}
```

## 最佳实践

1. **明确引用要求**：市场指标转换器必须在信号计算树中被明确引用和使用，才能触发数据处理和收集。仅在 `outputs.market_indicators` 中列出但未在信号中使用的转换器不会被处理和输出。

2. **创建参考信号**：如果需要在输出中包含某个市场指标（如原始SPX数据），但该指标在主要信号逻辑中没有直接使用，可以创建一个专用的参考信号：

   ```json
   {
     "id": "market_price_reference",
     "type": "GreaterThan",
     "inputs": [
       { "market": "SPX", "transformer": "spx_raw" },
       { "type": "Constant", "value": 0 }
     ]
   }
   ```

   然后将此信号添加到outputs.indicators中：

   ```json
   { "id": "market_price_reference", "output_name": "spx_ref" }
   ```

3. **统一转换器处理**：始终使用转换器处理市场指标数据，包括原始数据（使用IdentityTransformer）
4. **使用正确的参数名称**：
   - 对于PercentileRankTransformer，使用`lookback`而不是`window`
   - 对于所有转换器，使用`field`而不是`column`
   - 字段名称区分大小写，通常使用`Close`而不是`close`
5. **使用epsilon参数**：在LessThan和GreaterThan信号中，可以使用`epsilon`参数处理浮点数比较的精度问题
6. **使用常量指标**：对于固定阈值，最好创建常量指标并引用它，而不是直接使用`value`属性
7. **明确注册管理**：所有市场指标转换器必须在配置中明确定义并正确注册后才能被引用
8. **数据同步**：确保市场指标数据与交易资产数据的日期范围匹配
9. **转换器命名**：为转换器使用清晰的命名约定，如 `vix_percentile`、`spx_ma50` 等
10. **性能优化**：使用适当的数据窗口大小，避免过长的历史窗口导致性能问题

## 技术限制

1. 市场指标数据必须通过数据加载器可用
2. 市场指标的时间序列必须与回测期间有足够的重叠
3. 引用不存在的市场指标或转换器会立即抛出异常，不进行降级处理
4. 逻辑操作符（如And、Or）严格要求两个输入，必须使用嵌套结构处理更多条件
5. 所有市场指标数据访问必须通过转换器进行，不支持直接访问原始数据
6. 参数名称必须正确，系统不会自动纠正错误的参数名称

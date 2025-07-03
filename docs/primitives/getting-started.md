# 原语策略快速入门

本指南旨在帮助您快速上手原语策略系统，通过几个简单的例子，让您了解如何使用原语组件构建交易策略。无需深入了解复杂的编程概念，只需掌握基本的JSON配置格式，您就能创建自己的交易策略。

在开始配置原语策略之前，我们强烈建议您先访问[原语策略可视化编辑器](https://www.myinvestpilot.com/primitives-editor/)。这个直观的可视化工具可以帮助您：

- 以图形化方式构建和编辑策略
- 实时预览策略配置的 JSON 结构
- 快速理解原语组件之间的关系
- 避免手动编写 JSON 时的常见错误

通过可视化编辑器，您可以更轻松地掌握原语策略的配置方法，为后续的策略开发打下坚实基础。

## ⚠️ 重要说明：原语策略配置 vs 完整组合配置

**请注意区分以下两个概念：**

### 原语策略配置
在前端原语策略页面中，您只需要配置：
- `trade_strategy`（必须）：包含指标、信号和输出的核心交易逻辑
- `market_indicators`（可选）：当trade_strategy中使用市场指标时必须包含

### 完整组合配置  
完整的投资组合配置还包含：
- 基本信息（name、code、description等）
- 交易标的（symbols）
- 时间参数（start_date、end_date等）
- 市场参数（currency、market、commission等）
- 资金管理策略（capital_strategy）

**重要规则：**
- 如果您的`trade_strategy`中使用了市场指标引用（如`{"market": "000300.SH", "transformer": "hs300_raw"}`），则必须在`market_indicators`中定义相应的指标和转换器
- 如果没有定义market_indicators但trade_strategy中引用了市场指标，回测将会失败
- 前端JSON schema只会将market_indicators标记为可选，但实际使用时可能是必须的

## 1. 原语策略系统简介

### 什么是原语策略？

原语策略是一种基于组件化思想的交易策略构建方法。在这个系统中，复杂的交易逻辑被分解为简单、可重用的基本组件（称为"原语"），这些组件可以像乐高积木一样自由组合，构建出各种复杂度的交易策略。

### 原语策略的优势

1. **可组合性**：原语组件可以自由组合，创建无限可能的策略
2. **可测试性**：每个组件都可以单独测试，确保其正确性
3. **可维护性**：当需要修改策略时，只需调整相关组件，而不是重写整个策略
4. **透明性**：策略的每个部分都有明确的功能和输出，便于理解和调试
5. **无需编程**：通过JSON配置文件即可定义策略，无需编写代码

### 原语策略与传统策略的区别

传统的交易策略通常是一段连续的代码，将数据处理、信号生成和交易决策混合在一起。而原语策略将这些功能分解为独立的组件，每个组件负责特定的功能，然后通过配置文件将它们连接起来。

这种方法的主要区别在于：

- **传统策略**：一体化、难以修改部分功能、难以重用代码
- **原语策略**：模块化、易于修改单个功能、组件可重用

## 2. 原语策略的基本组成部分

一个完整的原语策略通常包含以下几个部分：

### 指标组件（Indicators）

指标组件负责计算各种技术指标，如移动平均线、RSI、MACD等。这些组件接收价格数据作为输入，输出计算后的指标值。

例如，一个简单的移动平均线指标组件配置如下：

```json
{
  "id": "sma20",
  "type": "SMA",
  "params": {
    "period": 20,
    "column": "Close"
  }
}
```

### 信号组件（Signals）

信号组件负责根据指标值生成交易信号。它们可以比较不同的指标，检测交叉点，或者应用其他逻辑规则来确定何时买入或卖出。

例如，一个检测价格是否高于移动平均线的信号组件配置如下：

```json
{
  "id": "price_above_sma",
  "type": "GreaterThan",
  "inputs": [
    { "column": "Close" },
    { "ref": "sma20" }
  ]
}
```

### 逻辑组合（Logic Combinations）

逻辑组合器允许您将多个信号组合在一起，使用AND、OR、NOT等逻辑操作符。这使您可以创建复杂的条件，如"当RSI低于30且价格高于20日均线时买入"。

例如，一个组合两个信号的逻辑组件配置如下：

```json
{
  "id": "buy_condition",
  "type": "And",
  "inputs": [
    { "ref": "rsi_oversold" },
    { "ref": "price_above_sma" }
  ]
}
```

### 资金管理策略（Capital Strategy）

资金管理策略决定了每次交易投入多少资金。系统提供了几种不同的资金管理策略，可以根据不同的需求选择合适的策略。

例如，一个基于总资产百分比的资金管理策略配置如下：

```json
"capital_strategy": {
  "name": "PercentCapitalStrategy",
  "params": {
    "initial_capital": 100000,
    "percents": 20,
    "max_positions": null
  }
}
```

这个策略会将总资产的20%分配给每个交易标的，`max_positions`参数可以限制最大持仓数量。

## 3. 第一个原语策略：简单移动平均线交叉

让我们从一个简单的策略开始：使用短期移动平均线和长期移动平均线的交叉来生成交易信号。这是一个经典的趋势跟踪策略。

### 策略思路

- 当短期移动平均线（如20日均线）上穿长期移动平均线（如50日均线）时买入
- 当短期移动平均线下穿长期移动平均线时卖出
- 使用SPY（S&P 500 ETF）和QQQ（纳斯达克100 ETF）作为交易标的

### 原语策略配置代码

以下是这个策略的**原语策略配置**（仅包含前端原语策略页面需要的部分）：

```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "sma20",
        "type": "SMA",
        "params": {
          "period": 20,
          "column": "Close"
        }
      },
      {
        "id": "sma50",
        "type": "SMA",
        "params": {
          "period": 50,
          "column": "Close"
        }
      }
    ],
    "signals": [
      {
        "id": "sma20_cross_above_sma50",
        "type": "Crossover",
        "params": { "mode": "simple" },
        "inputs": [
          { "ref": "sma20" },
          { "ref": "sma50" }
        ]
      },
      {
        "id": "sma20_cross_below_sma50",
        "type": "Crossunder",
        "params": { "mode": "simple" },
        "inputs": [
          { "ref": "sma20" },
          { "ref": "sma50" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "sma20_cross_above_sma50",
      "sell_signal": "sma20_cross_below_sma50"
    }
  }
}
```

**说明：** 这个策略不需要`market_indicators`，因为所有指标都基于当前标的的OHLC数据。

### 完整组合配置示例

如果您需要完整的组合配置（用于API调用或完整回测），可以参考以下格式：

```json
{
  "name": "简单均线交叉策略",
  "code": "simple_ma_cross",
  "description": "使用20日均线和50日均线的交叉生成交易信号",
  "strategy_definition": {
    // 上面的原语策略配置 + 资金管理策略
    "capital_strategy": {
      "name": "PercentCapitalStrategy",
      "params": {
        "initial_capital": 100000,
        "percents": 20
      }
    }
  },
  "symbols": [
    {"symbol": "SPY", "name": "S&P 500 ETF"},
    {"symbol": "QQQ", "name": "Nasdaq ETF"}
  ],
  "start_date": "2018-01-01",
  "currency": "USD",
  "market": "US",
  "commission": 0.0001,
  "update_time": "08:00"
}
```

### 配置解析

让我们逐步解析这个配置：

1. **基本信息**：
   - `name`：策略名称
   - `code`：策略代码，用于在系统中唯一标识这个策略
   - `description`：策略描述
   - `symbols`：交易标的列表
   - `start_date`：回测起始日期

2. **指标定义**：
   - 定义了两个移动平均线指标：20日均线和50日均线
   - 每个指标都有一个唯一的ID，用于在后续的信号定义中引用

3. **信号定义**：
   - `sma20_cross_above_sma50`：检测20日均线上穿50日均线
   - `sma20_cross_below_sma50`：检测20日均线下穿50日均线
   - 每个信号通过`inputs`引用之前定义的指标

4. **输出映射**：
   - `buy_signal`：将`sma20_cross_above_sma50`信号映射为买入信号
   - `sell_signal`：将`sma20_cross_below_sma50`信号映射为卖出信号

5. **资金管理**：
   - 使用百分比资金管理策略
   - 初始资金10万
   - 每个标的分配20%的资金

## 4. 第二个原语策略：RSI超买超卖

接下来，让我们尝试一个基于RSI（相对强弱指数）的策略。RSI是一个常用的动量指标，用于识别市场的超买或超卖状态。

### 策略思路

- 当RSI低于30（超卖状态）时买入
- 当RSI高于70（超买状态）时卖出
- 使用与第一个策略相同的交易标的

### 原语策略配置代码

以下是这个策略的**原语策略配置**：

```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "rsi",
        "type": "RSI",
        "params": {
          "period": 14,
          "column": "Close"
        }
      },
      {
        "id": "buy_threshold",
        "type": "Constant",
        "params": {
          "value": 30
        }
      },
      {
        "id": "sell_threshold",
        "type": "Constant",
        "params": {
          "value": 70
        }
      }
    ],
    "signals": [
      {
        "id": "rsi_oversold",
        "type": "LessThan",
        "inputs": [
          { "ref": "rsi" },
          { "ref": "buy_threshold" }
        ]
      },
      {
        "id": "rsi_overbought",
        "type": "GreaterThan",
        "inputs": [
          { "ref": "rsi" },
          { "ref": "sell_threshold" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "rsi_oversold",
      "sell_signal": "rsi_overbought"
    }
  }
}
```

**说明：** 这个策略同样不需要`market_indicators`，因为只使用了基于当前标的OHLC数据的指标。

### 配置解析

让我们重点解析与第一个策略不同的部分：

1. **RSI指标**：
   - 使用14天周期的RSI指标
   - RSI是一个范围在0-100之间的指标，通常用于衡量价格动量

2. **常量指标**：
   - 定义了两个常量指标：`buy_threshold`（值为30）和`sell_threshold`（值为70）
   - 这些常量用于与RSI值进行比较

3. **信号定义**：
   - `rsi_oversold`：检测RSI是否低于30（超卖状态）
   - `rsi_overbought`：检测RSI是否高于70（超买状态）
   - 使用`LessThan`和`GreaterThan`信号类型进行比较

4. **输出映射**：
   - `buy_signal`：将`rsi_oversold`信号映射为买入信号
   - `sell_signal`：将`rsi_overbought`信号映射为卖出信号

## 5. 组合多个信号：RSI + 移动平均线

现在，让我们尝试组合多个信号，创建一个更复杂的策略。我们将结合RSI和移动平均线，要求同时满足多个条件才生成交易信号。

### 策略思路

- 当RSI低于30（超卖状态）**且**价格高于20日均线时买入
- 当RSI高于70（超买状态）**或**价格低于20日均线时卖出
- 这种组合既考虑了价格动量（RSI），又考虑了价格趋势（移动平均线）

### 原语策略配置代码

```json
{
  "trade_strategy": {
    "indicators": [
      {
        "id": "rsi",
        "type": "RSI",
        "params": {
          "period": 14,
          "column": "Close"
        }
      },
      {
        "id": "sma20",
        "type": "SMA",
        "params": {
          "period": 20,
          "column": "Close"
        }
      },
      {
        "id": "buy_threshold",
        "type": "Constant",
        "params": {
          "value": 30
        }
      },
      {
        "id": "sell_threshold",
        "type": "Constant",
        "params": {
          "value": 70
        }
      }
    ],
    "signals": [
      {
        "id": "rsi_oversold",
        "type": "LessThan",
        "inputs": [
          { "ref": "rsi" },
          { "ref": "buy_threshold" }
        ]
      },
      {
        "id": "rsi_overbought",
        "type": "GreaterThan",
        "inputs": [
          { "ref": "rsi" },
          { "ref": "sell_threshold" }
        ]
      },
      {
        "id": "price_above_sma",
        "type": "GreaterThan",
        "inputs": [
          { "column": "Close" },
          { "ref": "sma20" }
        ]
      },
      {
        "id": "price_below_sma",
        "type": "LessThan",
        "inputs": [
          { "column": "Close" },
          { "ref": "sma20" }
        ]
      },
      {
        "id": "buy_condition",
        "type": "And",
        "inputs": [
          { "ref": "rsi_oversold" },
          { "ref": "price_above_sma" }
        ]
      },
      {
        "id": "sell_condition",
        "type": "Or",
        "inputs": [
          { "ref": "rsi_overbought" },
          { "ref": "price_below_sma" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "buy_condition",
      "sell_signal": "sell_condition"
    }
  }
}
```

**说明：** 这个策略仍然不需要`market_indicators`，因为所有指标都是基于当前标的的数据。

### 配置解析

这个策略结合了前两个策略的元素，并添加了逻辑组合器。让我们重点解析新增的部分：

1. **信号组合**：
   - `buy_condition`：使用`And`逻辑组合器，要求同时满足`rsi_oversold`和`price_above_sma`两个条件
   - `sell_condition`：使用`Or`逻辑组合器，只要满足`rsi_overbought`或`price_below_sma`任一条件即可

2. **逻辑组合器的工作原理**：
   - `And`组合器：只有当所有输入信号都为真时，输出信号才为真
   - `Or`组合器：只要有一个输入信号为真，输出信号就为真
   - `Not`组合器（本例未使用）：将输入信号的真假值取反

3. **输出映射**：
   - `buy_signal`：将组合后的`buy_condition`信号映射为买入信号
   - `sell_signal`：将组合后的`sell_condition`信号映射为卖出信号

## 6. 使用市场指标的策略示例

让我们看一个需要使用`market_indicators`的策略示例。这个策略使用沪深300指数的趋势来决定是否买入股票。

### 原语策略配置代码

```json
{
  "market_indicators": {
    "indicators": [
      {"code": "000300.SH"}
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
        "id": "rsi",
        "type": "RSI",
        "params": {
          "period": 14,
          "column": "Close"
        }
      },
      {
        "id": "rsi_threshold",
        "type": "Constant",
        "params": {
          "value": 30
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
        "id": "rsi_oversold",
        "type": "LessThan",
        "inputs": [
          { "ref": "rsi" },
          { "ref": "rsi_threshold" }
        ]
      },
      {
        "id": "buy_signal",
        "type": "And",
        "inputs": [
          { "ref": "market_trend_up" },
          { "ref": "rsi_oversold" }
        ]
      }
    ],
    "outputs": {
      "buy_signal": "buy_signal",
      "sell_signal": "rsi_oversold"
    }
  }
}
```

**重要说明：**
- 因为`trade_strategy`中使用了市场指标引用（`{"market": "000300.SH", "transformer": "hs300_raw"}`），所以**必须**包含`market_indicators`配置
- 如果缺少`market_indicators`，即使前端校验通过，回测也会失败
- `market_indicators`定义了可用的市场指标及其转换器

## 7. 资金管理策略说明

**注意：** 在原语策略配置中，您不需要配置资金管理策略。资金管理策略是在创建完整组合时设置的。

### 何时需要配置资金管理

资金管理策略在创建完整投资组合时配置，包括：
- 每次交易的资金分配比例
- 最大持仓数量限制
- 定投策略等

在原语策略开发阶段，您专注于交易逻辑，无需关心资金管理细节。

## 8. 调试与优化

在开发原语策略时，您可能会遇到各种问题，如信号不触发、交易过于频繁、配置错误等。

### 获取详细帮助

由于调试和故障排除涉及的内容较为复杂，我们为您准备了两个专门的详细指南：

#### 📚 入门级故障排除
**[策略原语系统故障排除指南](/docs/primitives/troubleshooting)**

适合初学者，涵盖：
- 常见配置错误及解决方案
- 数据和信号问题诊断
- 策略行为异常排查
- 性能优化技巧
- 系统调试方法
- 组件使用陷阱避免

#### 🔬 高级信号分析
**[原语组件高级故障排除指南](/docs/primitives/advanced/troubleshooting)**

适合有经验的用户，教您如何编写SQL进行复杂分析：
- 策引平台信号分析工具详细使用方法
- 专业SQL查询语句编写技巧
- 信号数据库下载和本地分析
- 深度验证中间指标计算正确性
- 信号切换逻辑和交易频率分析
- 实际案例分析和问题诊断

### 快速检查清单

遇到问题时，请首先检查：

1. ✅ **配置格式**：JSON语法是否正确
2. ✅ **组件引用**：所有ref引用的组件是否已定义
3. ✅ **市场指标依赖**：如使用市场指标引用，是否包含market_indicators配置
4. ✅ **参数类型**：数值参数是否为数字类型（不带引号）
5. ✅ **输入数量**：信号组件的输入数量是否正确

### 简单调试方法

**查看计算结果**：在outputs中添加中间指标，这些数据会写入信号数据库供分析

```json
"outputs": {
  "buy_signal": "buy_signal",
  "sell_signal": "sell_signal", 
  "indicators": [
    { "id": "rsi_indicator", "output_name": "rsi" },
    { "id": "price_above_sma", "output_name": "trend_up" }
  ]
}
```

**信号数据库分析**：
- 所有中间指标和信号都会存储在SQLite数据库中
- 可以下载信号数据库并运行SQL查询分析：
  - 检查中间指标计算是否正确
  - 验证最终信号是否符合逻辑
  - 分析信号切换的合理性

**内置分析工具**：
策引平台为每个组合提供了**策略交易信号深度分析**功能，内置了8个专业SQL查询工具：

**🔴 关键分析**：
- 🏥 **数据健康检查** - 验证信号数据的完整性和有效性
- 🎯 **信号有效性分析** - 评估买卖信号的预测准确性和盈利能力
- ⚠️ **风险信号识别** - 识别策略中的潜在风险因素
- 📈 **波动性分析** - 分析各标的价格波动性，识别高风险资产和杠杆特征

**🟡 重要分析**：
- ⏰ **交易时机分析** - 了解策略的交易频率和节奏特征
- 🌍 **市场适应性分析** - 策略在不同市场环境下的表现评估

**🔵 辅助分析**：
- 🔄 **信号切换逻辑检查** - 验证信号状态转换的合理性
- 📊 **信号分布分析** - 分析信号类型分布和策略风格

**查看示例**：可以访问[策引组合示例](https://www.myinvestpilot.com/portfolios/myinvestpilot_us_global/)，点击组合页面的"策略交易信号深度分析"了解详细功能。

**遇到问题？** 
- **初学者**：参考[入门故障排除指南](/docs/primitives/troubleshooting)
- **进阶用户**：学习[高级SQL分析技巧](/docs/primitives/advanced/troubleshooting)进行深度诊断
- **快速分析**：使用组合页面内置的8个SQL分析工具自动检查策略

## 9. 下一步学习

恭喜您完成了原语策略的快速入门指南！以下是一些建议的下一步学习内容：

1. **探索更多指标**：了解系统支持的其他技术指标，如布林带、MACD、KD等
2. **学习高级组合**：尝试创建更复杂的信号组合，如多重条件、时间过滤等
3. **研究资金管理**：深入了解不同资金管理策略的优缺点和适用场景
4. **回测分析**：学习如何分析回测结果，评估策略的优劣

### 推荐阅读

- [架构概述](/docs/primitives/architecture)：了解原语策略系统的整体架构
- [指标原语详解](/docs/primitives/indicators)：详细介绍系统支持的所有指标
- [信号原语详解](/docs/primitives/signals)：深入了解信号组件的工作原理
- [组合模式](/docs/primitives/composition)：学习如何创建复杂的信号组合
- [策略示例](/docs/primitives/examples)：查看更多策略示例
- [故障排除](/docs/primitives/troubleshooting)：解决常见问题的指南
- [市场指标](/docs/primitives/advanced/market-indicators)：了解市场指标的使用
- [高级故障排除](/docs/primitives/advanced/troubleshooting)：高级故障排除技巧
- [策略优化](/docs/primitives/advanced/optimization)：学习如何优化策略性能

### 实践练习

尝试修改本指南中的示例策略，创建您自己的交易策略。您可以：

1. 更改指标参数（如RSI的周期、移动平均线的长度）
2. 尝试不同的指标组合（如MACD、布林带）
3. 调整买入和卖出条件
4. 测试不同的资金管理策略

通过实践，您将更好地理解原语策略系统的工作原理，并能够创建适合自己风险偏好的交易策略。
# 原语策略快速入门

本指南旨在帮助您快速上手原语策略系统，通过几个简单的例子，让您了解如何使用原语组件构建交易策略。无需深入了解复杂的编程概念，只需掌握基本的JSON配置格式，您就能创建自己的交易策略。

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

### 完整配置代码

以下是这个策略的完整JSON配置：

```json
{
  "name": "简单均线交叉策略",
  "code": "simple_ma_cross",
  "description": "使用20日均线和50日均线的交叉生成交易信号",
  "strategy_definition": {
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
    },
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

### 完整配置代码

以下是这个策略的完整JSON配置：

```json
{
  "name": "RSI超买超卖策略",
  "code": "simple_rsi",
  "description": "使用RSI指标的超买超卖状态生成交易信号",
  "strategy_definition": {
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
    },
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

### 完整配置代码

```json
{
  "name": "RSI与均线组合策略",
  "code": "rsi_ma_combined",
  "description": "结合RSI和移动平均线生成交易信号",
  "strategy_definition": {
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
    },
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

## 6. 调整资金管理策略

到目前为止，我们一直使用相同的资金管理策略：为每个交易标的分配20%的资金。现在，让我们探讨一下不同的资金管理选项。

### 资金管理的重要性

资金管理是交易策略的关键组成部分，它决定了：

- 每次交易投入多少资金
- 如何在不同的交易标的之间分配资金
- 如何管理风险

良好的资金管理可以显著提高策略的风险调整后收益，即使交易信号保持不变。

### 可用的资金管理策略

系统提供了几种不同的资金管理策略：

1. **PercentCapitalStrategy**：基于总资产的固定百分比分配资金
   - 例如，如果总资产为100,000，percents为20，则每次买入交易的资金为20,000
   - 如果当前可用现金不足20,000，则分配现有现金

2. **SimplePercentCapitalStrategy**：基于可用现金的固定百分比分配资金
   - 例如，如果可用现金为10,000，percents为20，则每次买入交易的资金为2,000
   - 与PercentCapitalStrategy不同，本策略基于当前可用现金而非总资产计算

3. **FixedInvestmentStrategy**：定期定投策略，支持年度和月度定投
   - 可以设置定投频率（年度或月度）和定投金额
   - 系统会在指定的时间点自动添加资金，模拟定期投资行为

### 示例：定期定投策略

以下是一个使用定期定投策略的配置示例：

```json
"capital_strategy": {
  "name": "FixedInvestmentStrategy",
  "params": {
    "initial_capital": 100000,
    "investment_amount": 10000,
    "investment_frequency": "m",
    "percents": 20,
    "max_positions": null
  }
}
```

这个策略会：

- 设置初始资金为100,000
- 每月自动投入10,000（因为`investment_frequency`设为`m`，表示月度定投）
- 每次交易分配可用现金的20%
- 不限制最大持仓数量（`max_positions`为null）

### 资金管理对策略表现的影响

不同的资金管理策略会对策略的整体表现产生显著影响：

- **风险**：适当的资金管理可以降低投资组合的波动性和最大回撤
- **收益**：合理分配资金可以提高策略的整体收益
- **稳定性**：良好的资金管理可以使策略表现更加稳定，减少极端情况

## 7. 调试与优化技巧

在开发和优化原语策略时，以下技巧将帮助您更有效地工作：

### 查看中间计算结果

系统会将所有指标和信号的计算结果保存在SQLite数据库中，您可以查询这些数据来了解策略的内部工作情况：

```bash
sqlite3 data/your_strategy_code/your_strategy_code_signals.db "SELECT * FROM trade_signals ORDER BY date DESC LIMIT 10;"
```

这将显示最近10天的交易信号，包括所有指标和信号的值。

### 常见问题与解决方案

1. **没有生成交易信号**：
   - 检查买入和卖出条件是否过于严格
   - 确保指标参数合理，例如RSI的周期不要太长
   - 验证逻辑组合器的输入是否正确

2. **交易过于频繁**：
   - 考虑添加过滤条件，如最小持有时间
   - 调整指标参数，如增加移动平均线的周期
   - 使用更严格的买入/卖出条件

3. **回测结果不理想**：
   - 尝试不同的指标组合
   - 调整指标参数
   - 考虑更改资金管理策略

### 优化策略的基本步骤

1. **确定基准**：明确您的策略要优于哪个基准（如买入并持有SPY）
2. **识别关键参数**：确定哪些参数对策略表现影响最大
3. **系统性测试**：对关键参数进行系统性测试，找出最优组合
4. **避免过度拟合**：确保策略在不同市场环境下都能表现良好
5. **考虑交易成本**：在优化过程中考虑交易成本和滑点

## 8. 下一步学习

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
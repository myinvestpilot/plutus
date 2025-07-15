# 信号原语参考指南

信号原语(Signal Primitives)是用于生成交易信号的组件，它们接收一个或多个时间序列作为输入，并输出布尔型时间序列(true/false)。这些组件可以组合成复杂的交易条件。

## 信号原语基础

所有信号原语都实现了`evaluate`方法，该方法接收输入时间序列并返回布尔结果。信号原语可以：

1. 评估单个时间点(返回单个布尔值)
2. 评估整个时间序列(返回布尔型Series)

## 可用信号原语

### 比较类信号

> **⚠️ 重要警告：输入顺序至关重要**
>
> 对于所有比较类信号（尤其是LessThan和GreaterThan），输入参数的顺序会直接影响比较结果。
> 当涉及常量与变量的比较时，**必须将常量放在左侧，变量放在右侧**，以确保执行预期的比较。
>
> 错误示例（常见错误！）：
> ```json
> // 本意是 rsi < 70，但实际执行的是 70 < rsi
> {
>   "type": "LessThan",
>   "inputs": [
>     { "ref": "rsi" },
>     { "type": "Constant", "value": 70 }
>   ]
> }
> ```
>
> 正确示例：
> ```json
> // 正确执行 rsi < 70
> {
>   "type": "LessThan",
>   "inputs": [
>     { "type": "Constant", "value": 70 },
>     { "ref": "rsi" }
>   ]
> }
> ```

#### GreaterThan 和 LessThan (替代 Comparison)

推荐使用 GreaterThan 和 LessThan 替代通用的 Comparison，它们提供更明确的语义和更好的性能。

```json
{
  "id": "price_above_ma",
  "type": "GreaterThan",
  "epsilon": 0.01,
  "inputs": [
    { "column": "Close" },
    { "ref": "ma_indicator" }
  ]
}
```

**参数**:
- `epsilon`: 用于处理浮点比较精度问题的小值(默认: 0)

**注意事项**:
- 比较两个时间序列时，会使用epsilon值作为精度缓冲
- 输入顺序至关重要，请参考下面的 GreaterThan 和 LessThan 部分

#### GreaterThan (大于)

检查第一个输入是否大于第二个输入。**输入顺序至关重要**！

```json
{
  "id": "price_gt_ma",
  "type": "GreaterThan",
  "epsilon": 0.01,
  "inputs": [
    { "column": "Close" },     // 要检查的值放第一位
    { "ref": "ma_indicator" }  // 与之比较的值放第二位
  ]
}
```

**常量比较的正确写法**：

```json
{
  "id": "rsi_overbought",
  "type": "GreaterThan",
  "epsilon": 0.5,
  "inputs": [
    { "ref": "rsi_indicator" },            // 变量放第一位
    { "ref": "upper_threshold" }           // 引用常量指标而不是直接使用value
  ]
}
```

**参数**:

- `epsilon`: 浮点数比较精度参数（可选，默认为0）。当比较 a > b 时，实际比较为 a > (b + epsilon)。
  - 例如：当阈值为70，epsilon为0.01时，只有值大于70.01才会返回true
  - 适用于处理边界条件和浮点数精度问题

**注意事项**：

- 无论是否使用 epsilon，输入的顺序都是决定性的
- 对于 `GreaterThan(a, b)`，执行的是 `a > (b + epsilon)`
- 推荐使用常量指标（如 `upper_threshold`）而不是直接使用 `value` 属性

#### LessThan (小于)

检查第一个输入是否小于第二个输入。**输入顺序至关重要**！

```json
{
  "id": "price_lt_ma",
  "type": "LessThan",
  "epsilon": 0.01,
  "inputs": [
    { "column": "Close" },     // 要检查的值放第一位
    { "ref": "ma_indicator" }  // 与之比较的值放第二位
  ]
}
```

**常量比较的正确写法**：

```json
{
  "id": "rsi_not_overbought",
  "type": "LessThan",
  "epsilon": 0.5,
  "inputs": [
    { "ref": "rsi_indicator" },            // 变量放第一位
    { "ref": "upper_threshold" }           // 引用常量指标而不是直接使用value
  ]
}
```

**参数**:

- `epsilon`: 浮点数比较精度参数（可选，默认为0）。当比较 a < b 时，实际比较为 a < (b - epsilon)。
  - 例如：当阈值为70，epsilon为0.01时，只有值小于69.99才会返回true
  - 适用于处理RSI等指标的边界条件和浮点数精度问题

**注意事项**：

- 无论是否使用 epsilon，输入的顺序都是决定性的
- 对于 `LessThan(a, b)`，执行的是 `a < (b - epsilon)`
- 推荐使用常量指标（如 `lower_threshold`）而不是直接使用 `value` 属性

#### InRange (在范围内)

检查输入值是否在指定范围内。

```json
{
  "id": "rsi_neutral",
  "type": "InRange",
  "params": {
    "lower_inclusive": true,
    "upper_inclusive": true
  },
  "inputs": [
    { "ref": "rsi_indicator" },
    { "ref": "lower_bound" },
    { "ref": "upper_bound" }
  ]
}
```

**参数**:

- `lower_inclusive`: 是否包含下界(默认: true)
- `upper_inclusive`: 是否包含上界(默认: true)

**注意事项**:

- 需要三个输入: 评估值, 下界, 上界
- 适合检测指标是否在特定区间内(如RSI在30-70之间)

### 交叉类信号

#### Crossover (上穿)

检测第一个输入是否向上穿越第二个输入。

```json
{
  "id": "price_cross_above_ma",
  "type": "Crossover",
  "params": { "mode": "simple" },
  "inputs": [
    { "column": "Close" },
    { "ref": "ma_indicator" }
  ]
}
```

**参数**:

- `mode`: 交叉检测模式，可选值:
  - `simple`: 简单交叉检测（默认）
  - `confirmed`: 要求确认（连续两个周期）

**注意事项**:

- 只在实际发生穿越的那一个时间点返回true
- 穿越后的后续时间点返回false，直到发生新的穿越
- 适合用作买入/卖出触发信号

#### Crossunder (下穿)

检测第一个输入是否向下穿越第二个输入。

```json
{
  "id": "price_cross_below_ma",
  "type": "Crossunder",
  "params": { "mode": "simple" },
  "inputs": [
    { "column": "Close" },
    { "ref": "ma_indicator" }
  ]
}
```

**参数**:

- `mode`: 交叉检测模式，可选值:
  - `simple`: 简单交叉检测（默认）
  - `confirmed`: 要求确认（连续两个周期）

**注意事项**:

- 只在实际发生穿越的那一个时间点返回true
- 穿越后的后续时间点返回false，直到发生新的穿越
- 适合用作买入/卖出触发信号

### 逻辑运算符类

#### And (逻辑与)

要求所有输入信号同时为true。支持嵌套信号和内联常量。

**基本用法**：
```json
{
  "id": "buy_condition",
  "type": "And",
  "inputs": [
    { "ref": "price_above_ma" },
    { "ref": "rsi_oversold" }
  ]
}
```

**嵌套信号示例**：
```json
{
  "id": "buy_condition_core",
  "type": "And",
  "inputs": [
    { "ref": "macd_cross_signal" },
    {
      "type": "GreaterThan",
      "inputs": [
        { "column": "Volume" },
        { "ref": "volume_ma" }
      ],
      "params": {
        "threshold": 1.5
      }
    }
  ]
}
```
**内联常量支持**：
```json
{
  "id": "enhanced_buy",
  "type": "And", 
  "inputs": [
    { "ref": "buy_condition_core" },
    {
      "type": "LessThan",
      "inputs": [
        { "ref": "volume_ratio" },
        { "type": "Constant", "value": 3 }
      ]
    }
  ]
}
```

#### Or (逻辑或)

当任一输入信号为true时返回true。

```json
{
  "id": "sell_condition",
  "type": "Or",
  "inputs": [
    { "ref": "stop_loss_hit" },
    { "ref": "take_profit_hit" }
  ]
}
```

#### Not (逻辑非)

对输入信号取反。

```json
{
  "id": "not_overbought",
  "type": "Not",
  "inputs": [
    { "ref": "rsi_overbought" }
  ]
}
```

**逻辑运算符新特性**：
1. **嵌套信号支持**: And/Or可以接受嵌套的信号定义作为输入
2. **内联常量**: 嵌套信号中支持 `{"type": "Constant", "value": N}` 格式
3. **灵活组合**: 可以混合使用信号引用和嵌套定义

**注意事项**:

- 增强了NaN处理逻辑
- 适合需要排除特定条件的场景
- 嵌套信号会自动评估，无需预先定义ID

### 模式识别类

#### Streak (连续模式)

检测连续满足条件的模式。

```json
{
  "id": "consecutive_up_days",
  "type": "Streak",
  "params": {
    "condition": "true",
    "min_length": 3,
    "max_length": 5
  },
  "inputs": [
    { "ref": "daily_gain" }
  ]
}
```

**参数**:

- `condition`: 匹配条件("true"或"false")
- `min_length`: 最小连续长度
- `max_length`: 最大连续长度(可选)

**注意事项**:

- 可用于检测连续上涨/下跌或其他持续模式
- 如果设置了`max_length`，超过该长度将返回false
- 支持多种匹配类型和长度限制

### 数学运算类


> **🆕 新功能：纯数学运算模式**
>
> 数学运算类信号现在支持两种工作模式：
> 1. **比较模式**（默认）：执行数学运算后与阈值比较，返回布尔结果
> 2. **纯数学模式**：设置 `return_calculation=true` 时，直接返回数学运算结果
#### PercentChange (百分比变化)

计算时间序列的百分比变化，并与阈值或另一时间序列比较。

```json
{
  "id": "price_up_5percent",
  "type": "PercentChange",
  "params": {
    "period": 5,
    "threshold": 5.0,
    "comparison": "greater"
  },
  "inputs": [
    { "column": "Close" }
  ]
}
```

**参数**:

- `period`: 计算变化的周期(默认: 1)
- `threshold`: 比较阈值(可选)
- `comparison`: 比较类型(默认: "greater")

**注意事项**:

- 可与阈值比较或与另一时间序列比较
- 适合检测价格动量或大幅波动

#### Add (加法)

将两个或多个时间序列相加。支持比较模式和纯数学运算模式。

**比较模式示例**（默认行为）：
```json
{
  "id": "combined_gt_threshold",
  "type": "Add",
  "params": {
    "threshold": 100,
    "comparison": "greater"
  },
  "inputs": [
    { "ref": "indicator1" },
    { "ref": "indicator2" }
  ]
}
```

**纯数学运算模式示例**：
```json
{
  "id": "combined_indicator",
  "type": "Add",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "indicator1" },
    { "ref": "indicator2" },
    { "ref": "indicator3" }
  ]
}
```
**参数**:
- `return_calculation`: 是否返回计算结果而非比较结果（默认: false）
- `threshold`: 比较阈值（仅在比较模式下使用）
- `comparison`: 比较类型（仅在比较模式下使用，默认: "greater"）
- `absolute`: 是否对结果取绝对值（默认: false）
**内联常量支持**：
```json
{
  "id": "indicator_plus_constant",
  "type": "Add",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "base_indicator" },
    { "type": "Constant", "value": 10 }
  ]
}
```
#### Subtract (减法)

从第一个时间序列中减去第二个及后续时间序列（按从左到右顺序）。

**纯数学运算示例**：
```json
{
  "id": "indicator_difference",
  "type": "Subtract",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "indicator1" },
    { "ref": "indicator2" }
  ]
}
```

**多操作数示例**（左到右计算：(a - b) - c）：
```json
{
  "id": "sequential_subtract",
  "type": "Subtract",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "base_value" },
    { "ref": "adjustment1" },
    { "type": "Constant", "value": 5 }
  ]
}
```
#### Multiply (乘法)

将两个或多个时间序列相乘（支持多操作数）。

**纯数学运算示例**：
```json
{
  "id": "weighted_indicator",
  "type": "Multiply",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "indicator" },
    { "ref": "weight" }
  ]
}
```

**多操作数乘法示例**：
```json
{
  "id": "signal_strength",
  "type": "Multiply",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "macd_atr_ratio" },
    { "ref": "ma_close_ratio" },
    { "type": "Constant", "value": 1.0 }
  ]
}
```
#### Divide (除法)

将第一个时间序列除以第二个及后续时间序列（按从左到右顺序）。

**纯数学运算示例**：
```json
{
  "id": "indicator_ratio",
  "type": "Divide",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "ref": "indicator1" },
    { "ref": "indicator2" }
  ]
}
```

**多操作数示例**（左到右计算：(a / b) / c）：
```json
{
  "id": "normalized_ratio",
  "type": "Divide",
  "params": {
    "return_calculation": true
  },
  "inputs": [
    { "column": "Volume" },
    { "ref": "volume_ma" },
    { "type": "Constant", "value": 1000 }
  ]
}
```
**数学运算类通用参数**：
- `return_calculation`: 是否返回纯数学计算结果（默认: false）
  - `true`: 返回数值结果，支持多操作数按从左到右计算
  - `false`: 执行运算后与阈值比较，返回布尔结果
- `threshold`: 比较阈值（仅在比较模式下生效）
- `comparison`: 比较类型（"greater", "less", "equal"等，仅在比较模式下生效）
- `absolute`: 是否对运算结果取绝对值（默认: false）
**重要特性**：
1. **向后兼容**: 默认行为保持不变，现有配置无需修改
2. **多操作数支持**: 纯数学模式支持2个以上输入，按从左到右顺序计算
3. **内联常量**: 支持 `{"type": "Constant", "value": N}` 格式的内联常量
4. **除零处理**: Divide操作自动处理除零情况，返回NaN
### 策略切换类

#### StockBondSwitch (股债切换)

> **⚠️ 智能资产轮动信号**
>
> 这是一个专门为多资产轮动策略设计的智能信号原语，它能够自动识别当前正在评估的标的，
> 并根据标的在投资组合中的位置（约定：第一个=股票类资产，第二个=债券类资产）以及市场条件
> 返回相应的买入信号。

根据市场条件信号为不同资产生成互补的买入信号，实现股债轮动策略。

```json
{
  "id": "stock_bond_buy",
  "type": "StockBondSwitch",
  "params": {
    "default_to_stock": true
  },
  "inputs": [
    { "ref": "market_trend_up" }
  ]
}
```

**工作原理**:

该原语能够智能识别当前正在评估的标的和投资组合中的所有标的，
根据标的在投资组合中的位置和市场条件，为不同标的返回互补的买入信号：

| 条件信号 | 股票ETF(位置0) | 债券ETF(位置1) |
|----------|----------------|----------------|
| `True`   | `True` (买入)  | `False` (不买) |
| `False`  | `False` (不买) | `True` (买入)  |

**配置约定**:
- **symbols[0]**: 股票ETF（如510300、SPY等）
- **symbols[1]**: 债券ETF（如511260、TLT等）

**参数**:
- `default_to_stock`: 当条件信号中包含NaN值时的默认填充行为（默认: true）
  - `true`: NaN填充为True（偏向股票）
  - `false`: NaN填充为False（偏向债券）

**返回值**:
- 返回布尔型 `pd.Series`，表示当前标的是否应该买入
- 对于股票ETF：条件为True时返回True，条件为False时返回False
- 对于债券ETF：条件为False时返回True，条件为True时返回False

**完整配置示例**:

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
    "indicators": [],
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
      }
    ],
    "outputs": {
      "buy_signal": "stock_bond_buy",
      "sell_signal": "stock_bond_sell"
    }
  }
}
```

**技术特点**:

1. **智能识别**: 自动识别当前正在评估的标的和投资组合配置

2. **上下文感知**: 能够获取完整的投资组合标的列表和当前标的信息

3. **安全机制**: 
   - 无法获取投资组合信息时默认不产生买入信号
   - 投资组合标的少于2个时不产生买入信号  
   - 当前标的不在前两个位置时不产生买入信号

**注意事项**:

- 这是一个标准的信号原语，返回布尔型Series，与其他信号原语完全兼容
- 必须配合 `CompositeStrategy` 使用，不能用于单标的策略
- 卖出信号通常使用 `Not` 原语对买入信号取反
- 适用于任何两资产轮动策略（不仅限于股债）

**使用场景**:
- 股债轮动（股票ETF ↔ 债券ETF）
- 风险开关策略（风险资产 ↔ 避险资产）  
- 趋势跟踪（趋势资产 ↔ 现金等价物）
- 动量轮动（高动量资产 ↔ 低动量资产）

## 信号组合最佳实践

1. **构建复合条件**:
   - 使用`And`、`Or`组合多个信号
   - 使用`Not`反转信号
   - 例如: `And(CrossAbove(RSI, 30), GreaterThan(Close, SMA))`

2. **交叉事件vs状态**:
   - 交叉事件(CrossAbove/CrossBelow)只在穿越发生时为true
   - 状态比较(GreaterThan/LessThan)只要条件满足就一直为true
   - 明确了解这一区别对避免频繁交易很重要

3. **过滤假信号**:
   - 使用Streak要求信号持续一定时间
   - 结合多个指标确认信号
   - 使用趋势过滤器(如价格高于均线)

4. **信号命名和组织**:
   - 使用清晰的ID命名每个信号组件
   - 从简单到复杂逐步构建信号
   - 先定义基本条件，再组合成复杂条件

## 常见错误和解决方案

1. **过度频繁的信号**:
   - 问题: 使用状态比较(如GreaterThan)作为买入信号
   - 解决: 使用CrossAbove/CrossBelow检测交叉事件

2. **信号缺失**:
   - 问题: 输入时间序列有NaN值
   - 解决: 确保指标计算有足够的历史数据

3. **精度问题**:
   - 问题: 浮点比较导致不稳定的结果
   - 解决: 在Comparison中使用epsilon参数

4. **逻辑错误**:
   - 问题: 混淆And/Or逻辑
   - 解决: 仔细验证复合条件的预期行为

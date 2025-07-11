# 常见问题解答

本页面整理了用户在使用策引平台时最常遇到的问题和解答，帮助您更好地理解和使用投资策略。

## 投资决策与风险提示

### 组合是否具有投资建议性质？信号如何解读？

**重要声明**：策引平台展示的所有策略组合均为**基于历史数据的回测模拟结果**，其目的在于信息展示和策略逻辑验证，**不构成任何形式的投资建议**。

**投资决策独立性**：
- 所有投资决策应由用户独立做出
- 平台仅提供数据分析工具和教育资源
- 用户需遵守所在地区法律法规并自主决策
- 承担所有投资风险

**信号解读原则**：
- **买入信号**：仅表示策略在特定条件下的技术判断，不保证盈利
- **持有信号**：表示暂时维持现状，用户应结合自身情况判断
- **卖出信号**：用于风险控制，但执行时机需要用户自主判断

**重要提示**：投资决策应独立做出。一旦决定参考某个策略，后续的卖出决策若能与该策略的"卖出"信号保持一致，是维持策略一致性的关键。所有投资决策的风险由用户自行承担。

### 组合是回测还是实盘？回测和真实交易有何差异？

**性质说明**：所有组合展示的均为**基于历史数据的回测模拟结果**，其目的在于信息展示和策略逻辑验证。

**重要免责声明**：所有历史数据和回测结果不代表真实收益，亦不作为对未来表现的预测或保证。本平台所有内容不构成任何形式的投资建议。投资有风险，入市需谨慎，用户应独立做出投资决策并自行承担风险。

**模拟交易与真实交易的主要差异**：

#### 1. 滑点与流动性
- **回测局限**：回测无法完全模拟真实市场的流动性变化和交易滑点
- **实盘风险**：极端行情下可能存在无法成交的风险
- **影响程度**：在高波动市场中差异更为明显

#### 2. 费用与分红
- **简化处理**：为简化计算，模拟交易通常会忽略交易费用和持仓分红等因素
- **实际影响**：频繁交易的策略会受到更大的费用影响
- **建议**：实盘执行时需要考虑完整的交易成本

#### 3. 策略过拟合风险
- **风险说明**：任何基于历史数据的策略都存在过拟合风险
- **缓解措施**：我们倾向于采用逻辑简单、参数较少的策略，以降低该风险
- **注意事项**：但无法完全避免，需要持续监控策略的有效性

## 策略设计与信号解读

### 策略是如何设计的？为何展示的胜率不高？

**设计原则**：我们的策略设计基于公开的市场理论和资金管理方法，并经过历史数据进行回测验证。

**策略核心是趋势跟随，而非预测拐点**：

#### 目标理念
- **"截断亏损，让利润奔跑"**：趋势策略旨在抓住市场的主要趋势，而非短期波动，因此可能产生多次小额的试错成本
- **关注长期盈亏比**：此类策略的特点通常是胜率不高，但力求在抓住趋势时获得较高的潜在收益，以覆盖多次试错的成本
- **统计优势**：高盈亏比是影响长期收益的众多因素之一

**参考资料**：关于策略的通用知识，可查阅《[小白的交易之路](https://www.bmpi.dev/money/road_to_trading/)》等公开资料作为参考。

### 交易信号中的状态（买入/卖出/持有/空仓）是什么意思？

这些状态仅为策略在特定时点对历史数据的回测结果，含义如下：

#### 买入（BUY）
**含义**：指策略显示，在此前回测节点未持仓，而在当前节点出现了符合策略的开仓信号。

#### 卖出（SELL）
**含义**：指策略显示，在此前回测节点为持仓状态，而在当前节点出现了符合策略的平仓信号。

#### 持有（HOLD）
**含义**：指策略显示，在此前回测节点已开仓，而在当前节点未出现平仓信号。

#### 空仓（EMPTY）
**含义**：指某个标的在当前策略回测下，无持仓且未出现开仓信号。

## 资金管理与风险控制

### 当参考买入信号时，该如何考虑资金分配？

不同组合展示了不同的历史资金策略模型，仅供参考。例如：

#### 百分比模型
- **示例**：A股1号（百分比模型）
- **特点**：单个标的在历史回测中最多占用20%资金
- **优势**：风险分散，多元化持仓
- **适用**：风险偏好适中的投资者

#### 全仓模型
- **示例**：A股2号（全仓模型）
- **特点**：回测中一旦出现买入信号，即投入全部可用资金
- **优势**：集中度高，潜在收益更大
- **风险**：单一标的风险较高

**重要提示**：用户应在充分理解不同资金管理模型风险的基础上，独立制定并执行完全符合自身风险承受能力的资金策略。

### 如何理解和控制投资风险？

#### 主要风险类型
1. **市场风险**：整体市场下跌的系统性风险
2. **策略风险**：特定策略在某些市场环境下表现不佳
3. **集中度风险**：过度集中在少数标的或策略上
4. **流动性风险**：在需要时无法及时变现的风险

#### 风险控制建议
- **分散投资**：不要将所有资金投入单一策略或标的
- **仓位管理**：根据风险承受能力合理分配资金
- **定期评估**：定期检查策略表现和市场环境变化
- **止损纪律**：严格执行止损规则，及时止损

## 平台功能与技术问题

### 为何不提供自动化交易？标的池是否支持自定义？

#### 自动化交易
**现状说明**：目前产品策略基于日线级别，交易频率不高。同时，自动化交易涉及复杂的技术和合规风险，因此暂不提供。

**替代方案**：
- 提供邮件提醒功能，及时推送交易信号
- 支持手动执行交易决策
- 确保用户对每笔交易都有充分的控制权

#### 自定义标的池
**功能支持**：不仅支持自定义标的池，原语策略还支持自定义交易策略，方便用户根据自己的需求进行调整。

**自定义范围**：
- 选择特定的股票、ETF或其他金融工具
- 调整标的池的行业分布和地区配置
- 根据个人偏好定制投资组合

### 交易提醒邮件何时发送？

邮件提醒功能会在每个**交易日开盘前**发送相关信息，用户可在组合详情页进行订阅。

#### 发送时间安排
- **A股市场**：北京时间周二至周六早上9点左右
- **美股市场**：北京时间周二至周六下午4点左右  
- **加密币市场**：每日北京时间中午左右

#### 节假日处理
在非交易日，系统会基于最近一个交易日的数据生成信号，作为下一个交易日的信息参考。

#### 邮件内容
- 各策略的最新交易信号
- 重要的市场变化提醒
- 风险提示和注意事项

## 投资理念与教育

### 如何正确理解投资策略的作用？

#### 策略的本质
**工具属性**：策引平台的投资策略分析是一种教育和研究工具，用于理解策略逻辑，而不是预测未来市场表现的工具。

**学习价值**：策略分析帮助用户：
- 理解系统化的策略分析方法
- 学习策略设计的基本原理
- 了解风险管理的重要性
- 通过历史回测理解市场规律

#### 正确认知
- **模拟工具**：所有策略分析都基于历史数据模拟，不能保证未来表现
- **教育目的**：平台主要用于学习投资知识，理解策略原理
- **独立决策**：所有投资决策应由用户独立做出
- **风险自担**：投资存在风险，用户需承担相应后果

### 投资新手应该如何开始？

#### 第一步：学习基础知识
1. **了解策引背景**：阅读[策引的创建背景](/docs/concepts/background)
2. **掌握核心概念**：学习[核心概念与系统架构](/docs/concepts/overview)
3. **理解基础策略**：从[投资策略基础](/docs/strategies/basic-concepts)开始

#### 第二步：模拟学习
- **选择简单策略**：从买入持有策略开始学习
- **理解回测**：通过历史回测理解策略逻辑
- **观察分析**：详细观察策略在不同市场环境下的表现
- **反思总结**：定期回顾和总结学习心得

#### 第三步：逐步进阶
- **尝试不同策略**：体验双均线、吊灯止损等策略
- **学习原语系统**：了解更高级的自定义策略
- **参与社区**：与其他投资者交流学习
- **持续改进**：根据实际效果不断调整和优化

## 技术支持与问题反馈

### 遇到技术问题该如何解决？

#### 常见问题自助解决
1. **刷新页面**：很多显示问题可以通过刷新解决
2. **清除缓存**：清除浏览器缓存和Cookie
3. **检查网络**：确保网络连接稳定
4. **更新浏览器**：使用最新版本的浏览器

#### 获得帮助
- **查看文档**：首先查看相关的帮助文档
- **社区求助**：在用户社区中寻求其他用户的帮助
- **联系客服**：通过官方渠道联系技术支持团队
- **反馈建议**：向平台提出改进建议

### 如何提供有效的反馈？

#### 反馈信息包含
- **问题描述**：详细描述遇到的问题
- **操作步骤**：说明导致问题的具体操作
- **环境信息**：浏览器类型、版本、操作系统等
- **截图或录屏**：如果可能，提供视觉证据

#### 建议反馈
- **功能改进**：对现有功能的改进建议
- **新功能需求**：希望增加的新功能
- **用户体验**：界面和交互的优化建议
- **教育内容**：希望了解的投资知识领域

---

**更多帮助**：如果您的问题在此页面中没有找到答案，请访问[策引平台](https://www.myinvestpilot.com)获取更多支持，或通过以下方式联系我们：

**联系方式**：
- 📧 邮箱：hello(at)myinvestpilot.com  
- 💬 微信：添加微信客服获取即时技术支持 
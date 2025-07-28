import {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a "Next" and "Previous" button
 - provide the user with the ability to scroll through docs in sidebar order
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'intro',
    'concepts/background',
    {
      type: 'category',
      label: '核心概念',
      items: [
        'concepts/overview',
        'concepts/trading-system',
        'concepts/ai-agent',
        'concepts/risk-analysis',
      ],
    },
    {
      type: 'category',
      label: '使用指南',
      items: [
        'guides/user-scenarios',
        'guides/create-portfolio',
        'guides/portfolio-analysis',
        'guides/official-portfolios',
        'guides/email-notifications',
        'guides/frequently-asked-questions',
      ],
    },
    {
      type: 'category',
      label: '投资组合',
      items: [
        'portfolios/overview',
        {
          type: 'category',
          label: '交易策略',
          items: [
            'strategies/basic-concepts',
            'strategies/buy-and-hold',
            'strategies/dual-moving-average',
            'strategies/chandelier-exit',
            'strategies/momentum-rotation',
            'strategies/macd-strategy',
            'strategies/bollinger-bands',
            'strategies/primitive-strategy',
            'strategies/ai-model-strategy',
            'strategies/file-based-strategy',
          ],
        },
        {
          type: 'category',
          label: '资金策略',
          items: [
            'capital-strategies/overview',
            'capital-strategies/percent-strategy',
            'capital-strategies/simple-percent-strategy',
            'capital-strategies/fixed-investment-strategy',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '原语策略',
      items: [
        'primitives/getting-started',
        'primitives/architecture',
        'primitives/indicators',
        'primitives/signals',
        'primitives/composition',
        'primitives/examples',
        'primitives/troubleshooting',
        'primitives/strategy-design-best-practices',
        {
          type: 'category',
          label: '高级主题',
          items: [
            'primitives/advanced/market-indicators',
            'primitives/advanced/optimization',
            'primitives/advanced/troubleshooting',
            'primitives/advanced/architecture-limitations',
            'primitives/advanced/stock-bond-rotation-case',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '市场分析',
      items: [
        'market-analysis/overview',
        'market-analysis/china-market',
        'market-analysis/us-market',
        'market-analysis/crypto-market',
        'market-analysis/email-subscription',
      ],
    },
  ],
};

export default sidebars;

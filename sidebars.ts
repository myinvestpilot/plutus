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
        'concepts/ai-agent',
        'concepts/risk-analysis',
      ],
    },
    {
      type: 'category',
      label: '使用指南',
      items: [
        'guides/create-portfolio',
        'guides/portfolio-analysis',
        'guides/official-portfolios',
        'guides/email-notifications',
        'guides/frequently-asked-questions',
      ],
    },
    {
      type: 'category',
      label: '投资策略',
      items: [
        'strategies/basic-concepts',
        'strategies/buy-and-hold',
        'strategies/dual-moving-average',
        'strategies/macd-strategy',
        'strategies/bollinger-bands',
        'strategies/chandelier-exit',
        'strategies/momentum-rotation',
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
  ],
};

export default sidebars;

import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '🤖 AI分析助手',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        智能分析个股和市场趋势，提供专业的投资建议和风险评估，
        让AI成为您的个人投资顾问。
      </>
    ),
  },
  {
    title: '📊 投资组合管理',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        量身定制模拟组合，深度分析持仓风险和收益表现，
        帮助您制定科学的资产配置策略。
      </>
    ),
  },
  {
    title: '📈 策略信号通知',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        每日提供策略信号和市场分析，及时跟踪投资机会，
        让您不错过任何重要的投资时机。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

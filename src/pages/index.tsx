import type {ReactNode} from 'react';
import {useEffect} from 'react';
import {useHistory} from '@docusaurus/router';

export default function Home(): ReactNode {
  const history = useHistory();

  useEffect(() => {
    // 自动跳转到文档页面
    history.replace('/docs/');
  }, [history]);

  return null;
}

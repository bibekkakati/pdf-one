import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import Landing from './pages/Landing';

/** Build-time render of the landing page; the result is baked into dist/index.html. */
export function render() {
  return renderToString(
    <StaticRouter location="/">
      <Landing />
    </StaticRouter>,
  );
}

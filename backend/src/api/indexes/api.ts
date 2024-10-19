import { APIApp } from '@api/app/api.app';
import { configureVars } from '@environment/vars';

configureVars();

const app = new APIApp();

(async () => {
  app.config();
  await app.listen();
})();

export default app;

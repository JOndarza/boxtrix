import dotenv from 'dotenv';

export type EnvironmentVars =
  | 'ORIGIN'
  | 'FRONTEND_ORIGIN'
  | 'TIMEZONE'
  | 'OPEN_IA_KEY'
  | 'SERVER_JWT_PASS';

export function configureVars() {
  setTimeZone();
  const result = dotenv.config({ path: './.env' });
  if (result.error) throw result.error;
  console.info('Environment vars configured!');
}

export function getVar(_var: EnvironmentVars) {
  return process.env[_var] || undefined;
}

function setTimeZone() {
  process.env.TZ = getVar('TIMEZONE') || 'America/Mexico_City';
  console.info(`Timezone: ${new Date().toString()}`);
}

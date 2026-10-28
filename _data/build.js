// Identificador del build. Cambia en cada despliegue y da nombre a la caché
// offline del navegador (ver sw.njk): un build nuevo estrena caché y borra las
// anteriores, así nunca se sirven mezcladas versiones distintas de la charla.
const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID;

module.exports = {
  id: sha ? sha.slice(0, 12) : `local-${Date.now().toString(36)}`,
};

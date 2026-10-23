export const HOME_COLLECTION_URLS = {
  "recent-finished": "/carreras/recien-finalizadas",
  top: "/carreras/mejor-valoradas",
  near: "/carreras/esta-semana",
  new: "/carreras/nuevas",
  finished: "/carreras/finalizadas-resultados",
} as const;

export type HomeCollectionId = keyof typeof HOME_COLLECTION_URLS;

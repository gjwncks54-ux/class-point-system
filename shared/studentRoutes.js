export const DEFAULT_STUDENT_PATH = "/village";
export const PROFILE_PATH = "/profile";
export const PROFILE_MVP_PATH = "/profile-mvp";

const PATH_ALIASES = {
  [PROFILE_PATH]: DEFAULT_STUDENT_PATH,
  [PROFILE_MVP_PATH]: DEFAULT_STUDENT_PATH,
};

const DESTINATION_TO_PATH = {
  profile: DEFAULT_STUDENT_PATH,
  village: "/village",
  shop: "/shop",
  hall: "/hall",
  ranking: "/hall",
  purchases: "/purchases",
  history: "/history",
  pin: "/pin",
  "dungeon-english": "/dungeon/english",
};

const PATH_TO_TAB = {
  "/village": "village",
  "/shop": "shop",
  "/hall": "ranking",
  "/purchases": "purchases",
  "/history": "history",
  "/pin": "pin",
  "/dungeon/english": "village",
};

export function normalizeStudentPath(pathname) {
  if (!pathname) return DEFAULT_STUDENT_PATH;
  const canonicalPath = PATH_ALIASES[pathname] || pathname;
  return PATH_TO_TAB[canonicalPath] ? canonicalPath : DEFAULT_STUDENT_PATH;
}

export function getStudentTabForPath(pathname) {
  return PATH_TO_TAB[normalizeStudentPath(pathname)];
}

export function getPathForStudentDestination(destination) {
  return DESTINATION_TO_PATH[destination] || DEFAULT_STUDENT_PATH;
}

export function isStudentRoute(pathname) {
  return normalizeStudentPath(pathname) === pathname;
}

export function isDungeonPath(pathname) {
  return normalizeStudentPath(pathname).startsWith("/dungeon/");
}

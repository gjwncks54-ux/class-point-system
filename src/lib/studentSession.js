const STUDENT_SESSION_KEY = "studentSession";

export function readStudentSession() {
  try {
    const raw = sessionStorage.getItem(STUDENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read student session:", error);
    return null;
  }
}

export function writeStudentSession(session) {
  if (!session) {
    clearStudentSession();
    return null;
  }

  sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearStudentSession() {
  sessionStorage.removeItem(STUDENT_SESSION_KEY);
}

export function isSecureStudentSession(session) {
  return Boolean(session?.sessionId && session?.classId && session?.studentId);
}

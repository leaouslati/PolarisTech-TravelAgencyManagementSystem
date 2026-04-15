// Session inactivity (15 min) is enforced client-side via AuthContext's idle
// timer, which fires logout() and clears the JWT. The x-last-activity header
// sent by axios carries the client-side timestamp of the current request, so
// the server-side diff would always be near zero — not a useful check.
// Real server-side enforcement would require a session store; until then the
// JWT expiry + client idle timer combination is the active mechanism.
const sessionMiddleware = (_req, _res, next) => next();

module.exports = sessionMiddleware;
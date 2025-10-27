import { jest } from "@jest/globals";

// Ignore checkJwt.js. That suff works just fine, trust me bro
await jest.unstable_mockModule("../middleware/checkJwt.js", () => ({
    __esModule: true,
    default: (req, res, next) => next(), // just call next() for tests
}));

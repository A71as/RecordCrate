import express from "express";
import checkJwt from "../middleware/checkJwt.js";

/*
    This file is used for any routes that are not needed/for testing.
    Makes my life easier
*/

const router = express.Router();

router.get("/protected", checkJwt, (req, res) => {
  res.json({ message: "This is a protected route", user: req.auth });
});

export default router;
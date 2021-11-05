const { Router } = require("express");
const dbConnection = require("../config/database");
const router = Router();

router.use((req, res, next) => {
  console.log("Reauest nade to /USERS ROUTE");
  next();
});

router.get("/", (req, res) => {
  res.send(200);
});

router.get("/users", (req, res) => {
  res.json({ route: "Post" });
});

router.post("/", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ error: true, message: "Not Fond" });
  } else {
    dbConnection.query(
      "INSERT INTO loin_api ( username, password ) VALUES(? , ? )",
      [username, password],
      (error, results, fields) => {
        if (error) throw error;
        return res.send({
          error: false,
          data: results,
          message: "Book successfully added",
        });
      }
    );
  }
});
module.exports = router;

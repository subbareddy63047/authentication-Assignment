const express = require("express");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());

const initializeAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:///localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit();
  }
};
initializeAndServer();

app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkingUser = `
    select * from user
    where username='${username}';`;
    const results = await db.get(checkingUser);

    if (results !== undefined) {
      response.status(400);
      response.send("User already exists");
    } else {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const inserted = `
        insert into user
              (username,name,password,gender,location)
        values(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}');`;
        const dbResponse = await db.run(inserted);
        response.send("User created successfully");
      }
    }
  } catch (e) {
    console.log(`registerPostMethodError:${e.message}`);
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `
    select * from user
    where username='${username}'`;
  const results = await db.get(query);
  if (results === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordCorrect = await bcrypt.compare(password, results.password);
    if (passwordCorrect === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const userDetails = `
    select * from user
    where username='${username}';`;
    const results = await db.run(userDetails);
    const s = await bcrypt.compare(oldPassword, results.password);
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      if (s === true) {
        const updatedPassword = `
        update user
        set(
            password='${encryptedPassword}'
        );`;
        const results = await db.run(updatedPassword);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  } catch (e) {
    console.log(`putMethodError:${e.message}`);
  }
});
module.exports = app;

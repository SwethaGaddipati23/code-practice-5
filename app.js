const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDbObjCamelCase = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.directorName,
  };
};

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT *
    FROM movie
    ORDER BY movie_id;
    `;
  const movieArray = await db.all(getMoviesQuery);
  response.send(
    movieArray.map((eachMv) => convertDbObjectToResponseObject(eachMv))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const movieQuery = `
    INSERT INTO movie(director_id,movie_name,lead_actor)
    VALUES (${directorId},'${movieName}','${leadActor}');
    `;
  const dbResponse = await db.run(movieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMvQuery = `
    SELECT *
    FROM movie
    WHERE movie_id=${movieId};
    `;
  const dbResponse = await db.get(getMvQuery);
  response.send(dbResponse);
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMvQuery = `
    UPDATE movie
    SET director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}';`;
  const dbResponse = await db.run(updateMvQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE FROM
    movie
    WHERE movie_id=${movieId};`;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirQuery = `
    SELECT*
    FROM director
    ORDER BY director_id;
    `;
  const dirArray = await db.all(getDirQuery);
  response.send(dirArray.map((val) => convertDbObjCamelCase(val)));
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const mvQuery = `
    SELECT movie_name
    FROM movie
    WHERE director_id=${directorId};
    `;
  const mvArray = await db.all(mvQuery);
  response.send(mvArray.map((eachMv) => convertDbObjCamelCase(eachMv)));
});

module.exports = app;

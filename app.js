import express from 'express';
import path from 'path';
const app = express();
const port = 80;

app.set('view engine', 'ejs');
app.set("views", path.join(path.resolve(), "views"));

import weatherRouter from "./routes/weatherRouter.js";

app.use('/', weatherRouter);

app.listen(port, () => {
  console.log(`Server stated and listening on port ${port}`)
})
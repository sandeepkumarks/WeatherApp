import express from 'express';
const router = express.Router();

import { getWeatherInfo } from '../services/weatherService.js';

router.get('/', async (req, res) => {
  let searchTerm = req.query.q;
  let weatherInfo = await getWeatherInfo(searchTerm);
  return res.render('index', {
    weatherInfo
  });
});

export default router;
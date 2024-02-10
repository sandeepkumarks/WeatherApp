import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import 'dotenv/config';

const client = new DynamoDBClient({ 
    region: 'us-east-1', 
    // credentials:{
    //     accessKeyId: process.env.AWS_ACCESS_KEY,
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    // } 
});

let apiKey = process.env.OPEN_WEATHER_MAP_API_KEY;
let weatherAPIURL = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;

export const getWeatherInfo = async (location) => {
    if (!location || location.trim().length === 0) {
        return null;
    }
    let weatherInfo = await getWeatherInfoFromDB(location);
    if(weatherInfo.Item) {
        return convertToWeatherInfoObj(weatherInfo.Item);
    }

    weatherInfo = await getWeatherInfoFromAPI(location);
    if (weatherInfo.cod === 200) {
        await addWeatherInfo(weatherInfo);
    }

    return weatherInfo;
};

const getWeatherInfoFromDB = async (location) => {
    console.log('Making DB call');
    const command = new GetItemCommand({
        TableName: "WeatherInfo",
        Key: {
            location: { S: location }
        }
    });

    const response = await client.send(command);
    return response;
};

const addWeatherInfo = async (weatherInfo) => {
    const command = new PutItemCommand({
        TableName: "WeatherInfo",
        Item: {
            location: { S: weatherInfo.location },
            temp: { N: weatherInfo.temp+'' },
            feelsLike: { N: weatherInfo.feelsLike+'' },
            minTemp: { N: weatherInfo.minTemp+'' },
            maxTemp: { N: weatherInfo.maxTemp+'' },
            condition: { S: weatherInfo.condition },
            icon: { S: weatherInfo.icon },
            expireAt: { N: getExpiryTime()+'' }
        }
    });

    const response = await client.send(command);
    return response;
};

const getWeatherInfoFromAPI = async (location) => {
    console.log('Making API call');
    let url = `${weatherAPIURL}&q=${location}`;
    try {
        let response = await fetch(url);
        response = await response.json();
        if (response.cod == 404) {
            let weatherInfo = {
                cod: response.cod,
                message: `Invalid search term: ${location}`
            };
            return weatherInfo;
        }

        return getFilteredWeatherInfoObj(response);
    } catch (error) {
        console.error('Error:', error);
    }
};

const getFilteredWeatherInfoObj = (response) => {
    let weatherInfo = {
        cod: response.cod,
        location: response.name,
        temp: response.main.temp,
        feelsLike: response.main.feels_like,
        minTemp: response.main.temp_min,
        maxTemp: response.main.temp_max,
        condition: response.weather[0].main,
        icon: response.weather[0].icon
    }

    return weatherInfo;
};

const convertToWeatherInfoObj = (response) => {
    let weatherInfo = {
        cod: 200
    };
    for(const key in response) {
        let targeValue = response[key];
        weatherInfo[key] =  targeValue[Object.keys(targeValue)[0]];
    }

    return weatherInfo;
};

const getExpiryTime = () => {
    return Date.now() + (30 * 60 * 1000);
};

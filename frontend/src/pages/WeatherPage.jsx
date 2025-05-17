import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Typography,
  Box,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
} from "@mui/material";
import axios from "axios";

const WeatherPage = () => {
  const [city, setCity] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [email, setEmail] = useState("");
  const [freq, setFreq] = useState("daily");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [userIp, setUserIp] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [userCity, setUserCity] = useState("");
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState("");

  // Автодополнение города
  useEffect(() => {
    if (!city) return;
    let active = true;
    setLoading(true);
    axios
      .get(`/api/autocomplete`, {
        params: { q: city },
      })
      .then((res) => {
        if (active) setCityOptions(res.data || []);
      })
      .catch(() => setCityOptions([]))
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [city]);

  // Получить город по IP/геолокации
  useEffect(() => {
    setGeoLoading(true);
    axios
      .get(`/api/ip`)
      .then((res) => {
        if (res.data && res.data.city) {
          setCity(res.data.city);
        }
      })
      .finally(() => setGeoLoading(false));
  }, []);

  // Получить прогноз по выбранному городу
  const fetchWeather = (selectedCity) => {
    setWeather(null);
    setError("");
    if (!selectedCity) return;
    setLoading(true);
    axios
      .get(`/api/forecast`, {
        params: { q: selectedCity, days: 3, lang: "ru" },
      })
      .then((res) => setWeather(res.data))
      .catch(() => setError("Не удалось получить прогноз погоды."))
      .finally(() => setLoading(false));
  };

  // Обработка выбора города
  const handleCityChange = (event, value) => {
    setCity(value || "");
    if (value) fetchWeather(value);
  };

  // Подписка на рассылку
  const handleSubscribe = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    axios
      .post("/api/subscribe", {
        city,
        email,
        frequency: freq,
      })
      .then(() => setSubscribed(true))
      .catch(() => setError("Ошибка при подписке. Проверьте email и попробуйте снова."))
      .finally(() => setSubmitting(false));
  };

  // Получить внешний IP, страну и код страны через backend-прокси
  useEffect(() => {
    setIpLoading(true);
    setIpError("");
    axios.get("/api/myip")
      .then(res => {
        if (res.data) {
          setUserIp(res.data.ip || "");
          setUserCountry(res.data.country || "");
          setUserCity(res.data.cc || "");
        }
      })
      .catch(() => {
        setUserIp("");
        setUserCountry("");
        setUserCity("");
        setIpError("Не удалось определить внешний IP");
      })
      .finally(() => setIpLoading(false));
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="container">
      <Typography variant="h4" gutterBottom>
        Погода и подписка
      </Typography>
      <Box mb={2}>
        <Paper elevation={1} sx={{ p: 1, mb: 2, background: '#f7f7f7' }}>
          {ipLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} />
              <Typography variant="body2">Определяем внешний IP...</Typography>
            </Box>
          ) : ipError ? (
            <Alert severity="error" sx={{ my: 1 }}>{ipError}</Alert>
          ) : (
            <Typography variant="body2">
              Ваш внешний IP: <b>{userIp || 'не определён'}</b><br/>
              Страна: <b>{userCountry || 'не определена'}</b><br/>
              Код страны: <b>{userCity || 'не определён'}</b>
            </Typography>
          )}
        </Paper>
      </Box>
      <Box mb={2}>
        <Autocomplete
          freeSolo
          options={cityOptions.map((opt) => opt.name + (opt.country ? ", " + opt.country : ""))}
          inputValue={city}
          onInputChange={(e, value) => setCity(value)}
          onChange={handleCityChange}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Город"
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {geoLoading && <Typography variant="body2">Определяем ваш город...</Typography>}
      </Box>
      {weather && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Погода в {weather.location.name}, {weather.location.country}</Typography>
          <Box display="flex" gap={2}>
            {weather.forecast.forecastday.map((day) => (
              <Box key={day.date} textAlign="center">
                <Typography variant="subtitle2">{day.date}</Typography>
                <img src={day.day.condition.icon} alt="icon" />
                <Typography>{day.day.avgtemp_c}°C</Typography>
                <Typography variant="body2">{day.day.condition.text}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
      <form onSubmit={handleSubscribe}>
        <Typography variant="h6" gutterBottom>Подписка на рассылку</Typography>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="freq-label">Частота</InputLabel>
          <Select
            labelId="freq-label"
            value={freq}
            label="Частота"
            onChange={(e) => setFreq(e.target.value)}
          >
            <MenuItem value="daily">Ежедневно</MenuItem>
            <MenuItem value="weekly">Еженедельно</MenuItem>
          </Select>
        </FormControl>
        {error && <Alert severity="error">{error}</Alert>}
        {subscribed && <Alert severity="success">Проверьте почту для подтверждения подписки!</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting || !city || !email}
          fullWidth
        >
          {submitting ? "Подписка..." : "Подписаться"}
        </Button>
      </form>
    </Box>
  );
};

export default WeatherPage;

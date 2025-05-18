import React, { useState, useEffect, useRef } from "react";
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
  const [country, setCountry] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [email, setEmail] = useState("");
  const [freq, setFreq] = useState("daily");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [startLoading, setStartLoading] = useState(true);
  const [startError, setStartError] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cityFieldFocused, setCityFieldFocused] = useState(false);
  const debounceTimeout = useRef();

  // Получить стартовые данные (город, страна, прогноз)
  useEffect(() => {
    setStartLoading(true);
    setStartError("");
    axios.get("/api/startdata")
      .then(res => {
        if (res.data && res.data.city) {
          setCity(res.data.city);
          setCountry(res.data.country || "");
          // Если прогноз уже есть в ответе, сразу сохраняем его
          if (res.data.forecast) {
            setWeather({
              location: { name: res.data.city, country: res.data.country },
              forecast: res.data.forecast
            });
          } else {
            // Если нет прогноза — подгружаем отдельно
            fetchWeather(res.data.city);
          }
        } else {
          setStartError(res.data && res.data.warning ? res.data.warning : "Город не определён. Введите вручную.");
        }
      })
      .catch(() => setStartError("Ошибка при определении города. Введите вручную."))
      .finally(() => setStartLoading(false));
  }, []);

  // Автодополнение города с дебаунсом
  useEffect(() => {
    if (!cityFieldFocused) return;
    if (!cityInput || cityInput.length < 3) {
      setCityOptions([]);
      return;
    }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      let active = true;
      setLoading(true);
      axios
        .get(`/api/autocomplete`, {
          params: { q: cityInput },
        })
        .then((res) => {
          if (active) setCityOptions(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setCityOptions([]))
        .finally(() => setLoading(false));
      return () => {
        active = false;
      };
    }, 1000); // 1000 мс = 1 секунда задержки
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [cityInput, cityFieldFocused]);

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

  return (
    <Box className="container">
      <Typography variant="h4" gutterBottom>
        Погода и подписка
      </Typography>
      {startLoading ? (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CircularProgress size={18} />
          <Typography variant="body2">Определяем ваш город...</Typography>
        </Box>
      ) : startError ? (
        <Alert severity="warning" sx={{ my: 2 }}>{startError}</Alert>
      ) : null}
      {/* Прогноз погоды на 3 дня — всегда над полем города */}
      {weather && weather.location && weather.forecast && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, background: '#91bf9d9c' }}>
          <Typography variant="h6">Погода в {weather.location.name}, {weather.location.country}</Typography>
          <Box display="flex" gap={2} width="100%">
            {weather.forecast.forecastday.map((day) => (
              <Box
                key={day.date}
                textAlign="center"
                sx={{ flex: 1, minWidth: 0, background: '#f5f7fa', borderRadius: 2, p: 1 }}
              >
                <Typography variant="subtitle2">{day.date}</Typography>
                <img src={day.day.condition.icon} alt="icon" />
                <Typography>{day.day.avgtemp_c}°C</Typography>
                <Typography variant="body2">{day.day.condition.text}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
      <Box mb={2}>
        <Autocomplete
          freeSolo
          options={Array.isArray(cityOptions) ? cityOptions.map((opt) => opt.name + (opt.country ? ", " + opt.country : "")) : []}
          inputValue={city}
          onInputChange={(e, value, reason) => {
            setCityInput(value);
            if (reason === 'input') setCity(value);
            if (reason === 'clear') {
              setCity("");
              setCityInput("");
              setCityOptions([]);
              setWeather(null);
            }
          }}
          onFocus={() => setCityFieldFocused(true)}
          onBlur={() => setCityFieldFocused(false)}
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
        {country && city && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Страна: <b>{country}</b>
          </Typography>
        )}
      </Box>
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

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
import escapeHtml from 'escape-html';

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

  // Email validation regex
  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  // City validation regex (только буквы, пробелы, дефис, скобки, одинарная кавычка, min 4 символа)
  const cityRegex = /^[A-Za-z\s\-()'’]{4,}$/;
  // Throttle for autocomplete (store last value and time)
  const lastAutoComplete = useRef({ value: '', ts: 0 });

  // Получить стартовые данные (город, страна, прогноз)
  useEffect(() => {
    setStartLoading(true);
    setStartError("");
    axios.get("/api/startdata")
      .then(res => {
        if (res.data && res.data.city) {
          // Берём только город до запятой
          const cityName = res.data.city.includes(',') ? res.data.city.split(',')[0].trim() : res.data.city;
          setCity(cityName);
          setCountry(res.data.country || "");
          // Если прогноз уже есть в ответе, сразу сохраняем его
          if (res.data.forecast) {
            setWeather({
              location: { name: cityName, country: res.data.country },
              forecast: res.data.forecast
            });
          } else {
            // Если нет прогноза — подгружаем отдельно
            fetchWeather(cityName);
          }
        } else {
          setStartError(res.data && res.data.warning ? res.data.warning : "Город не определён. Введите вручную.");
        }
      })
      .catch(() => setStartError("Ошибка при определении города. Введите вручную."))
      .finally(() => setStartLoading(false));
  }, []);

  // Автодополнение города с дебаунсом и throttle
  useEffect(() => {
    if (!cityFieldFocused) return;
    if (!cityInput || cityInput.length < 4) {
      setCityOptions([]);
      return;
    }
    // Запретить цифры и спецсимволы
    if (!cityRegex.test(cityInput)) {
      setCityOptions([]);
      return;
    }
    // Throttle: не отправлять повторный запрос, если значение не изменилось или прошло < 2 сек
    const now = Date.now();
    if (
      lastAutoComplete.current.value === cityInput &&
      now - lastAutoComplete.current.ts < 2000
    ) {
      return;
    }
    lastAutoComplete.current = { value: cityInput, ts: now };
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
    }, 1000);
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
        params: { q: selectedCity, days: 3, lang: "en" }, // язык прогноза теперь английский
      })
      .then((res) => setWeather(res.data))
      .catch(() => setError("Failed to get weather forecast."))
      .finally(() => setLoading(false));
  };

  // Обработка выбора города
  const handleCityChange = (event, value) => {
    // Если value содержит запятую, берем только часть до запятой
    let cityName = value && value.includes(',') ? value.split(',')[0].trim() : value;
    setCity(cityName || "");
    // Найти страну для выбранного города из cityOptions
    if (value) {
      const found = cityOptions.find(
        (opt) => (opt.name + (opt.country ? ", " + opt.country : "")) === value
      );
      if (found && found.country) {
        setCountry(found.country);
      }
    }
    if (cityName) fetchWeather(cityName);
  };

  // Подписка на рассылку
  const handleSubscribe = (e) => {
    e.preventDefault();
    setError("");
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isCityValid) {
      setError("Please enter a valid city name (letters, spaces, min 4 chars, no digits/specials).");
      return;
    }
    setSubmitting(true);
    // XSS фильтрация
    const safeCity = escapeHtml(city);
    const safeEmail = escapeHtml(email);
    axios
      .post("/api/subscribe", {
        city: safeCity,
        email: safeEmail,
        frequency: freq,
      })
      .then(() => setSubscribed(true))
      .catch(() => setError("Subscription error. Please check your email and try again."))
      .finally(() => setSubmitting(false));
  };

  // Email and city validation for subscribe
  const isEmailValid = emailRegex.test(email);
  // Для валидации используем только часть до запятой
  const cityForValidation = city && city.includes(',') ? city.split(',')[0].trim() : city;
  const isCityValid = cityRegex.test(cityForValidation);

  return (
    <Box className="container">
      <Typography variant="h4" gutterBottom>
        Weather & Subscription
      </Typography>
      {startLoading ? (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CircularProgress size={18} />
          <Typography variant="body2">Detecting your city...</Typography>
        </Box>
      ) : startError ? (
        <Alert severity="warning" sx={{ my: 2 }}>{startError}</Alert>
      ) : null}
      {/* 3-day weather forecast always above the city field */}
      {weather && weather.location && weather.forecast && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, background: '#91bf9d9c' }}>
          <Typography variant="h6">Weather in {weather.location.name}, {weather.location.country}</Typography>
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
            // Фильтрация спецсимволов и цифр
            const filtered = value.replace(/[^A-Za-z\s\-]/g, '');
            setCityInput(filtered);
            if (reason === 'input') setCity(filtered);
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
              label="City"
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
            Country: <b>{country}</b>
          </Typography>
        )}
      </Box>
      <form onSubmit={handleSubscribe}>
        <Typography variant="h6" gutterBottom>Subscribe to forecast</Typography>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          margin="normal"
          error={!!error && !isEmailValid}
          helperText={!!error && !isEmailValid ? error : ''}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="freq-label">Frequency</InputLabel>
          <Select
            labelId="freq-label"
            value={freq}
            label="Frequency"
            onChange={(e) => setFreq(e.target.value)}
          >
            <MenuItem value="hourly">Hourly</MenuItem>
            <MenuItem value="daily">Daily</MenuItem>
          </Select>
        </FormControl>
        {error && <Alert severity="error">{error}</Alert>}
        {subscribed && <Alert severity="success">Check your email to confirm subscription!</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting || !city || !email}
          fullWidth
        >
          {submitting ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    </Box>
  );
};

export default WeatherPage;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const UnsubscribePage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    setStatus("pending");
    axios
      .get(`/api/unsubscribe/${token}`)
      .then((res) => {
        if (res.data && res.data.unsubscribed) {
          setStatus("success");
          setMessage("Вы успешно отписались от рассылки.");
        } else {
          setStatus("error");
          setMessage("Некорректный токен или уже отписаны.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Ошибка отписки. Попробуйте позже или обратитесь в поддержку.");
      });
  }, [token]);

  return (
    <div>
      <h1>Отписка от рассылки</h1>
      {status === "pending" && <p>Проверяем токен...</p>}
      {status !== "pending" && <p>{message}</p>}
    </div>
  );
};

export default UnsubscribePage;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ConfirmPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    setStatus("pending");
    axios
      .get(`/api/confirm/${token}`)
      .then((res) => {
        if (res.data && res.data.confirmed) {
          setStatus("success");
          setMessage("Subscription successfully confirmed!");
        } else {
          setStatus("error");
          setMessage("Некорректный токен или подписка уже подтверждена.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Ошибка подтверждения. Попробуйте позже или обратитесь в поддержку.");
      });
  }, [token]);

  return (
    <div>
      <h1>Подтверждение подписки</h1>
      {status === "pending" && <p>Проверяем токен...</p>}
      {status !== "pending" && <p>{message}</p>}
    </div>
  );
};

export default ConfirmPage;

import React from "react";
import { useParams } from "react-router-dom";

const ConfirmPage = () => {
  const { token } = useParams();
  return (
    <div>
      <h1>Подтверждение подписки</h1>
      <p>Токен: {token}</p>
      {/* Здесь будет логика подтверждения подписки */}
    </div>
  );
};

export default ConfirmPage;

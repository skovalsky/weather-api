import React from "react";
import { useParams } from "react-router-dom";

const UnsubscribePage = () => {
  const { token } = useParams();
  return (
    <div>
      <h1>Отписка от рассылки</h1>
      <p>Токен: {token}</p>
      {/* Здесь будет логика отписки */}
    </div>
  );
};

export default UnsubscribePage;

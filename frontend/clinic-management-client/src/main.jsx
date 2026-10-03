// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

import App from "./App";
import { store } from "./store/store";
import "./index.css"; // <-- THÊM DÒNG NÀY (Đường dẫn tới file chứa Tailwind directives)

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
        </Provider>
    </React.StrictMode>
);
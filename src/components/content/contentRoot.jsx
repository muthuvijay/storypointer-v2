import React from "react";
import ReactDOM from "react-dom/client";
import MainPanel from "./mainPanel";

const rootElement = document.createElement("div");
rootElement.id = "react-root";
document.body.appendChild(rootElement);

ReactDOM.createRoot(document.getElementById("react-root")).render(
  <React.StrictMode>
    <MainPanel />
  </React.StrictMode>
);

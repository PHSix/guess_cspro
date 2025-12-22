import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./global.scss";

createRoot(document.getElementById("root")!).render(<App />);

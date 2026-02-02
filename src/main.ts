import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

console.log("Frontend build:", import.meta.env.MODE, new Date().toISOString());

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;

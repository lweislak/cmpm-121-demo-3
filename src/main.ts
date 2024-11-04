import "./style.css";

const APP_NAME = "D3: Geocoin Carrier";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

const button = document.createElement("button");
app.append(button);

button.addEventListener("click", function () {
  alert("You clicked the button!");
});

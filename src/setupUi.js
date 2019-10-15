import setupListeners from "./setupListeners.js";

const NUM_STEPS = 11;
const PAGES = Array.from({ length: NUM_STEPS }).map((_, i) => `step${i + 1}`);

const render = html => {
  const content = document.getElementById("content");
  content.innerHTML = html;
};

let exitFn;

const setView = (name, state) => {
  import(`./${name}.js`).then(({ template, entry, exit }) => {
    if (exitFn) {
      exitFn();
    }
    history.pushState(null, null, `#/${name}`);
    render(template);
    entry(state);
    exitFn = exit;
  });
};

const setupMenu = state => {
  const menu = document.getElementById("menu");
  PAGES.forEach(page => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerHTML = page;
    a.href = "#";
    a.addEventListener("click", evt => {
      evt.preventDefault();
      setView(page, state);
    });
    li.appendChild(a);
    menu.appendChild(li);
  });
};

const setupUi = state => {
  setupListeners(state);
  setupMenu(state);

  const currentPage = window.location.hash.slice(2);
  if (currentPage) {
    setView(currentPage, state);
  }
};

export default setupUi;

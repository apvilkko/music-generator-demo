import setupListeners from "./setupListeners.js";

const NUM_STEPS = 11;
const NUM_VIEWS = 10;
const VIEWS = {
  views: Array.from({ length: NUM_VIEWS }).map((_, i) => `view${i + 1}`),
  steps: Array.from({ length: NUM_STEPS }).map((_, i) => `step${i + 1}`)
};

const render = html => {
  const content = document.getElementById("content");
  content.innerHTML = html;
};

let exitFn;

const setMenuVisible = name => {
  Object.keys(VIEWS).forEach(view => {
    const el = document.getElementById(`menu-${view}`);
    if (name === view) {
      el.style = "display: block;";
    } else {
      el.style = "display: none;";
    }
  });
  document.getElementById("toggle").className =
    name.indexOf("view") > -1 ? "minimal" : "";
};

let lastChanged;

const setView = (name, state) => {
  if (name.endsWith("s")) {
    setMenuVisible(name);
  } else {
    const prefix = name.indexOf("step") > -1 ? "steps/" : "views/";
    const hasPrefix = name.indexOf("/") > 0;
    const path = `/${hasPrefix ? "" : prefix}${name}`;
    const parts = path.split("/");
    const viewChild = parts[parts.length - 1];
    import(`.${path}.js`).then(({ template, entry, exit }) => {
      if (exitFn) {
        exitFn();
      }
      history.pushState(null, null, `#${path}`);
      if (lastChanged) {
        document.getElementById(`menuitem-${lastChanged}`).className = "";
      }
      document.getElementById(`menuitem-${viewChild}`).className = "active";
      lastChanged = viewChild;
      render(template);
      entry(state);
      exitFn = exit;
    });
  }
};

const createMenuElement = (state, root) => page => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.innerHTML = page;
  a.id = `menuitem-${page}`;
  a.href = "#";
  a.addEventListener("click", evt => {
    evt.preventDefault();
    setView(page, state);
  });
  li.appendChild(a);
  root.appendChild(li);
};

const setupMenu = state => {
  const container = document.getElementById("menu-container");
  const tabs = document.getElementById("tabs");
  Object.keys(VIEWS).forEach(view => {
    createMenuElement(state, tabs)(view);
    const menu = document.createElement("ul");
    menu.className = "menu";
    menu.id = `menu-${view}`;
    VIEWS[view].forEach(createMenuElement(state, menu));
    container.appendChild(menu);
  });
  setMenuVisible("views");
};

const setupUi = state => {
  setupListeners(state);
  setupMenu(state);

  document.addEventListener("keydown", evt => {
    const key = evt.key;
    const match = lastChanged.match(/^(.+)(\d+)/);
    const page = Number(match[2]);
    if (!isNaN(page)) {
      if (key === "ArrowRight") {
        setView(`${match[1]}${page + 1}`, state);
      } else if (key === "ArrowLeft") {
        setView(`${match[1]}${page - 1}`, state);
      }
    }
    if (key === "v") {
      setView("views");
    } else if (key === "s") {
      setView("steps");
    }
  });

  const currentPage = window.location.hash.slice(2);
  if (currentPage) {
    setView(currentPage, state);
  }
};

export default setupUi;

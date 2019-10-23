import info from "../info.js";

const template = `
<h1>Who</h1>
<h2>${info.name}</h2>
<ul>
${info.bio.map(x => `<li>${x}</li>`).join("")}
</ul>
`;

const entry = () => {};
const exit = () => {};

export { template, entry, exit };

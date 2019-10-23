import info from "../info.js";

const template = `
<h2><a href="${info.homepage}">${info.homepage}</a></h2>
<h2><a href="${info.github}">${info.github}</a></h2>
<h2><a href="mailto:${info.email}">${info.email}</a></h2>
`;

const entry = () => {};
const exit = () => {};

export { template, entry, exit };

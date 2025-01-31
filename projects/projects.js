// Importing Functions
import { fetchJSON, renderProjects } from "../global.js";

// Selecting Projects Container
const projectsContainer = document.querySelector(".projects");


// Fetching Project Data
const projects = await fetchJSON("../lib/projects.json");

// Rendering Projects
projects.forEach((project) => {
    renderProjects(project, projectsContainer, "h2");
});


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

// Import D3 
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Create an arc generator with inner radius 0 and outer radius 50
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// // Define our pie chart data: two slices (one for 1, one for 2, i.e., 33% and 66%)
// let data = [1, 2, 3, 4, 5, 5];

// Define a color scale using D3’s ordinal scale and Tableau10 color scheme
const colors = d3.scaleOrdinal(d3.schemeTableau10);

// Function to render/update the pie chart and legend
function renderPieChart(projectsGiven) {
  // Use d3.rollups() to group projects by year and count the number of projects for each year
  const newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  
  // Map the rolled data to our expected format: { value: count, label: year }
  const newData = newRolledData.map(([year, count]) => ({ value: count, label: year }));
  
  // Use d3.pie() to compute the start and end angles for each slice
  const newSliceGenerator = d3.pie().value((d) => d.value);
  const newArcData = newSliceGenerator(newData);
  
  // Generate the path data for each arc slice using our arc generator
  const newArcs = newArcData.map((d) => arcGenerator(d));
  
  // Clear any existing arcs
  const svg = d3.select("#projects-pie-plot");
  svg.selectAll("path").remove();
  
  // Append each arc as a separate <path> element
  newArcs.forEach((arcPath, idx) => {
    svg.append("path")
       .attr("d", arcPath)
       .attr("fill", colors(idx));
  });
  
  // Clear any existing legend items
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();
  
  // Append new legend items
  newData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // sets the custom color via CSS variable
          .attr('class', 'legend-item')            // add class for individual styling
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Initial render of the pie chart on page load
renderPieChart(projects);

// -----------------------
// Add Search Functionality

// Declare a variable for the search query
let query = '';

// Select the search input element
const searchInput = document.querySelector('.searchBar');

// Listen for input changes using "input" for real-time interactivity
searchInput.addEventListener('input', (event) => {
  // Update the query value
  query = event.target.value.trim();
  
  // Filter projects across all metadata (e.g., title, description, etc.) case-insensitively
  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  
  // Clear the current projects container
  projectsContainer.innerHTML = '';
  
  // Re-render the filtered projects
  filteredProjects.forEach((project) => {
    renderProjects(project, projectsContainer, "h2");
  });
  
  // Update the pie chart and legend to reflect only the visible projects
  renderPieChart(filteredProjects);
});
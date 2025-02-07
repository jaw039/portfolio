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

// Use d3.rollups() to group projects by year and count the number of projects for each year
let rolledData = d3.rollups(
    projects, 
    v => v.length, 
    d => d.year
  );
  
  // Map the rolled data to our expected format: { value: count, label: year }
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  
  // Use d3.pie() to compute the start and end angles for each slice and tell it how to access the value
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  
  // Generate the path data for each arc slice using our arc generator
  let arcs = arcData.map((d) => arcGenerator(d));
  
  // Define a color scale using D3’s ordinal scale and Tableau10 color scheme
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  // Append each arc as a separate <path> element to the SVG with id "projects-pie-plot"
  arcs.forEach((arcPath, idx) => {
    d3.select("#projects-pie-plot")
      .append("path")
      .attr("d", arcPath)
      .attr("fill", colors(idx));
  });
  
 
  // Append each legend item with an added class name "legend-item"
  let legend = d3.select('.legend');
  
  data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // sets the custom color via CSS variable
          .attr('class', 'legend-item')            // add class for individual styling
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

// Selecting Projects Container
const projectsContainer = document.querySelector(".projects");
const searchInput = document.querySelector(".searchBar");
const projectsTitle = document.querySelector(".projects-title");

// Global state
let selectedIndex = -1;
let projects = await fetchJSON("../lib/projects.json");
// currentProjects holds the projects filtered by search
let currentProjects = projects;

// Render all projects initially
projects.forEach((project) => {
  renderProjects(project, projectsContainer, "h2");
});
if (projectsTitle) {
  projectsTitle.innerHTML = `${projects.length} Projects`;
}

// Create an arc generator with inner radius 0 and outer radius 50
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// Define a color scale (using Tableau10)
const colors = d3.scaleOrdinal(d3.schemeTableau10);

/**
 * Update the classes on wedges and legend items.
 */
function updateWedgeAndLegendStyles() {
  // Update wedge styles using d3.classed()
  d3.select("#projects-pie-plot")
    .selectAll("path")
    .classed("selected", (_, idx) => idx === selectedIndex);

  // Update legend styles using d3.classed()
  d3.select(".legend")
    .selectAll("li")
    .classed("selected-legend", (_, idx) => idx === selectedIndex);
}

/**
 * Recalculate the rolled data from given projects.
 */
function recalculate(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  return rolledData.map(([year, count]) => ({
    value: count,
    label: year.toString()
  }));
}

/**
 * Build the arcs, register click events on wedges and legend items.
 */
function renderPieChart(projectsGiven) {
  // Calculate data for pie chart
  const newData = recalculate(projectsGiven);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(newData);
  const arcs = arcData.map(d => arcGenerator(d));
  
  // Clear and rebuild the pie svg elements
  const svg = d3.select("#projects-pie-plot");
  svg.selectAll("path").remove();

  arcs.forEach((arcPath, idx) => {
    svg.append("path")
       .attr("d", arcPath)
       .attr("fill", colors(idx))
       .style("cursor", "pointer")
       .on("click", () => {
         // Toggle selection
         selectedIndex = selectedIndex === idx ? -1 : idx;
         updateWedgeAndLegendStyles();
         
         if (selectedIndex === -1) {
           // Show current (search filtered) projects when nothing is selected
           projectsContainer.innerHTML = '';
           currentProjects.forEach(project => renderProjects(project, projectsContainer, "h2"));
         } else {
           // Filter currentProjects by selected year
           const selectedYear = newData[selectedIndex].label;
           const filteredProjects = currentProjects.filter(proj => 
             proj.year.toString() === selectedYear
           );
           projectsContainer.innerHTML = '';
           filteredProjects.forEach(project => renderProjects(project, projectsContainer, "h2"));
         }
       });
  });

  // Rebuild the legend items
  const legend = d3.select(".legend");
  legend.html(""); // Clear legend
  
  newData.forEach((d, idx) => {
    legend.append("li")
          .attr("style", `--color:${colors(idx)}`) // sets color via CSS variable
          .attr("class", "legend-item")
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
          .style("cursor", "pointer")
          .on("click", () => {
            // Toggle selection from legend
            selectedIndex = selectedIndex === idx ? -1 : idx;
            updateWedgeAndLegendStyles();
            
            if (selectedIndex === -1) {
              projectsContainer.innerHTML = '';
              currentProjects.forEach(project => renderProjects(project, projectsContainer, "h2"));
            } else {
              const selectedYear = d.label;
              const filteredProjects = currentProjects.filter(proj => 
                proj.year.toString() === selectedYear
              );
              projectsContainer.innerHTML = '';
              filteredProjects.forEach(project => renderProjects(project, projectsContainer, "h2"));
            }
          });
  });
}

// Initial render of the pie chart and legend
renderPieChart(projects);

// Search functionality to filter projects and update chart/legend accordingly
searchInput.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  currentProjects = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });
  
  // Reset selection
  selectedIndex = -1;
  
  projectsContainer.innerHTML = '';
  currentProjects.forEach(project => renderProjects(project, projectsContainer, "h2"));
  
  if (projectsTitle) {
    projectsTitle.innerHTML = `${currentProjects.length} Projects`;
  }
  renderPieChart(currentProjects);
});
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
    // Update pie wedge classes
    d3.select("#projects-pie-plot")
      .selectAll("path")
      .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""));
    
    // Update legend items - only change the swatch color
    d3.select(".legend")
      .selectAll("li")
      .attr("class", "legend-item")
      .select(".swatch")
      .style("background-color", (_, idx) => 
        idx === selectedIndex ? "oklch(60% 45% 0)" : colors(idx)
      );
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
  // Calculate data for pie chart (rolled up by year).
  const newData = recalculate(projectsGiven);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(newData);
  const arcs = arcData.map(d => arcGenerator(d));
  
  // Clear and rebuild the pie svg elements and legend.
  const svg = d3.select("#projects-pie-plot");
  svg.selectAll("path").remove();
  
  const legend = d3.select(".legend");
  legend.html("");
  
  // Build wedges with click events.
  arcs.forEach((arc, i) => {
    svg.append("path")
       .attr("d", arc)
       .attr("fill", colors(i))
       .style("cursor", "pointer")
       .on("click", () => {
         // Toggle selection: deselect if already selected.
         selectedIndex = selectedIndex === i ? -1 : i;
         
         // Update styles for wedges and legend.
         updateWedgeAndLegendStyles();
         
         // Filter the projects based on selection.
         if (selectedIndex === -1) {
           // No selection: render all projects.
           projectsContainer.innerHTML = "";
           projects.forEach(project => renderProjects(project, projectsContainer, "h2"));
           if (projectsTitle) {
             projectsTitle.innerHTML = `${projects.length} Projects`;
           }
         } else {
           // A wedge is selected: filter by the corresponding year.
           const selectedYear = newData[selectedIndex].label;
           const filtered = projects.filter(project => String(project.year) === selectedYear);
           projectsContainer.innerHTML = "";
           filtered.forEach(project => renderProjects(project, projectsContainer, "h2"));
           if (projectsTitle) {
             projectsTitle.innerHTML = `${filtered.length} Projects`;
           }
         }
       });
  });
  
    // Build legend items with click events.
    newData.forEach((d, i) => {
        legend.append("li")
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .html(`<span class="swatch" style="background-color: ${colors(i)}"></span>${d.label} <em>(${d.value})</em>`)
        .on("click", () => {
            selectedIndex = selectedIndex === i ? -1 : i;
            updateWedgeAndLegendStyles();
            
            if (selectedIndex === -1) {
            projectsContainer.innerHTML = "";
            projects.forEach(project => renderProjects(project, projectsContainer, "h2"));
            if (projectsTitle) {
                projectsTitle.innerHTML = `${projects.length} Projects`;
            }
            } else {
            const selectedYear = newData[selectedIndex].label;
            const filtered = projects.filter(project => String(project.year) === selectedYear);
            projectsContainer.innerHTML = "";
            filtered.forEach(project => renderProjects(project, projectsContainer, "h2"));
            if (projectsTitle) {
                projectsTitle.innerHTML = `${filtered.length} Projects`;
            }
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
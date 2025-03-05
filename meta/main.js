// Filter commits by the maximum time
function filterCommitsByTime() {
  commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
  
  // Clear selected commits when time changes
  selectedCommits = [];
}let data = [];
let commits = [];
let filteredCommits = []; // Add filteredCommits variable
let xScale, yScale, timeScale; // Make scales global
let selectedCommits = [];
let commitProgress = 100;
let commitMaxTime;

// Scrollytelling variables
let NUM_ITEMS; // Will be set to commits.length 
let ITEM_HEIGHT = 60; // Taller to fit narrative text
let VISIBLE_COUNT = 10;
let totalHeight;

const width = 1000;
const height = 600;

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  
  displayStats();
}

function getTimeColor(hour) {
  if (hour < 6) return "#2c5282"; // Deep blue for night
  if (hour < 12) return "#ed8936"; // Orange for morning
  if (hour < 18) return "#ecc94b"; // Yellow for afternoon
  return "#4299e1"; // Light blue for evening
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');

  if (!selectedCommits.length) {
      container.innerHTML = '';
      return;
  }

  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(
      lines,
      v => v.length,
      d => d.type.toLowerCase() // ensure lowercase language names
  );

  container.innerHTML = '';
  
  // Sort by language name
  const sortedEntries = Array.from(breakdown.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [language, count] of sortedEntries) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1%')(proportion);
      
      const dt = document.createElement('dt');
      dt.textContent = language;
      container.appendChild(dt);
      
      const dd = document.createElement('dd');
      dd.textContent = `${count} lines\n(${formatted})`;
      container.appendChild(dd);
  }
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${selectedCommits.length || 'No'} commit${selectedCommits.length === 1 ? '' : 's'} selected`;
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });

      return ret;
    });
}

function displayStats() {
  processCommits();
  
  // Set up time scale after commits are processed
  timeScale = d3.scaleTime()
    .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
    .range([0, 100]);
  commitMaxTime = timeScale.invert(commitProgress);
  
  // Initialize filtered commits
  filterCommitsByTime();

  const statsDiv = d3.select('#stats')
    .append('div')
    .attr('class', 'summary-section');

  statsDiv.append('h2')
    .text('Summary');

  const statsGrid = statsDiv.append('div')
    .attr('class', 'stats-grid');

  const labels = statsGrid.append('div')
    .attr('class', 'metric-labels');
  labels.append('div').text('COMMITS');
  labels.append('div').text('FILES');
  labels.append('div').text('TOTAL LOC');
  labels.append('div').text('MAX DEPTH');
  labels.append('div').text('LONGEST LINE');
  labels.append('div').text('MAX LINES');

  const values = statsGrid.append('div')
    .attr('class', 'metric-values');
  values.append('div').text(commits.length);
  values.append('div').text(d3.group(data, d => d.file).size);
  values.append('div').text(data.length);
  values.append('div').text(d3.max(data, d => d.depth));
  values.append('div').text(d3.max(data, d => d.length));
  values.append('div').text(d3.max(data, d => d.line));
}

function updateTooltipContent(commit) {
  const tooltip = document.getElementById('commit-tooltip');
  
  if (!commit || !commit.id) {
    tooltip.hidden = true;
    return;
  }

  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id.slice(0, 7);
  date.textContent = commit.datetime.toLocaleString('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  time.textContent = commit.datetime.toLocaleString('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;

  tooltip.hidden = false;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const margin = 16;
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = event.clientX + margin;
  let top = event.clientY + margin;

  if (left + tooltipRect.width > viewportWidth) {
    left = event.clientX - tooltipRect.width - margin;
  }
  if (top + tooltipRect.height > viewportHeight) {
    top = event.clientY - tooltipRect.height - margin;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function createBrush(svg, mainGroup) {
  const brush = d3.brush().on('start brush end', (evt) => {
    let brushSelection = evt.selection;
    selectedCommits = !brushSelection
      ? []
      : filteredCommits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.datetime);
          let y = yScale(commit.hourFrac);

          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
        
    if (brushSelection) {
      // Update visual selection
      mainGroup.selectAll("circle").classed("selected", (d) => isCommitSelected(d));
    } else {
      // Clear selection if brush is removed
      mainGroup.selectAll("circle").classed("selected", false);
    }

    // Update selection stats
    updateSelectionCount();
    updateLanguageBreakdown();
  });

  // Add brush to existing brush group
  svg.select(".brush").call(brush);

  return brush;
}

function updateScatterplot(filteredCommits) {
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
  // Clear existing SVG
  d3.select('#chart svg').remove();
  
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', '100%') // Make sure it fills the container
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  const mainGroup = svg.append('g');
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Update scales to use filteredCommits
  xScale = d3
    .scaleTime()
    .domain(d3.extent(filteredCommits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
  
  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  const gridlines = mainGroup
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
  
  mainGroup
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
  
  mainGroup
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
  
  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
  const dots = mainGroup.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('--r', (d) => rScale(d.totalLines)) // Set CSS variable for radius-based transition timing
    .attr('fill', d => getTimeColor(d.datetime.getHours()))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      updateTooltipContent(commit);
      updateTooltipPosition(event);
      d3.select(event.target)
        .classed('selected', isCommitSelected(commit))
        .transition()
        .duration(200)
        .style('fill-opacity', 1)
        .attr('r', d => rScale(d.totalLines) * 1.2);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event, commit) => {
      updateTooltipContent({});
      d3.select(event.target)
        .classed('selected', isCommitSelected(commit))
        .transition()
        .duration(200)
        .style('fill-opacity', 0.7)
        .attr('r', d => rScale(d.totalLines));
    });

  // Create and add brush
  const brushGroup = svg.append("g").attr("class", "brush");
  createBrush(svg, mainGroup);

  // Ensure dots are above brush overlay by moving the brush group below dots
  brushGroup.lower();
  
  // Fix pointer events
  brushGroup.select('.overlay').style('pointer-events', 'all');
  brushGroup.select('.selection').style('pointer-events', 'none');
  brushGroup.selectAll('.handle').style('pointer-events', 'none');
}

// Update the display of the selected time
function updateTimeDisplay() {
  const selectedTime = document.getElementById('selectedTime');
  if (selectedTime) {
    selectedTime.textContent = timeScale.invert(commitProgress).toLocaleString('en', {
      dateStyle: "long",
      timeStyle: "short"
    });
  }
  
  // Filter commits and update visualization
  filterCommitsByTime();
  updateScatterplot(filteredCommits);
  updateFileVisualization(); // Add this line
  updateSelectionCount();
  updateLanguageBreakdown();
}

// Create file visualization
function updateFileVisualization() {
  // Get all lines from filtered commits
  let lines = filteredCommits.flatMap((d) => d.lines);
  
  // Group lines by file
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });
    
  // Sort files by number of lines (descending)
  files = d3.sort(files, (d) => -d.lines.length);
  
  // Create color scale for file types
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  
  // Create files container if it doesn't exist
  if (!d3.select('.files').size()) {
    d3.select('#stats').append('h2').text('Files by Size');
    d3.select('#stats').append('dl').attr('class', 'files');
  }
  
  // Clear previous content
  d3.select('.files').selectAll('div').remove();
  
  // Create file entries
  let filesContainer = d3.select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  
  // Add file names with line count
  filesContainer.append('dt')
    .html(d => `
      <code>${d.name}</code>
      <small>${d.lines.length} lines</small>
    `);
  
  // Add unit visualization with one div per line
  const dds = filesContainer.append('dd');
  
  dds.selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type.toLowerCase()));
}

// Set up scrollytelling after commits are processed
function setupScrollytelling() {
  NUM_ITEMS = commits.length;
  totalHeight = NUM_ITEMS * ITEM_HEIGHT;
  
  // Make sure these elements exist
  if (!d3.select('#spacer').size()) {
    console.error('Missing #spacer element');
    return;
  }
  
  const scrollContainer = d3.select('#scroll-container');
  const spacer = d3.select('#spacer');
  spacer.style('height', `${totalHeight}px`);
  
  console.log("Setting up scrollytelling with", commits.length, "commits");
  
  // Initial render - make sure newCommitSlice has items
  renderItems(0);
  
  // Add scroll event listener
  scrollContainer.on('scroll', () => {
    const scrollTop = scrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    renderItems(startIndex);
  });
}

// Render commit items in the scrollytelling container
function renderItems(startIndex) {
  const itemsContainer = d3.select('#items-container');
  
  // Clear previous items
  itemsContainer.selectAll('div').remove();
  
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
  let newCommitSlice = commits.slice(startIndex, endIndex);
  
  // Update scatter plot with the visible commits
  updateScatterplot(newCommitSlice);
  
  // Update file visualization with the visible commits
  displayCommitFiles(newCommitSlice);
  
  // Create commit narrative items
  itemsContainer.selectAll('div')
    .data(newCommitSlice)
    .enter()
    .append('div')
    .attr('class', 'item')
    .html((commit, index) => {
      return `
        <p>
          On ${commit.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, 
          <a href="${commit.url}" target="_blank">
            ${index + startIndex > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
          </a> was made. 
          ${commit.totalLines} lines were edited across 
          ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
          Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    })
    .style('position', 'absolute')
    .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`);
}

// Update file visualization for visible commits
function displayCommitFiles(visibleCommits) {
  const lines = visibleCommits.flatMap((d) => d.lines);
  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
  
  let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => {
    return { name, lines };
  });
  
  // Sort by size
  files = d3.sort(files, (d) => -d.lines.length);
  
  // Update visualization
  d3.select('.files').selectAll('div').remove();
  
  let filesContainer = d3.select('.files')
    .selectAll('div')
    .data(files)
    .enter()
    .append('div');
  
  filesContainer.append('dt')
    .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
  
  filesContainer.append('dd')
    .selectAll('div')
    .data(d => d.lines)
    .enter()
    .append('div')
    .attr('class', 'line')
    .style('background', d => fileTypeColors(d.type.toLowerCase()));
}

// Add event listener for the time slider
function setupTimeSlider() {
  const slider = document.getElementById('time-slider');
  if (slider) {
    slider.addEventListener('input', (event) => {
      commitProgress = Number(event.target.value);
      updateTimeDisplay();
    });
  }
}

// Modify your DOMContentLoaded event to use scrollytelling instead of time slider
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  // Instead of setting up time slider, set up scrollytelling
  setupScrollytelling();
});
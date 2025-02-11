let data = [];
let commits = [];

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

  const statsDiv = d3.select('#stats')
    .append('div')
    .attr('class', 'summary-section');

  statsDiv.append('h2')
    .text('Summary');

  const statsGrid = statsDiv.append('div')
    .attr('class', 'stats-grid');

  // Add metric labels
  const labels = statsGrid.append('div')
    .attr('class', 'metric-labels');
  labels.append('div').text('COMMITS');
  labels.append('div').text('FILES');
  labels.append('div').text('TOTAL LOC');
  labels.append('div').text('MAX DEPTH');
  labels.append('div').text('LONGEST LINE');
  labels.append('div').text('MAX LINES');

  // Add metric values
  const values = statsGrid.append('div')
    .attr('class', 'metric-values');
  values.append('div').text(commits.length);
  values.append('div').text(d3.group(data, d => d.file).size);
  values.append('div').text(data.length);
  values.append('div').text(d3.max(data, d => d.depth));
  values.append('div').text(d3.max(data, d => d.length));
  values.append('div').text(d3.max(data, d => d.line));
}

function createScatterplot() {
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    // Add gridlines BEFORE the axes
    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);
  
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
  
    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    // Add Y axis
    svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    // Add the dots
    const dots = svg.append('g').attr('class', 'dots');
  
    dots
      .selectAll('circle')
      .data(commits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', 5)
      .attr('fill', 'steelblue');
  }

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot(); // Moved here as per instruction
});
let data = [];
let commits = [];

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

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
});
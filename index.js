// Import Required Function
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Fetch and Filter Projects
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
latestProjects.forEach(project => {
    renderProjects(project, projectsContainer, 'h2');
});

// New GitHub stats code
const profileStats = document.querySelector('#profile-stats');

// Replace 'your-username' with your actual GitHub username
const githubData = await fetchGitHubData('jaw039');

if (profileStats && githubData) {
    profileStats.innerHTML = `
        <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}
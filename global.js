// console.log('IT’S ALIVE!');

// function $$(selector, context = document) {
//   return Array.from(context.querySelectorAll(selector));
// }

// /*Use JS to Get All Navigation Links*/
// const navLinks = $$('nav a');
// console.log(navLinks);

// /*Use JS to Get Current URL*/
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );
//   console.log(currentLink);

// /*Add current class to current page link*/
// currentLink.classList.add('current');

let pages = [
    { url: '', title: 'Home' },                
    { url: 'projects/', title: 'Projects' },    
    { url: 'contact/', title: 'Contact' },      
    { url: 'resume/', title: 'Resume' },  
    { url: 'meta/', title: 'Meta' },
    { url: 'https://github.com/jaw039', title: 'Profile' }
];

// Add <nav> to the page
let nav = document.createElement('nav');
document.body.prepend(nav);

// Detect if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Add links to the navigation menu
for (let p of pages) {
    let url = p.url;
    let title = p.title;

    // If it's not the home page and not an external link, add '../'
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    // Create the <a> element
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    // Add the "current" class to the current page link
    a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);

    // Add target = "_blank" to external links
    if (a.host !== location.host) {
        a.target = '_blank';
    }

    nav.append(a);
}
// Add dark mode switch to top right corner
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-switcher">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

  
// Function to set color scheme and update UI
function setColorScheme(colorScheme) {
    // Update the CSS property / set the theme color
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    // Update the select element's value to match the current theme
    const themeSwitcher = document.querySelector('#theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.value = colorScheme;
    }
    // Save to localStorage
    localStorage.colorScheme = colorScheme;
}

// Get the theme switcher element
const themeSwitcher = document.querySelector('#theme-switcher');

// Add the event listener for when user changes the theme
themeSwitcher.addEventListener('input', function(event) {
    setColorScheme(event.target.value);
});

// On page load, check for and apply saved preference
if ("colorScheme" in localStorage) {
    // This will both set the color scheme AND update the select element
    setColorScheme(localStorage.colorScheme);
}



// JavaScript II
// Add new async function to fetch data from the JSON file
export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);

        // Add the error check as specified in the directions
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        // Parse the JSON response into data
        const data = await response.json();
        console.log("Fetched Data:", data);
        return data;


    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error("Invalid container element.");
        return;
    }
  
    const article = document.createElement("article");
    article.innerHTML = `
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${project.image}" alt="${project.title}">
        <div class = "project-details">
            <p>${project.description}</p>
            <p class="project-year">${project.year}</p>
        </div>

    `;
    containerElement.appendChild(article);
  }


  // Fetchg Data from Github
  export async function fetchGitHubData(username) {
    // Use the fetchJSON function to get data from the GitHub API
    return fetchJSON(`https://api.github.com/users/${username}`);
  }
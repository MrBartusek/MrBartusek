const Mustache = require('mustache');
const config = require('./config.json')
const fs = require('fs');
const fetch = require('node-fetch');
const technologyShields = require('technology-shields')
const MUSTACHE_MAIN_DIR = './main.mustache';
const readmeActivityFeed = require("readme-activity-feed")

async function getProjects(config)
{
   let result = [];
   for(const projectName of config.projects)
   {
      console.log(`Fetching ${projectName}`)
      const projectData = await callApi(`https://api.github.com/repos/${projectName}`)
      let project = {}
      project.stars = projectData.stargazers_count
      project.name = projectData.name
      project.url = projectData.html_url
      project.description = projectData.description
      result.push(project)
   }
   result = result.sort((a, b) => (a.stars < b.stars) ? 1 : -1)
   return result
}

function getTechnologies()
{
   return technologyShields.get([
      // JS
      "typescript",
      "javascript",
      "nodedotjs",
      "npm",

      // PYTHON
      "python",
      "pypi",
      "django",
      "readthedocs",

      // DATABASE
      "sqlite",
      "postgresql",

      // HOSTING
      "heroku",
      "pm2",

      // WEB
      "html5",
      "react",
      "bootstrap",

      // OTHER
      "githubactions",
      "eslint",
      "git",
      "visualstudiocode",
      "wakatime",
      "discord",
      "homeassistant",
      "vivaldi",
      "arduino",
      "raspberrypi"
   ], "MARKDOWN")
}

function calculateAge()
{
   // 🎂
   const today = new Date();
   const birthDate = new Date(2003, 1, 14);
   let age = today.getFullYear() - birthDate.getFullYear();
   const m = today.getMonth() - birthDate.getMonth();
   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
   }
   return age;
}

async function callApi(endpoint)
{
   let res = await fetch(endpoint, {headers:{'Authorization' : 'Basic ' + Buffer.from("MrBartusek" + ":" + process.env.GITHUB_PERSONAL_TOKEN).toString('base64')}})
   return await res.json();
}

async function main()
{
   console.log('Starting readme generation...')
   const fields = {
      projects: await getProjects(config),
      technologies: getTechnologies(),
      age: calculateAge(),
      activity: await readmeActivityFeed.generate('MrBartusek')
   }

   console.log('Generating template...')
   fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
      if (err) throw err;
      const output = Mustache.render(data.toString(), fields);
      fs.writeFileSync('README.md', output);
      console.log('Done!')
   });
}

main();

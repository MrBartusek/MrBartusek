const Mustache = require('mustache');
const fs = require('fs');
const fetch = require('node-fetch');
const technologyShields = require('technology-shields')
const commentJson = require('comment-json')
const readmeActivityFeed = require("readme-activity-feed")

const MUSTACHE_MAIN_DIR = './main.mustache';
const config = commentJson.parse(fs.readFileSync('config.jsonc').toString());

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

async function getTechnologies()
{
   const allPokemon = config.pokemonList;
   const pokemonName = allPokemon[new Date().getDate() % allPokemon.length];
   const pokemonShield = ` ![pokemon](https://img.shields.io/badge/-${pokemonName}-CB3837?style=flat-square&logo=pokemon&logoColor=fff)`
   
   const shields = technologyShields.get(config.technologies, "MARKDOWN")
   const pokemonIndex = shields.indexOf(' ', Math.floor(shields.length * 0.8))
   const result = [shields.slice(0, pokemonIndex), pokemonShield, shields.slice(pokemonIndex)].join('');
   return result;
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
      technologies: await getTechnologies(),
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

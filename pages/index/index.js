document.getElementById("btn_download").addEventListener("click", InitDownload);
// document.getElementById("btn_settings").addEventListener("click", OpenSettings);

async function InitDownload() {
  const links = document.getElementById("mod_links_textarea").value
    .split("\n")
    .filter(Boolean)
    .map(link => link.match(/mod\/(.*)/)[1])
    .map(id => `https://re146.dev/factorio/mods/modinfo?id=${id}`);
  let modDepsLinks = [];

  let linksModData = [];
  let modDepsData = [];

  let formattedDLUrls = [];

  let notFoundMods = [];
  
  for (const link of links) {
    linksModData.push(await window.electronAPI.getModData(link));
  }

  modDepsLinks.push(...await getDependencyLinks(linksModData));

  for (const link of modDepsLinks) {
    let data = await window.electronAPI.getModData(link);
    if (Object.hasOwn(data, "message")) {
      notFoundMods.push(link);
      console.log(`Could not find mod: ${link}`);
      continue;
    }
    modDepsData.push(data);
  }
  
  formattedDLUrls.push(...formatUrls([...linksModData, ...modDepsData]))

  formattedDLUrls.forEach(object => {
    window.electronAPI.downloadMod(object.url, object.file_name);
  });

  // links.forEach(async element => {
  //   console.log(element);
  //   linksModData.push(...await getDependencyLinks(
  //     links.map(window.electronAPI.getModData(element))))
  // });
}

async function getDependencyLinks(modData) {
  return (await Promise.all(
    modData.map(async (element) => {
      const modJson = await element;

      const release = modJson.releases.at(-1);
      const dependencies = release.info_json.dependencies
      
      return dependencies
        .map(dep => dep.split(" ")[0])
        .filter(id => !/\?|!|base/.test(id))
        .map(id => `https://re146.dev/factorio/mods/modinfo?id=${id}`)
    })
  )).flat()
}

function formatUrls(urlArray)
{
  let formattedObjs = [];
  urlArray.forEach(object => {
    console.log(object);
    let release = object.releases.at(-1);
    let version = release.version;
    let urlName = object.name;

    formattedObjs.push({ url: `https://mods-storage.re146.dev/${urlName}/${version}.zip`, file_name: release.file_name });
  });

  return formattedObjs;
}

// Settings Related
// function OpenSettings() {
//   window.electronAPI.browserWindow('./pages/settings/settings.html', 1920, 1080);
// }

let btn_mod = document.getElementById("btn_browse_mod");
let btn_save = document.getElementById("save_settings");
let filePathElement_mod = document.getElementById("mod_dir");
let changed = { mod_dir: false };

async function setPaths()
{
    let paths = await window.electronAPI.getSettings();
    filePathElement_mod.value = await paths.mod_dir;
}

btn_mod.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile();
    
    if (filePath == null) {
        return;
    }
    filePathElement_mod.value = filePath;
    changed.mod_dir = true;
})


btn_save.addEventListener("click", () => {
    if (changed.mod_dir) {
        window.electronAPI.saveSettings("mod_dir", filePathElement_mod.value);

        changed.mod_dir = false;
    }
});

setPaths();
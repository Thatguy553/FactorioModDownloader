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

  const progBar = document.getElementById("dl_prog");
  const errP = document.getElementById("errors");
  let errors = [];

  try {
    for (let index = 0; index < formattedDLUrls.length; index++) {
      const object = formattedDLUrls[index];

      let result = await window.electronAPI.downloadMod(object.url, object.file_name);
      if (typeof result == "object") {
        console.log(result)
        errors.push(result);
      }

      progBar.value = ((index / formattedDLUrls.length) * 100);
      
      if (errors.length > 0) {
        let err = errors.map(function(err) {
          return err['file_name'];
        });

        errP.innerText = `Mods Not Downloaded:\n ${err}`;
        return;
      };

      errP.innerText = "Mods Downloaded."
    }

    console.log("Downloads Finished");
    progBar.value = 100;
  } catch (error) {
    console.log(error);
  };
}

async function getDependencyLinks(modData) {
  return (await Promise.all(
    modData.map(async (element) => {
      const modJson = await element;

      const release = modJson.releases.at(-1);
      const dependencies = release.info_json.dependencies
      
      let links = [];

      dependencies.forEach(link => {
        if (link.includes("base")) { return; }
        if (link.substring(0, 1).includes("?")) { return; }
        let arr = link.split(" ");
        arr.slice(0, -2);

        if (arr.length > 1) {
          arr = arr.join("%20");
          links.push(`https://re146.dev/factorio/mods/modinfo?id=${arr}`);
          return;
        }
        
        links.push(`https://re146.dev/factorio/mods/modinfo?id=${arr[0]}`);
      });
      return links;
    })
  )).flat()
}

function formatUrls(urlArray)
{
  let formattedObjs = [];
  urlArray.forEach(object => {
    let release = object.releases.at(-1);
    let version = release.version;
    let urlName = object.name;

    formattedObjs.push({ url: `https://mods-storage.re146.dev/${urlName}/${version}.zip`, file_name: release.file_name });
  });

  return formattedObjs;
}

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
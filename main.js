const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const { mkdir } = require("fs/promises");
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const { existsSync } = require('node:fs');

const configName = './config.json';
const config = require(configName);

function updateConfig(event, key, value) 
{
  let newConfig = config;
  
  try {
    if (fs.existsSync(value)) {
      newConfig[key] = value;    
    }
  } catch (error) {
    console.log("[updateConfig] existsSync Error");
    console.log(error);
  }

  fs.writeFileSync(configName, JSON.stringify(newConfig, null, 2), (err) => {
    if (err) return console.log(err);
    console.log(JSON.stringify(newConfig, null, 2));
    console.log('writing to ' + configName);
  })

}

function getConfig() 
{
  let test = { mod_dir: config.mod_dir };
  return test;
}

async function handleFileOpen () 
{
  // C:\Users\Thatguy553\AppData\Roaming\Factorio\mods
  const { canceled, filePaths } = await dialog.showOpenDialog({ defaultPath: "C:\Users\Thatguy553\AppData\Roaming\Factorio\mods", properties: ['openFile', 'openDirectory', 'multiSelections']})
  if (canceled) {
    return null;
  }
  return filePaths[0];
}

function handleSetTitle (event, title) 
{
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents);
  console.log("handleSetTitle fired");
  win.setTitle(title);
}

function createWindow(event, file, height, width) 
{
  const window = new BrowserWindow({
    modal: true,
    webPreferences: {
      width: width,
      height: height,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  window.loadFile(file)
}

function createMainWindow() 
{
  const mainWindow = new BrowserWindow({
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('./pages/index/index.html')
}

async function getModData(event, modInfoUrl)
{
  console.log(modInfoUrl);
  const response = await fetch(modInfoUrl);
  let json = await response.json();

  // console.log(json.name);
  // console.log(json.owner);
  // console.log(json.releases[json.releases.length - 1]);
  // console.log(json.title);
  return json;
}

async function downloadMod(event, url, fileName)
{
  const destination = path.resolve(config.mod_dir, fileName);
  if (fs.existsSync(destination)) {
    return { err: "Mod File Already Exists", file_name: fileName };
  }

  const res = await fetch(url);
  if (!fs.existsSync(config.mod_dir)) await mkdir(config.mod_dir); //Optional if you already have downloads directory

  const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
  return await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

app.whenReady().then(() => {-
  ipcMain.on('set-title', handleSetTitle);
  ipcMain.on('create-window', createWindow);
  ipcMain.on('save-settings', updateConfig);
  ipcMain.handle('get-settings', getConfig);
  ipcMain.handle('open-file-dialog', handleFileOpen);
  ipcMain.handle('get-mod-data', getModData);
  ipcMain.handle('download-mod', downloadMod);
  createMainWindow()
})
// ...
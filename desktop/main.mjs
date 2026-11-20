import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CharacterService } from '../dist/characters/CharacterService.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win;
let game;
// Writable application data must live outside the packaged application directory.
const dataDir = app.getPath('userData');
const lastSessionPath = path.join(dataDir, 'last-session.json');
const savesDir = path.join(dataDir, 'saves');

async function persistLatest() { await game.saveLastSession(lastSessionPath); }
function state() {
  const snap = game.toSnapshot();
  return { ...snap, history: snap.history.slice().reverse() };
}
async function listSaves() {
  await fs.mkdir(savesDir, { recursive: true });
  const entries = await fs.readdir(savesDir, { withFileTypes: true });
  return entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map(e => e.name).sort((a,b) => a.localeCompare(b));
}
async function refresh() { return { state: state(), saves: await listSaves() }; }

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 850, minWidth: 950, minHeight: 680,
    backgroundColor: '#07111d', title: 'Space Expedition',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
  game = new CharacterService();
  try { await game.loadLastSession(lastSessionPath); }
  catch (err) { console.error('Unable to restore session:', err); }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(savesDir, { recursive: true });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('game:state', refresh);
ipcMain.handle('game:create', async (_e, payload) => {
  game.create(payload.type, payload.id.trim(), payload.name.trim());
  await persistLatest(); return refresh();
});
ipcMain.handle('game:assign', async (_e, payload) => {
  game.add(payload.characterId, payload.objectId);
  await persistLatest(); return refresh();
});
ipcMain.handle('game:act', async (_e, payload) => {
  const turn = game.act(payload.action, payload.actorId, payload.targetId, payload.abilityId || undefined);
  await persistLatest(); return { ...await refresh(), message: turn.description };
});
ipcMain.handle('game:save', async (_e, payload) => {
  let name = (payload?.name || 'campaign').trim().replace(/[\\/:*?"<>|]/g, '-');
  if (!name) name = 'campaign';
  if (!name.toLowerCase().endsWith('.json')) name += '.json';
  const file = path.join(savesDir, name);
  await game.saveGame(file); await persistLatest();
  return { ...await refresh(), message: `Saved to saves/${name}` };
});
ipcMain.handle('game:load', async (_e, payload) => {
  const file = path.join(savesDir, path.basename(payload.name));
  await game.loadGame(file); await persistLatest();
  return { ...await refresh(), message: `Loaded ${payload.name}` };
});
ipcMain.handle('game:load-last', async () => {
  await game.loadLastSession(lastSessionPath); return refresh();
});
ipcMain.handle('game:import', async () => {
  const result = await dialog.showOpenDialog(win, { title: 'Import characters', filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
  if (result.canceled || !result.filePaths[0]) return refresh();
  const count = await game.loadCharacters(result.filePaths[0]);
  await persistLatest(); return { ...await refresh(), message: `Imported ${count} character(s).` };
});
ipcMain.handle('game:clear-log', () => refresh());

ipcMain.handle('game:new-session', async () => {
  const result = await dialog.showMessageBox(win, { type: 'warning', title: 'Start a new mission?', message: 'The current auto-saved session will be replaced. Save it first if you want to keep it.', buttons: ['Cancel', 'Start new session'], defaultId: 0, cancelId: 0 });
  if (result.response !== 1) return { ...await refresh(), message: 'New session cancelled.' };
  game = new CharacterService(); await persistLatest(); return { ...await refresh(), message: 'New mission started. Previous autosave was replaced.' };
});

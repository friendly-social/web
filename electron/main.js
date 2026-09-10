const { app, BrowserWindow, dialog, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('serve-handler');

let mainWindow = null;
let staticServer = null;

function resolveExportDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web-out');
  }

  return path.resolve(__dirname, '../out');
}

function verifyBuildExists(exportDir) {
  const indexPath = path.join(exportDir, 'index.html');
  return fs.existsSync(indexPath);
}

function startStaticServer(exportDir) {
  return new Promise((resolve, reject) => {
    staticServer = http.createServer((request, response) => {
      return handler(request, response, {
        public: exportDir,
        cleanUrls: true,

        rewrites: [
          { source: '**', destination: '/index.html' }
        ]
      });
    });

    staticServer.on('error', reject);

    staticServer.listen(0, '127.0.0.1', () => {
      const address = staticServer.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine static server address'));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function createMainWindow() {
  const exportDir = resolveExportDir();

  if (!verifyBuildExists(exportDir)) {
    dialog.showErrorBox(
      'Build Not Found',
      [
        `Expected static build at:\n${exportDir}`,
        '',
        "Build the Next.js app first (from project root): 'bun run build' or 'npm run build'.",
      ].join('\n')
    );
    app.quit();
    return;
  }

  const appUrl = await startStaticServer(exportDir);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

app.whenReady().then(createMainWindow).catch((error) => {
  dialog.showErrorBox('Startup Error', String(error));
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().catch((error) => {
      dialog.showErrorBox('Window Error', String(error));
      app.quit();
    });
  }
});

app.on('before-quit', () => {
  if (staticServer) {
    staticServer.close();
    staticServer = null;
  }
});

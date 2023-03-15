const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const ResizeImg = require('resize-img');

process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

// make sure mainWindow has global scope, even though it is defined in the createMainWindow
// but we have to delete it after window is close so that we do not have memory leaks
// we will take care of that in the when ready
let mainWindow;

// Create the main window
function createMainWindow() {
    //const mainWindow = new BrowserWindow({  as a const here, it would not have global scope which we need it to have in render.js
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // open dev tools if in dev environment
    if(isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// Create about window
function createAboutWindow() {
    const aboutWindow = new BrowserWindow({
        title: 'About Image Sizer',
        with: 300,
        height: 300
    });

    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

// app is ready
app.whenReady().then(() => {
    createMainWindow();

    // Implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // Remove mainWindow from memory on close
    mainWindow.on('close', () => (mainWindow = null));

    app.on('activate', () => {
        if(BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Menu template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : []),
    {
        role: "fileMenu",
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            }
        ]
    }] : []) 
];

// Respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer');
    resizeImage(options);
});

// Resize the image
async function resizeImage({ imgPath, width, height, dest}) {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });
        
        // Create file name
        const filename = path.basename(imgPath);

        // Create destination folder if it does not exist
        if(!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        // Write file to destination folder
        fs.writeFileSync(path.join(dest, filename), newPath);

        // Send success message to render
        mainWindow.webContents.send('image:done');

        // Open destination folder
        shell.openPath(dest);
    } catch(error) {
        console.log(error);
    }
}

app.on('window-all-closed', () => {
    if(!isMac) {
        app.quit();
    }
});
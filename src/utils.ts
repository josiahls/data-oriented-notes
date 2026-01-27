import { App, TFolder, Notice } from "obsidian";


function pathExists(app: App, path: string) {
    var _path = path
    if (path.endsWith('/')) {
        _path = path.substring(0, path.length - 1);
    }
    return app.vault.getAbstractFileByPath(_path) !== null;
}


function getPath(app: App, path: string) {
    return app.vault.getAbstractFileByPath(path);
}


function getFolderPath(app: App, path: string): TFolder | null{
    return app.vault.getFolderByPath(path);
}

async function getOrCreateFolder(app: App, folderPath: string): Promise<TFolder> {
    var _folderPath = folderPath;
    console.log('getOrCreateFolder: folderPath: ' + folderPath);
    if (_folderPath.endsWith('/')) {
        _folderPath = _folderPath.substring(0, _folderPath.length - 1);
    }

    var folder = app.vault.getFolderByPath(_folderPath);
    if (folder == null) {
        new Notice("Creating folder: " + _folderPath);
        await app.vault.createFolder(_folderPath);
    }
    folder = app.vault.getFolderByPath(_folderPath);
    if (folder == null) {
        throw new Error("getOrCreateFolder: Folder not found: " + _folderPath);
    }
    return folder as TFolder;
}


export { getPath, pathExists, getFolderPath, getOrCreateFolder };
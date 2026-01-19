import { App } from "obsidian";


function pathExists(app: App, path: string) {
    return app.vault.getAbstractFileByPath(path) !== null;
}


function getPath(app: App, path: string) {
    return app.vault.getAbstractFileByPath(path);
}


export { getPath, pathExists };
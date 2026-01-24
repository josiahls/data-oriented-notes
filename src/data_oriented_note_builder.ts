import { App, Notice, TFolder } from "obsidian";
import { DataOrientedNote, copier } from "./data_oriented_note";
import { getPath } from "./utils";
import { FindOrCreateModal } from "./data_oriented_note_modal";


const basicCopier: copier = {
    async copyTo(app: App, sourcePath: string, targetPath: string): Promise<void> {
        const source = getPath(app, sourcePath);
        const target = getPath(app, targetPath);
        if (source == null) {
            throw new Error('Source path is not a file');
        }
        if (target != null) {
            throw new Error('Target path already exists: ' + targetPath);
        }
        await app.vault.copy(source, targetPath);
        new Notice('Copied ' + sourcePath + ' to ' + targetPath);
    }
}


async function createDataOrientedNote(
    app: App,
    templatePath: string,
) {
    var copier: copier = basicCopier;
    // @ts-expect-error Property 'plugins' does not exist on type 'App'
    const plugins = app.plugins.plugins;
    const exists = plugins["templater-obsidian"];
    if (!exists) {
      new Notice("Templater is not installed. Please install it.");
      return;
    } else {
      console.log("Templater is installed.");
    }


    let note_path = "Templates/Callouts/callout-note-definition.md";
    let note = new DataOrientedNote(app, note_path);
    await note.load(app);

    console.log(note);

    // const noteName = 'test-note';

    const dataOrientedNotePath = await FindOrCreateModal.openAndGetValue(
        app, 
        note.outPath as TFolder,
        note.attrName
    );
    console.log('Data Oriented Note Path: ',
        dataOrientedNotePath.dataOrientedNotePathPretty,
        dataOrientedNotePath.newDataOrientedNoteName,
        dataOrientedNotePath.dataOrientedNotePath);

    var noteName = dataOrientedNotePath.newDataOrientedNoteName;
    if (noteName === undefined) {
        if (dataOrientedNotePath.dataOrientedNotePath === undefined) {
            throw new Error('Data Oriented Note Path is not a file');
        }
        noteName = dataOrientedNotePath.dataOrientedNotePath.basename;
    }
    if (noteName.trim() === '') {
        throw new Error('Note name is empty');
    }

    const newNote = await note.create(app, noteName, copier);

    console.log('New Note: : ' + newNote);

    await note.postProcessCleanUp(app);

    if (note.openAfterCreation) {
        await app.workspace.openLinkText(newNote,"",true);
    }
}


export { createDataOrientedNote };
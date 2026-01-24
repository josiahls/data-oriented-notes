import { App, Notice, TFile, TFolder } from "obsidian";
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
    insert: boolean = false
) {
    var copier: copier = basicCopier;
    var file = null;
    if (insert) {
        file = await app.workspace.getActiveFile();
        if (!file) {
            throw new Error("No active file to insert into");
        }
    }

    let note = new DataOrientedNote(app, templatePath);
    await note.load(app);

    console.log(note);

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

    if (insert && file != null) {
        await app.vault.append(
            file,
            `![[${newNote}|${noteName}]]`
        );
        new Notice('Inserted ' + newNote + ' into ' + file.path);
    }

    if (note.openAfterCreation) {
        await app.workspace.openLinkText(newNote,"",true);
    }
}


export { createDataOrientedNote };
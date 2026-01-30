import { App, Notice, TFile, TFolder } from "obsidian";
import { DataOrientedNote, copier } from "./data_oriented_note";
import { getPath } from "./utils";
import { FindOrCreateModal } from "./data_oriented_note_modal";
import { Path } from "./path";


const basicCopier: copier = {
    async copyTo(app: App, sourcePath: Path, targetPath: Path): Promise<void> {
        if (!sourcePath.exists()) {
            throw new Error('Source path does not exist: ' + sourcePath.getString());
        }
        if (targetPath.exists()) {
            throw new Error('Target path already exists: ' + targetPath.getString());
        }
        await app.vault.copy(sourcePath.getTFile(), targetPath.getString());
        new Notice('Copied ' + sourcePath.getString() + ' to ' + targetPath.getString());
    }
}


async function createDataOrientedNote(
    app: App,
    templatePath: Path,
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

    if (!templatePath.exists()) {
        throw new Error('Template path does not exist: ' + templatePath.getString());
    }

    let note = new DataOrientedNote(app, templatePath);
    await note.load(app);

    if (!note.outPath) {
        throw new Error('Output path is not set. Please load the note first.');
    }

    var isInDataOrientedNote = await note.isInDataOrientedNote(
        app, 
        await app.workspace.getActiveFile()
    );

    var isDefaultDataOrientedNote = await note.isDefaultDataOrientedNote(app);

    console.log(note);
    var dataOrientedNotePath: Path;

    if (!isInDataOrientedNote && !isDefaultDataOrientedNote) {
        const dataOrientedNoteItem = await FindOrCreateModal.openAndGetValue(
            app, 
            note.outPath,
            note.attrName
        );
        dataOrientedNotePath = dataOrientedNoteItem.path;
        console.log('Data Oriented Note Path: ',
            dataOrientedNotePath.getString(),
        );
    } else {
        const activeFile = await app.workspace.getActiveFile();
        if (activeFile == null) {
            throw new Error('No active file to get root note path from');
        }
        dataOrientedNotePath = await note.getRootNotePath(
            app, activeFile
        );
    }

    const newNote = await note.create(
        app, 
        dataOrientedNotePath,
        copier
    );

    console.log('New Note: : ' + newNote.getString());

    await note.postProcessCleanUp(app);

    if (insert && file != null) {
        await app.vault.append(
            file,
            `![[${newNote.getString()}|${newNote.name()}]]`
        );
        new Notice('Inserted ' + newNote.getString() + ' into ' + file.path);
    }

    if (note.openAfterCreation) {
        await app.workspace.openLinkText(newNote.getString(),"",true);
    }
}


export { createDataOrientedNote };
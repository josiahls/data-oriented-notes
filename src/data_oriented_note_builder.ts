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
    var currentFile: Path | TFile | null = await app.workspace.getActiveFile();
    if (currentFile !== null) {
        currentFile = new Path(currentFile, app);
    }

    if (!templatePath.exists()) {
        throw new Error('Template path does not exist: ' + templatePath.getString());
    }

    let note = new DataOrientedNote(app, templatePath);
    await note.load(app);

    if (!note.outPath) {
        throw new Error('Output path is not set. Please load the note first.');
    }

    console.log(note);
    var dataOrientedNotePath: Path;

    if (note.rootNotePath !== undefined) {
        currentFile = note.rootNotePath;
    }

    const dataOrientedNoteItem = await FindOrCreateModal.openAndGetValue(
        app, 
        note.outPath,
        note.attrName,
        currentFile
    );
    dataOrientedNotePath = dataOrientedNoteItem.path;
    console.log('Data Oriented Note Path: ',
        dataOrientedNotePath.getString(),
    );


    const newNote = await note.create(
        app, 
        dataOrientedNotePath,
        copier
    );

    console.log('New Note: : ' + newNote.getString());

    await note.postProcessCleanUp(app);

    var currentFile: Path | TFile | null = await app.workspace.getActiveFile();
    if (currentFile !== null) {
        currentFile = new Path(currentFile, app);
    }
    if (insert && currentFile !== null) {
        await app.vault.append(
            currentFile.getTFile(),
            `![[${newNote.getString()}|${newNote.name()}]]`
        );
        new Notice('Inserted ' + newNote.getString() + ' into ' + currentFile.getString());
    }

    if (note.openAfterCreation) {
        await app.workspace.openLinkText(newNote.getString(),"",true);
    }
}


export { createDataOrientedNote };
import { App, StringValue, TFile, Notice, TFolder, moment, normalizePath } from "obsidian";
import { getPath, getOrCreateFolder, pathExists } from "./utils";


export interface copier {
    copyTo(app: App, sourcePath: string, targetPath: string): Promise<void>;
}


class DataOrientedNote {
    // Static properties for the data oriented note properties
    static attrName = 'don/attrName';
    static outPath = 'don/outPath';
    static rootNoteTemplate = 'don/rootNoteTemplate';
    static openAfterCreation = 'don/openAfterCreation';
    static rootNoteLink = 'don/rootNoteLink';
    static useSelf = 'don/useSelf';


    public templatePath: TFile;
    public attrName: string;
    public outPath?: TFolder;
    public rootNoteTemplate: string;
    public openAfterCreation: boolean;
    public useSelf: boolean;
    public rootNotePath: string;
    public noteAttrValuePath: string;

    constructor(app: App, templatePath: TFile|string) {
        if (typeof templatePath === 'string') {
            let path = getPath(app, templatePath);
            if (path instanceof TFile) {
                this.templatePath = path;
            } else {
                throw new Error('Template path is not a file');
            }
        } else if (templatePath instanceof TFile) {
            this.templatePath = templatePath;
        } else {
            throw new Error('Template path is not a file or string');
        }
        this.attrName = '';
        this.rootNoteTemplate = '';
        this.outPath = undefined;
        this.noteAttrValuePath = '';
        this.rootNotePath = '';
        this.useSelf = false;
    }

    getUniqueNoteName(app: App, noteName: string): string {
        const dateTime = moment().format("-YYYY-MM-DD-HH-mm-ss") 
        return noteName + dateTime;
    }

    checkPropertyValid(frontMatter: Record<string, string>, property: string) {
        if (property in frontMatter) {
            const value = frontMatter[property];
            if (value === null || value === undefined) {
                const msg = `Property "${property}" is empty `
                    + `in template ${this.templatePath}. `
                    + 'Please add/fillout this property in the template.';
                new Notice(msg);
                throw new Error(msg);
            }
        } else {
            const msg = `Property "${property}" not found `
                + `in template ${this.templatePath}. `
                + 'Please add/fillout this property in the template.';
            new Notice(msg);
            throw new Error(msg);
        }
    }

    getStringProperties(
        frontMatter: Record<string, string>, 
        property: string, 
        acceptBlank: boolean = false
    ): string {
        this.checkPropertyValid(frontMatter, property);
        const value = frontMatter[property];
        if (typeof value !== 'string') {
            throw new Error(`Property "${property}" is not a string `
                + `in template ${this.templatePath}.`);
        }
        if (!acceptBlank && value.trim() === '') {
            const msg = `Property "${property}" is empty `
                + `in template ${this.templatePath}. `
                + 'Please add/fillout this property in the template.';
            new Notice(msg);
            throw new Error(msg);
        }
        return value;
    }

    getBooleanProperties(
        frontMatter: Record<string, string>, 
        property: string
    ): boolean {
        this.checkPropertyValid(frontMatter, property);
        const value = frontMatter[property];
        if (typeof value !== 'boolean') {
            throw new Error(`Property "${property}" is not a boolean `
                + `in template ${this.templatePath}.`);
        }
        return value;
    }

    async load(app: App) {
        let outPath: string = '';
        await app.fileManager.processFrontMatter(
            this.templatePath,
            (frontMatter) => {
                this.attrName = this.getStringProperties(frontMatter, DataOrientedNote.attrName);
                outPath = this.getStringProperties(
                    frontMatter, 
                    DataOrientedNote.outPath,
                    true
                );
                this.rootNoteTemplate = this.getStringProperties(
                    frontMatter, 
                    DataOrientedNote.rootNoteTemplate,
                    true
                );
                this.openAfterCreation = this.getBooleanProperties(
                    frontMatter,
                    DataOrientedNote.openAfterCreation
                );
                this.useSelf = this.getBooleanProperties(
                    frontMatter,
                    DataOrientedNote.useSelf
                );
            }
        );
        if (outPath.trim() == '.') {
            this.outPath = app.vault.getRoot();
        } else {
            this.outPath = await getOrCreateFolder(app, outPath);
        }
        if (this.rootNoteTemplate.trim() !== '') {
            const rootNoteTemplatePath = getPath(app, this.rootNoteTemplate);
            if (rootNoteTemplatePath == null) {
                throw new Error('Root note template path is not a file');
            }
        }
    }

    async isInDataOrientedNote(app: App, noteFile: TFile | null): Promise<boolean> {
        if (noteFile == null) {
            return false;
        }
        var isInDataOrientedNote = false;
        
        await app.fileManager.processFrontMatter(
            noteFile,
            (frontMatter) => {
                if (
                    DataOrientedNote.rootNoteLink in frontMatter
                    && DataOrientedNote.useSelf in frontMatter
                    && frontMatter[DataOrientedNote.useSelf] === true
                ) {
                    isInDataOrientedNote = true;
                }
            }
        );
        return isInDataOrientedNote;
    }

    async isDefaultDataOrientedNote(app: App): Promise<boolean> {
        var isDefaultDataOrientedNote = false;
        await app.fileManager.processFrontMatter(
            this.templatePath,
            (frontMatter) => {
                if (
                    DataOrientedNote.rootNoteLink in frontMatter
                    && DataOrientedNote.useSelf in frontMatter
                    && frontMatter[DataOrientedNote.useSelf] === true
                ) {
                    console.log('isDefaultDataOrientedNote: ' + this.templatePath.path);
                    isDefaultDataOrientedNote = true;
                }
            }
        );
        return isDefaultDataOrientedNote;
    }


    async getRootNotePath(app: App, noteFile: TFile): Promise<TFile> {
        var rootNoteLink = '';
        await app.fileManager.processFrontMatter(
            noteFile,
            (frontMatter) => {
                if (DataOrientedNote.rootNoteLink in frontMatter) {
                    rootNoteLink = frontMatter[DataOrientedNote.rootNoteLink];
                }
            }
        );
        if (rootNoteLink.trim() === '') {
            await app.fileManager.processFrontMatter(
                this.templatePath,
                (frontMatter) => {
                    if (DataOrientedNote.rootNoteLink in frontMatter) {
                        rootNoteLink = frontMatter[DataOrientedNote.rootNoteLink];
                    }
                }
            );
        }
            
        if (rootNoteLink.trim() === '') {
            throw new Error('Root note link is empty: ' + noteFile.path);
        }
        if (rootNoteLink.startsWith('[[') && rootNoteLink.endsWith(']]')) {
            rootNoteLink = rootNoteLink.substring(2, rootNoteLink.length - 2);
        }
        if (rootNoteLink.includes('|')) {
            var _rootNoteLink = rootNoteLink.split('|')[0];
            if (_rootNoteLink === undefined) {
                throw new Error('Root note link is empty: ' + noteFile.path);
            }
            rootNoteLink = _rootNoteLink;
        }
        var rootNotePath = getPath(app, rootNoteLink);
        if (rootNotePath == null) {
            throw new Error('Root note path is not a file: ' + rootNoteLink);
        }
        if (rootNotePath instanceof TFile) {
            return rootNotePath;
        }
        throw new Error('Root note path is not a file');
    }

    async create(app: App, noteName: string, targetPath: TFile | null, copier: copier) {
        console.log('creating note: ' + noteName);
        if (!this.outPath) {
            throw new Error('Output path is not set. Please load the note first.');
        }
        var notePath: TFolder;
        if (targetPath !== null && targetPath.parent !== null) {
            console.log('targetPath: ' + targetPath.path);
            notePath = targetPath.parent;
        } else {
            notePath = await getOrCreateFolder(
                app, 
                this.outPath.path + '/' + noteName
            );
        }

        const noteAttrPath = await getOrCreateFolder(
            app, 
            notePath.path + '/' + this.attrName
        );
        this.noteAttrValuePath = noteAttrPath.path 
            + '/' 
            + this.getUniqueNoteName(app, noteName) 
            + '.md';
        await copier.copyTo(app, this.templatePath.path, this.noteAttrValuePath);

        if (this.rootNoteTemplate.trim() !== '') {
            const rootNoteTemplatePath = getPath(app, this.rootNoteTemplate);
            if (rootNoteTemplatePath == null) {
                throw new Error('Root note template path is not a file');
            }
            var rootNodePath = notePath.path + '/' + noteName + '.md';
            if (!pathExists(app, rootNodePath)) {
                await copier.copyTo(
                    app, 
                    rootNoteTemplatePath.path, 
                    rootNodePath
                );
            }
            this.rootNotePath = rootNodePath;
        }

        return this.noteAttrValuePath;
    }

    async postProcessCleanUp(app: App) {
        if (this.noteAttrValuePath.trim() === '') {
            throw new Error('Note attribute value path is not set. Please create the note first.');
        }

        const noteAttrValuePath = getPath(app, this.noteAttrValuePath);
        if (noteAttrValuePath == null) {
            throw new Error('Note attribute value path is not a file');
        }

        if (noteAttrValuePath instanceof TFile) {
            console.log('postProcessCleanUp: noteAttrValuePath: ' + noteAttrValuePath);
            await app.fileManager.processFrontMatter(
                noteAttrValuePath,
                (frontMatter) => {
                    delete frontMatter[DataOrientedNote.attrName];
                    delete frontMatter[DataOrientedNote.outPath];
                    delete frontMatter[DataOrientedNote.rootNoteTemplate];
                    delete frontMatter[DataOrientedNote.openAfterCreation];
                    var p = getPath(app, this.rootNotePath);
                    var rootNoteName = '';
                    if (p == null) {
                        throw new Error('Root note name is not a file');
                    }
                    if (p instanceof TFile) {
                        rootNoteName = p.basename;
                    }
                    var rootNoteLink = `[[${this.rootNotePath}]]`;
                    if (rootNoteName.trim() !== '') {
                        var rootNoteLink = `[[${this.rootNotePath}|${rootNoteName}]]`;
                    }
                    frontMatter[DataOrientedNote.rootNoteLink] = rootNoteLink;
                }
            );
        }

    }
}

export { DataOrientedNote };
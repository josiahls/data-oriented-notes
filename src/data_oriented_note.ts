import { App, TFile, Notice, moment } from "obsidian";
import { Path } from "./path";


export interface copier {
    copyTo(app: App, sourcePath: Path, targetPath: Path): Promise<void>;
}


class DataOrientedNote {
    // Static properties for the data oriented note properties
    static attrName = 'don/attrName';
    static outPath = 'don/outPath';
    static rootNoteTemplate = 'don/rootNoteTemplate';
    static openAfterCreation = 'don/openAfterCreation';
    static rootNoteLink = 'don/rootNoteLink';
    static useSelf = 'don/useSelf';
    // Property values for a data oriented note
    public attrName: string;
    public outPath?: Path;
    public rootNoteTemplatePath?: Path;
    public openAfterCreation: boolean;
    public useSelf: boolean;
    public rootNotePath?: Path;
    public templatePath: Path;
    public noteAttrValuePath?: Path;

    constructor(app: App, templatePath: Path) {
        if (!templatePath.exists()) {
            throw new Error('Template path does not exist: ' + templatePath.getString());
        }
        this.templatePath = templatePath;
        this.attrName = '';
        this.rootNoteTemplatePath = undefined;
        this.outPath = undefined;
        this.noteAttrValuePath = undefined;
        this.rootNotePath = undefined;
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
                    + `in template ${this.templatePath.toString()}. `
                    + 'Please add/fillout this property in the template.';
                new Notice(msg);
                throw new Error(msg);
            }
        } else {
            const msg = `Property "${property}" not found `
                + `in template ${this.templatePath.toString()}. `
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
                + `in template ${this.templatePath.toString()}.`);
        }
        if (!acceptBlank && value.trim() === '') {
            const msg = `Property "${property}" is empty `
                + `in template ${this.templatePath.toString()}. `
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
                + `in template ${this.templatePath.toString()}.`);
        }
        return value;
    }

    async load(app: App) {
        var outPath: string = '';
        var rootNoteTemplatePath: string = '';
        await app.fileManager.processFrontMatter(
            this.templatePath.getTFile(),
            (frontMatter) => {
                this.attrName = this.getStringProperties(frontMatter, DataOrientedNote.attrName);
                outPath = this.getStringProperties(
                    frontMatter, 
                    DataOrientedNote.outPath,
                    true
                );
                rootNoteTemplatePath = this.getStringProperties(
                    frontMatter, 
                    DataOrientedNote.rootNoteTemplate
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
        this.outPath = new Path(outPath, app);
        this.rootNoteTemplatePath = new Path(rootNoteTemplatePath, app);
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
            this.templatePath.getTFile(),
            (frontMatter) => {
                if (
                    DataOrientedNote.rootNoteLink in frontMatter
                    && DataOrientedNote.useSelf in frontMatter
                    && frontMatter[DataOrientedNote.useSelf] === true
                ) {
                    console.log('isDefaultDataOrientedNote: ' + this.templatePath.getString());
                    isDefaultDataOrientedNote = true;
                }
            }
        );
        return isDefaultDataOrientedNote;
    }


    async getRootNotePath(app: App, noteFile: TFile): Promise<Path> {
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
                this.templatePath.getTFile(),
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
        var rootNotePath = new Path(rootNoteLink, app);
        if (!rootNotePath.exists()) {
            throw new Error('Root note path does not exist: ' + rootNotePath.getString());
        }
        return rootNotePath;
    }

    async create(app: App, path: Path, copier: copier) {
        console.log('creating note: ' + path.name());
        if (!this.outPath) {
            throw new Error('Output path is not set. Please load the note first.');
        }
        if (!path.isFileLike()) {
            throw new Error('Path is not a file or folder: ' + path.getString());
        }
        path = path.getParent();
        if (!path.exists()) {
            console.log('creating folder: ' + path.getString());
            await path.createFolder();
        }

        var noteName = path.name();
        var attrPath = path.join(this.attrName)
        await attrPath.createFolder();

        var noteAttrValuePath = attrPath.join(
            this.getUniqueNoteName(app, noteName) + '.md'
        );

        console.log('noteAttrValuePath: ' + noteAttrValuePath.getString());

        await copier.copyTo(
            app, 
            this.templatePath, 
            noteAttrValuePath
        );
        this.noteAttrValuePath = new Path(noteAttrValuePath, app);

        if (this.rootNoteTemplatePath) {
            if (!this.rootNoteTemplatePath.exists()) {
                throw new Error('Root note template path is not a file');
            }
            this.rootNotePath = path.join(noteName + '.md');
            console.log('rootNotePath: ' + this.rootNotePath.getString());
            if (!this.rootNotePath.exists()) {
                await copier.copyTo(
                    app, 
                    this.rootNoteTemplatePath, 
                    this.rootNotePath
                );
            }
        }

        return this.noteAttrValuePath;
    }

    async postProcessCleanUp(app: App) {
        if (!this.noteAttrValuePath?.isSet()) {
            throw new Error('Note attribute value path is not set. Please create the note first.');
        }

        console.log('postProcessCleanUp: noteAttrValuePath: ' + this.noteAttrValuePath.getString());
        await app.fileManager.processFrontMatter(
            this.noteAttrValuePath.getTFile(),
            (frontMatter) => {
                delete frontMatter[DataOrientedNote.attrName];
                delete frontMatter[DataOrientedNote.outPath];
                delete frontMatter[DataOrientedNote.rootNoteTemplate];
                delete frontMatter[DataOrientedNote.openAfterCreation];
                var rootNoteName = this.rootNotePath?.name() ?? '';
                var rootNoteLink = `[[${this.rootNotePath?.getString()}]]`;
                if (rootNoteName.trim() !== '') {
                    rootNoteLink = `[[${this.rootNotePath?.getString()}|${rootNoteName}]]`;
                }
                frontMatter[DataOrientedNote.rootNoteLink] = rootNoteLink;
            }
        );
    }
}

export { DataOrientedNote };
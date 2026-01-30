import { App, Notice, TFile, TFolder, Vault, FuzzySuggestModal } from "obsidian";
import { DataOrientedNote } from "./data_oriented_note";
import { Path } from "./path";


export interface TemplateIteratorItem {
    path: Path;
}

class TemplateSuggestModal extends FuzzySuggestModal<TemplateIteratorItem> {
    private resolve: (value: TemplateIteratorItem) => void;
    public templateItem?: TemplateIteratorItem;
    public templates: TemplateIteratorItem[];
    public cancelled: boolean;

    constructor(
        app: App,
        resolve: (value: TemplateIteratorItem) => void,
        templates: TemplateIteratorItem[]
    ) {
        super(app);
        this.resolve = resolve;
        this.cancelled = false;
        this.templates = templates;
        this.templateItem = undefined;
    }

    getItems(): TemplateIteratorItem[] {
        return this.templates;
    }

    getItemText(item: TemplateIteratorItem): string {
        return item.path.name();
    }

    onChooseItem(item: TemplateIteratorItem, evt: MouseEvent | KeyboardEvent) {
        console.log('onChooseItem: item: ', item);

        this.templateItem = item;
        this.resolve(item);
    }

    static async openAndGetValue(
        app: App,
        templates: TemplateIteratorItem[]
    ): Promise<TemplateIteratorItem> {
        return new Promise((resolve) => {
            new TemplateSuggestModal(
                app,
                resolve,
                templates
            ).open();
        });
    }
}


async function isDataOrientedNoteTemplate(app: App, templatePath: TFile): Promise<boolean> {
    var isDataOrientedNoteTemplate = false;
    await app.fileManager.processFrontMatter(
        templatePath,
        (frontMatter) => {
            if (DataOrientedNote.attrName in frontMatter) {
                isDataOrientedNoteTemplate = true;
            }
        }
    );
    return isDataOrientedNoteTemplate;
}

async function iterateTemplates(app: App, templatesPath: Path): Promise<TemplateIteratorItem[]> {
    if (!templatesPath.isFolder()) {
        throw new Error('Template directory is not a folder: ' + templatesPath.getString());
    }
    const items: TemplateIteratorItem[] = [];
    Vault.recurseChildren(templatesPath.getTFolder(), (child) => {
        if (child instanceof TFile) {
            items.push({
                path: new Path(child, app),
            });
        }
    });
    // Filter with async checks - need to await all checks first
    const checks = await Promise.all(
        items.map(async item => {
            const file = item.path.getTFile();
            if (file instanceof TFile) {
                const isValid = await isDataOrientedNoteTemplate(app, file);
                return {
                    item,
                    isValid
                };
            }
            return { item, isValid: false };
        })
    );
    const filtered = checks
        .filter(check => check.isValid)
        .map(check => check.item);
    console.log(`Filtered ${items.length} items down to ${filtered.length} valid templates`);
    return filtered;
}   

async function iterateDataOrientedNoteTemplates(app: App, templateSourcePath: Path) { 
    const templates = await iterateTemplates(app, templateSourcePath);
    if (templates == null) {
        throw new Error('Templates is null');
    }
    for (const template of templates) {
        console.log('Template: ' + template.path.getString());
        new Notice('Template: ' + template.path.getString());
    }
}


export { iterateTemplates, iterateDataOrientedNoteTemplates, TemplateSuggestModal }
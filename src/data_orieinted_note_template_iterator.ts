import { App, Notice, TFile, TFolder, Vault } from "obsidian";
import { getPath, getFolderPath } from "./utils";
import { DataOrientedNote } from "./data_oriented_note";


export interface TemplateIteratorItem {
    templatePath: string;
    templateName: string;
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



async function iterateTemplates(app: App, templatesPath: string): Promise<TemplateIteratorItem[]> {
    if (templatesPath.endsWith('/')) {
        templatesPath = templatesPath.slice(0, -1);
    }

    const templatesDir = getFolderPath(app, templatesPath);
    if (templatesDir === null) {
        throw new Error('Template directory is not a folder: ' + templatesPath);
    }
    const items: TemplateIteratorItem[] = [];
    Vault.recurseChildren(templatesDir, (child) => {
        if (child instanceof TFile) {
            items.push({
                templatePath: child.path,
                templateName: child.name,
            });
        }
    });
    // Filter with async checks - need to await all checks first
    const checks = await Promise.all(
        items.map(async item => {
            const file = getPath(app, item.templatePath);
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

async function iterateDataOrientedNoteTemplates(app: App, templateSourcePath: string) { 
    const templates = await iterateTemplates(app, templateSourcePath);
    if (templates == null) {
        throw new Error('Templates is null');
    }
    for (const template of templates) {
        console.log('Template: ' + template.templatePath);
        new Notice('Template: ' + template.templatePath);
    }
}

export { iterateTemplates, iterateDataOrientedNoteTemplates }
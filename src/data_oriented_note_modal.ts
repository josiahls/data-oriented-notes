import { App, TFolder, FuzzySuggestModal, Vault, FuzzyMatch, Notice } from "obsidian";
import { TFile } from "obsidian";
import { Path } from "./path";

interface DataOrientedNoteSuggesterItem {
    path: Path;
}

class FindOrCreateModal extends FuzzySuggestModal<DataOrientedNoteSuggesterItem> {
    private resolve: (value: DataOrientedNoteSuggesterItem) => void;
    public dataOrientedNote?: DataOrientedNoteSuggesterItem;
    public searchDirectory: Path;
    public ignoreAttr: string;
    public activeFile: Path | null;
    public cancelled: boolean;

    constructor(
        app: App,
        resolve: (value: DataOrientedNoteSuggesterItem) => void,
        searchDirectory: Path,
        ignoreAttr:string,
        activeFile: Path | null
    ) {
        super(app);
        this.resolve = resolve;
        this.cancelled = false;
        this.searchDirectory = searchDirectory;
        this.ignoreAttr = ignoreAttr;
        this.activeFile = activeFile;
        this.dataOrientedNote = undefined;
        if (activeFile !== null) {
            if (activeFile.getParent().name() === this.ignoreAttr) {
                this.activeFile = activeFile.getParent().getParent();
            }
            var rootFile = activeFile.join(activeFile.name() + '.md');
            if (rootFile.exists()) {
                this.activeFile = rootFile;
            }
        }
    }

    getItems(): DataOrientedNoteSuggesterItem[] {
        const items: DataOrientedNoteSuggesterItem[] = [];
        Vault.recurseChildren(this.searchDirectory.getTFolder(), (file) => {
            if (file.path.includes(this.ignoreAttr)) {
                return;
            }
            var path = new Path(file.path, this.app);
            if (path.name().startsWith('.')) {
                return;
            }
            if (path.name().startsWith('_')) {
                return;
            }
            if (path.getString() == '') {
                return;
            }

            items.push({
                path: path,
            });
        });
        return items;
    }

    getSuggestions(query: string): FuzzyMatch<DataOrientedNoteSuggesterItem>[] {
        var suggestions =  super.getSuggestions(query)

        var path = this.searchDirectory.join(query);
        var constantSuggestions: FuzzyMatch<DataOrientedNoteSuggesterItem>[] = [];
        if (this.activeFile !== null) {
            constantSuggestions.push({
                item: {path: this.activeFile},
                match: {score: 100, matches: []},
            });
        }
        constantSuggestions.push({
                item: {path},
                match: {score: 100, matches: []},
            }
        );
        return constantSuggestions.concat(...suggestions);
    }

    getItemText(item: DataOrientedNoteSuggesterItem): string {
        if (this.activeFile !== null && item.path.getString() === this.activeFile.getString()) {
            return `self: "${item.path.getString()}"`;
        }
        if (!item.path.exists()) {
            return `create new: "${item.path.getString()}"`;
        }
        if (item.path.isFolder()) {
            return `${item.path.getString()}/`;
        }
        return item.path.getString();
    }

    onChooseItem(item: DataOrientedNoteSuggesterItem, evt: MouseEvent | KeyboardEvent) {
        console.log('onChooseItem: item: ', item);
        if (!item.path.exists()) {
            item.path = item.path.join(item.path.name() + '.md');
            console.log('Creating new note: ' + item.path.getString());
            new Notice('Creating new note: ' + item.path.getString());
        }

        this.dataOrientedNote = item;
        this.resolve(item);
    }

    static async openAndGetValue(
        app: App,
        searchDirectory: Path,
        ignoreAttr:string,
        activeFile: Path | null
    ): Promise<DataOrientedNoteSuggesterItem> {
        return new Promise((resolve) => {
            new FindOrCreateModal(
                app,
                resolve,
                searchDirectory,
                ignoreAttr,
                activeFile
            ).open();
        });
    }
}

export { FindOrCreateModal };
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
    public cancelled: boolean;

    constructor(
        app: App,
        resolve: (value: DataOrientedNoteSuggesterItem) => void,
        searchDirectory: Path,
        ignoreAttr:string
    ) {
        super(app);
        this.resolve = resolve;
        this.cancelled = false;
        this.searchDirectory = searchDirectory;
        this.ignoreAttr = ignoreAttr;
        this.dataOrientedNote = undefined;
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

            var relativePath = path.relativeTo(this.searchDirectory);

            items.push({
                path: relativePath,
            });
        });
        return items;
    }

    getSuggestions(query: string): FuzzyMatch<DataOrientedNoteSuggesterItem>[] {
        var suggestions =  super.getSuggestions(query)

        var path = this.searchDirectory.join(query);
        var createSuggestion: FuzzyMatch<DataOrientedNoteSuggesterItem>[] = [{
            item: {path},
            match: {score: 100, matches: []},
        }];
        return createSuggestion.concat(...suggestions);
    }

    getItemText(item: DataOrientedNoteSuggesterItem): string {
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
        ignoreAttr:string
    ): Promise<DataOrientedNoteSuggesterItem> {
        return new Promise((resolve) => {
            new FindOrCreateModal(
                app,
                resolve,
                searchDirectory,
                ignoreAttr
            ).open();
        });
    }
}

export { FindOrCreateModal };
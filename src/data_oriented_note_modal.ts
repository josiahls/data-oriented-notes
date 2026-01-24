import { App, TFolder, FuzzySuggestModal, Vault, FuzzyMatch } from "obsidian";
import { TFile } from "obsidian";

interface RoutineSuggesterItem {
    dataOrientedNotePathPretty: string;
    newDataOrientedNoteName?: string;
    dataOrientedNotePath?: TFile;
}

class FindOrCreateModal extends FuzzySuggestModal<RoutineSuggesterItem> {
    private resolve: (value: RoutineSuggesterItem) => void;
    public dataOrientedNote: RoutineSuggesterItem;
    public searchDirectory: TFolder;
    public ignoreAttr: string;
    public cancelled: boolean;

    constructor(
        app: App,
        resolve: (value: RoutineSuggesterItem) => void,
        searchDirectory: TFolder,
        ignoreAttr:string
    ) {
        super(app);
        this.resolve = resolve;
        this.cancelled = false;
        this.searchDirectory = searchDirectory;
        this.ignoreAttr = ignoreAttr;
        this.dataOrientedNote = {
            dataOrientedNotePathPretty: '',
            newDataOrientedNoteName: undefined,
            dataOrientedNotePath: undefined,
        };
    }

    getItems(): RoutineSuggesterItem[] {
        const items: RoutineSuggesterItem[] = [];
        Vault.recurseChildren(this.searchDirectory, (file) => {
            if (file.path.includes(this.ignoreAttr)) {
                return;
            }
            if (file instanceof TFolder) {
                return;
            }
            if (file instanceof TFile) {
                items.push({
                    dataOrientedNotePathPretty: file.basename,
                    newDataOrientedNoteName: file.basename,
                    dataOrientedNotePath: file
                });
            }
        });
        return items;
    }

    getSuggestions(query: string): FuzzyMatch<RoutineSuggesterItem>[] {
        var suggestions =  super.getSuggestions(query)

        if (suggestions.length == 0) {
            var path = this.searchDirectory.path + '/' + query;
            path += '/' + query + '.md';
            suggestions.push({
                item: {
                    dataOrientedNotePathPretty: `create new: "${query}"`,
                    newDataOrientedNoteName: query,
                    dataOrientedNotePath: undefined,
                },
                match: {
                    score: 100,
                    matches: [],
                },
            });
        }
        return suggestions;
    }

    getItemText(item: RoutineSuggesterItem): string {
        return item.dataOrientedNotePathPretty;
    }

    onChooseItem(item: RoutineSuggesterItem, evt: MouseEvent | KeyboardEvent) {
        console.log('onChooseItem: item: ', item);

        this.dataOrientedNote = item;
        this.resolve(item);
    }

    static async openAndGetValue(
        app: App,
        searchDirectory: TFolder,
        ignoreAttr:string
    ): Promise<RoutineSuggesterItem> {
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
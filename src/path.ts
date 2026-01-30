import { timingSafeEqual } from "crypto";
import { App, TFile, TFolder } from "obsidian";


class Path {
    private path: string;
    private tfile?: TFile;
    private tfolder?: TFolder;
    public app?: App;

    constructor(path: string | TFile | TFolder | Path, app?: App) {
        if (path instanceof TFile) {
            this.tfile = path;
            this.path = path.path;
        } else if (path instanceof TFolder) {
            this.tfolder = path;
            this.path = path.path;
        } else if (path instanceof Path) {
            this.path = path.path;
        } else {
            this.path = path;
        }

        this.app = app;

        if (app === undefined) {
            return;
        }

        // If it ends with a slash, we know this is expected to be a folder
        if (this.path.endsWith('/')) {
            this.path = this.path.substring(0, this.path.length - 1);
            var tfolder = app.vault.getFolderByPath(this.path);
            if (tfolder) {
                this.tfolder = tfolder;
            }
        // If it "equals" a period, then we assume this is vault root.
        } else if (this.path == '.') {
            this.tfolder = app.vault.getRoot();
        // If it includes a period, we know this is expected to be a file
        }else if (this.path.includes('.')) {
            var tfile = app.vault.getFileByPath(this.path);
            if (tfile) {
                this.tfile = tfile;
            }
        } else {
            // If the above fails then we just try to call the respective functions
            // directly to see if either are valid
            var tfile = app.vault.getFileByPath(this.path);
            if (tfile) {
                this.tfile = tfile;
            } else {
                var tfolder = app.vault.getFolderByPath(this.path);
                if (tfolder) {
                    this.tfolder = tfolder;
                }
            }
        }

        if (this.path.startsWith('/')) {
            this.path = this.path.substring(1, this.path.length);
        }
        if (this.path.startsWith('./')) {
            this.path = this.path.substring(2, this.path.length);
        }

        // Both self.tfile and self.tfolder can't be "set" at the same time.
        if (this.tfile && this.tfolder) {
            throw new Error('Path is both a file and a folder: ' + this.path);
        }
    }

    exists(): boolean {
        if (this.tfile) {
            return true;
        } else if (this.tfolder) {
            return true;
        } else {
            return this.app?.vault.getFileByPath(this.path) !== null;
        }
    }

    isSet(): boolean {
        if (this.path === '') {
            return false;
        } else {
            return true;
        }
    }

    async createFolder(): Promise<Path> {
        if (this.tfolder) {
            return this;
        } else if (this.app === undefined) {
            throw new Error('createFolder: App is not set');
        } else {
            try {
                // Recursively create the parent folder if they don't exist
                if (!this.getParent().exists()) {
                    await this.getParent().createFolder();
                }
            } catch (error) {
                if (
                    error instanceof Error 
                    && error.message.includes('Path has no parent')
                ) {
                    console.log('createFolder: Path has no parent: ' + this.path);
                    return this;
                } else {
                    throw error;
                }
            }

            var tfolder = await this.app?.vault.createFolder(this.path);
            if (tfolder) {
                return new Path(tfolder, this.app);
            } else {
                throw new Error('createFolder: Failed to create folder: ' + this.path);
            }
        }
    }

    getString(): string {
        return this.path;
    }

    /**
     * Checks if the path string is a file or a folder.
     * 
     * This is different from isFile() since isFile checks if there is a 
     * real actual file associated with the path.
     * 
     * isFileLike simply checks if the current path is intended to be a file.
     * 
     * @returns True if the path string is intended to be a file.
     */
    isFileLike(): boolean {
        if (this.path.includes('/')) {
            var path = this.path.split('/').pop() ?? '';
            return path.includes('.');
        }
        return this.path.includes('.');
    }

    isFile(): boolean {
        return this.tfile !== undefined;
    }

    isFolder(): boolean {
        return this.tfolder !== undefined;
    }

    getTFile(): TFile {
        if (this.tfile === undefined) {
            throw new Error('Path is not a file: ' + this.path);
        }
        return this.tfile;
    }

    getTFolder(): TFolder {
        if (this.tfolder === undefined) {
            throw new Error('Path is not a folder: ' + this.path);
        }
        return this.tfolder;
    }

    getParent(): Path {
        var parent: string | null = null;
        if (this.tfile) {
            parent = this.tfile.parent?.path ?? null;
        } else if (this.tfolder) {
            parent = this.tfolder.parent?.path ?? null;
        } 
        
        if (parent === null) {
            var index = this.path.lastIndexOf('/');
            if (index > -1) {
                parent = this.path.substring(0, index);
            }
        }

        if (parent === null) {
            throw new Error('Path has no parent: ' + this.path);
        }

        return new Path(parent, this.app);
    }

    join(...paths: (string | TFile | TFolder | Path)[]): Path {
        var newPath = this.path;
        if (!newPath.endsWith('/')) {
            newPath += '/';
        }
        for (const path of paths) {
            if (path instanceof TFile) {
                newPath += path.path;
            } else if (path instanceof TFolder) {
                newPath += path.path;
            } else if (path instanceof Path) {
                newPath += path.path;
            } else {
                newPath += path;
            }
        }
        return new Path(newPath, this.app);
    }

    relativeTo(path: Path): Path {
        if (path.path == '.') {
            return this;
        }
        if (path.path == '/') {
            return this;
        }
        if (!path.path.startsWith(this.path)) {
            throw new Error('Path is not a parent of: ' + path.path);
        }
        return new Path(path.path.substring(this.path.length), this.app);
    }

    name(): string {
        if (this.tfile) {
            return this.tfile.basename;
        } else if (this.tfolder) {
            return this.tfolder.name;
        } else {
            return this.path.split('/').pop() ?? '';
        }
    }
}


export { Path };
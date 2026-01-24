import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, DataOrientedNotesSettings, DataOrientedNotesSettingTab} from "./settings";
import { createDataOrientedNote } from "./data_oriented_note_builder";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings: DataOrientedNotesSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-data-oriented-note',
			name: 'Create data oriented note',
			callback: () => {
				createDataOrientedNote(this.app, '');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DataOrientedNotesSettingTab(this.app, this));

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<DataOrientedNotesSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, DataOrientedNotesSettings, DataOrientedNotesSettingTab} from "./settings";
import { createDataOrientedNote } from "./data_oriented_note_builder";
import { iterateDataOrientedNoteTemplates, iterateTemplates } from 'data_orieinted_note_template_iterator';

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings: DataOrientedNotesSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		var templates = await iterateTemplates(this.app, this.settings.templateSourcePath);
		for (const template of templates) {
			console.log('Template create from : ' + template.templatePath);
			this.addCommand({
				id: 'create-data-oriented-note-' + template.templateName,
				name: 'Create from template: ' + template.templateName,
				callback: () => {
					createDataOrientedNote(this.app, template.templatePath);
				}
			});
		}


		this.addCommand({
			id: 'iterate-data-oriented-note-templates',
			name: 'Iterate data oriented note templates',
			callback: () => {
				iterateDataOrientedNoteTemplates(this.app, this.settings.templateSourcePath);
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


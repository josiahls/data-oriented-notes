import {Plugin, Notice} from 'obsidian';
import {DEFAULT_SETTINGS, DataOrientedNotesSettings, DataOrientedNotesSettingTab} from "./settings";
import { createDataOrientedNote } from "./data_oriented_note_builder";
import { iterateDataOrientedNoteTemplates, iterateTemplates, TemplateIteratorItem } from 'data_orieinted_note_template_iterator';

// Remember to rename these classes and interfaces!

export default class DataOrientedNotesPlugin extends Plugin {
	settings: DataOrientedNotesSettings;

	async onReady() {
		this.addCommand({
			id: 'iterate-data-oriented-note-templates',
			name: 'Iterate data oriented note templates',
			callback: () => {
				iterateDataOrientedNoteTemplates(this.app, this.settings.templateSourcePath);
			}
		});

		// This adds a simple command that can be triggered anywhere
		var templates: TemplateIteratorItem[] = [];
		if (this.settings.templateSourcePath.trim() !== '') {
			templates = await iterateTemplates(this.app, this.settings.templateSourcePath);
		} else if (this.settings.templateSourcePath.trim() === '') {
			new Notice('Template source path is not set!');
		} else {
			new Notice('Template source path is not a valid path: ' + this.settings.templateSourcePath);
		}
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

		for (const template of templates) {
			console.log('Template insert from : ' + template.templatePath);
			this.addCommand({
				id: 'insert-data-oriented-note-' + template.templateName,
				name: 'Insert from template: ' + template.templateName,
				callback: () => {
					createDataOrientedNote(this.app, template.templatePath, true);
				}
			});
		}
	}

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DataOrientedNotesSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(async() => {
			await this.onReady()
	    });
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


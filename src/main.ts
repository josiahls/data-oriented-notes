import {Plugin, Notice} from 'obsidian';
import {DEFAULT_SETTINGS, DataOrientedNotesSettings, DataOrientedNotesSettingTab} from "./settings";
import { createDataOrientedNote } from "./data_oriented_note_builder";
import { iterateDataOrientedNoteTemplates, iterateTemplates, TemplateIteratorItem, TemplateSuggestModal } from 'data_orieinted_note_template_iterator';
import { Path } from "./path";

// Remember to rename these classes and interfaces!

export default class DataOrientedNotesPlugin extends Plugin {
	settings: DataOrientedNotesSettings;

	async onReady() {
		var templateSourcePath = new Path(
			this.settings.templateSourcePath, this.app
		);
		this.addCommand({
			id: 'iterate-data-oriented-note-templates',
			name: 'Iterate data oriented note templates',
			callback: () => {
				iterateDataOrientedNoteTemplates(
					this.app, 
					templateSourcePath
			    );
			}
		});

		// This adds a simple command that can be triggered anywhere
		var templates: TemplateIteratorItem[] = [];
		if (templateSourcePath.isSet()) {
			templates = await iterateTemplates(this.app, templateSourcePath);
		} else if (!templateSourcePath.exists()) {
			new Notice('Template source path does not exist: ' + templateSourcePath.getString());
		} else {
			new Notice('Template source path is not set!');
		}

		this.addCommand({
			id: 'create-data-oriented-note-from-templates',
			name: 'Create data oriented note from templates',
			callback: async () => {
				var template = await TemplateSuggestModal.openAndGetValue(this.app, templates);
				if (template.path.isSet()) {
					createDataOrientedNote(this.app, template.path);
				} else {
					new Notice('No template selected!');
				}
			}
		});

		this.addCommand({
			id: 'insert-data-oriented-note-from-templates',
			name: 'Insert data oriented note from templates',
			callback: async () => {
				var template = await TemplateSuggestModal.openAndGetValue(this.app, templates);
				if (template.path.isSet()) {
					createDataOrientedNote(this.app, template.path, true);
				} else {
					new Notice('No template selected!');
				}
			}
		});

		for (const template of templates) {
			console.log('Template create from : ' + template.path.getString());
			this.addCommand({
				id: 'create-data-oriented-note-' + template.path.name(),
				name: 'Create from template: ' + template.path.name(),
				callback: () => {
					createDataOrientedNote(this.app, template.path);
				}
			});
		}

		for (const template of templates) {
			console.log('Template insert from : ' + template.path.getString());
			this.addCommand({
				id: 'insert-data-oriented-note-' + template.path.name(),
				name: 'Insert from template: ' + template.path.name(),
				callback: () => {
					createDataOrientedNote(this.app, template.path, true);
				}
			});
		}


		for (const template of templates) {
			console.log('Template create from : ' + template.path.getString());
			this.addCommand({
				id: 'create-data-oriented-note-' + template.path.name(),
				name: 'Create from template: ' + template.path.name(),
				callback: () => {
					createDataOrientedNote(this.app, template.path);
				}
			});
		}

		for (const template of templates) {
			console.log('Template insert from : ' + template.path.getString());
			this.addCommand({
				id: 'insert-data-oriented-note-' + template.path.name(),
				name: 'Insert from template: ' + template.path.name(),
				callback: () => {
					createDataOrientedNote(this.app, template.path, true);
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


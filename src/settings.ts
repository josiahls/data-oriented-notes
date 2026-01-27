import {App, PluginSettingTab, SearchComponent, Setting} from "obsidian";
import DataOrientedNotes from "./main";
import { getPath, pathExists } from "./utils";

/**
 * Interface for the plugin settings
 * - templateSourcePath: Where to search and offer templates to the user
 * - useTemplaterCopy: Whether to use the templater copy command to create the note
 */
export interface DataOrientedNotesSettings {
	templateSourcePath: string;
	useTemplaterCopy: boolean;
}

/**
 * Current default settings are:
 * - templateSourcePath: Where to search and offer templates to the user
 * - useTemplaterCopy: Whether to use the templater copy command to create the note
 */
export const DEFAULT_SETTINGS: DataOrientedNotesSettings = {
	templateSourcePath: '',
	useTemplaterCopy: true,
}

function validPath()

/**
 * Setting tab.
 * 
 * Handles setting the `DataOrientedNotesSettings` object.
 */
export class DataOrientedNotesSettingTab extends PluginSettingTab {
	plugin: DataOrientedNotes;

	constructor(app: App, plugin: DataOrientedNotes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		var defaultDescription = 'The path to the template source file';
		var templatePathSetting = new Setting(containerEl)
			.setName('Template Source Path')
			.setDesc(defaultDescription);
		templatePathSetting.addSearch(search => search
			.setPlaceholder('Enter the path to the template source file')
			.setValue(this.plugin.settings.templateSourcePath)
			.onChange(async (value) => {
				console.log('Template Source Path changed to: ' + value);
				if (!pathExists(this.app, value)) {
					templatePathSetting.setDesc('Path does not exist!');
				} else {
					templatePathSetting.setDesc(defaultDescription);
					this.plugin.settings.templateSourcePath = value;
					await this.plugin.saveSettings();
				}
			}));
		new Setting(containerEl)
			.setName('Use Templater Copy')
			.setDesc(
				'Whether to use the templater copy command to create the note.'
				+ ' This requires the Templater plugin to be installed.'
			)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTemplaterCopy)
				.onChange(async (value) => {
					this.plugin.settings.useTemplaterCopy = value;
					await this.plugin.saveSettings();
				}));
	}
}

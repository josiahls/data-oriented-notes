import {App, PluginSettingTab, SearchComponent, Setting} from "obsidian";
import DataOrientedNotes from "./main";
import { getPath, pathExists } from "./utiils";

export interface DataOrientedNotesSettings {
	templateSourcePath: string;
}

export const DEFAULT_SETTINGS: DataOrientedNotesSettings = {
	templateSourcePath: ''
}

export class DataOrientedNotesSettingTab extends PluginSettingTab {
	plugin: DataOrientedNotes;

	constructor(app: App, plugin: DataOrientedNotes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Template Source Path')
			.setDesc('The path to the template source file')
			.addSearch(search => search
				.setPlaceholder('Enter the path to the template source file')
				.setValue(this.plugin.settings.templateSourcePath)
				.onChange(async (value) => {
					this.plugin.settings.templateSourcePath = value;
					await this.plugin.saveSettings();
				}));
	}
}

// ----------------------------------------------------------------------------------------
// File       : main.ts
// Author     : Stefan Wolfrum (@metawops)
// Date       : 2022-05-27
// Last Update: 2022-06-12
// Description: Implementation of my very first Obsidian plugin.
//              It allows to export rendered HTML tables (i.e. from a pane in reading mode)
//              to be exported to a CSV file and optionally to the clipboard, too.
//              Purely based on the Obsidian sample plugin.
// ----------------------------------------------------------------------------------------

import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, Modal } from 'obsidian';

interface Table2CSVSettings {
   exportPath: string;
   baseFilename: string;
   fileNumber: string;
   sepChar: string;
   quoteDataChar: string;
   saveToClipboardToo: boolean;
   removeCRLF: string;
}

class SelectTablesModal extends Modal {
   tables: NodeListOf<HTMLTableElement>;
   plugin: Table2CSVPlugin;
   result: number[];

   constructor(app: App, plugin: Table2CSVPlugin, tables: NodeListOf<HTMLTableElement>) {
      super(app);
      this.plugin = plugin;
      this.tables = tables;
      this.result = [];
   }

   onOpen() {
      const { contentEl } = this;
      contentEl.createEl("h2", { text: "Select tables to export" });

      this.tables.forEach((table, index) => {
         const tableContainer = contentEl.createDiv({ cls: "table-container" });
         tableContainer.style.border = "1px solid var(--background-modifier-border)";
         tableContainer.style.padding = "10px";
         tableContainer.style.margin = "10px 0";
         tableContainer.style.maxHeight = "150px";
         tableContainer.style.overflowY = "auto";

         const checkbox = tableContainer.createEl("input", { type: "checkbox" });
         checkbox.id = `table-checkbox-${index}`;
         checkbox.dataset.tableIndex = index.toString();

         const label = tableContainer.createEl("label", { text: `Table ${index + 1}` });
         label.htmlFor = `table-checkbox-${index}`;

         const preview = tableContainer.createEl("div");
         preview.appendChild(table.cloneNode(true));

         checkbox.addEventListener("change", (e: Event) => {
            const target = e.target as HTMLInputElement;
            const tableIndex = parseInt(target.dataset.tableIndex || "0", 10);
            if (target.checked) {
               if (!this.result.includes(tableIndex)) {
                  this.result.push(tableIndex);
               }
            } else {
               const resultIndex = this.result.indexOf(tableIndex);
               if (resultIndex > -1) {
                  this.result.splice(resultIndex, 1);
               }
            }
         });
      });

      const buttonContainer = contentEl.createDiv();
      const exportButton = buttonContainer.createEl("button", { text: "Export Selected" });
      exportButton.addEventListener("click", () => {
         this.close();
         this.onExport(this.result);
      });
   }

   onExport(selectedIndices: number[]) {
      if (selectedIndices.length === 0) {
         new Notice("No tables selected.");
         return;
      }

      selectedIndices.sort((a, b) => a - b); // sort indices to process in order

      const csvStrings = selectedIndices.map(index => {
         const table = this.tables[index];
         return tableToCSV(table, this.plugin.settings.sepChar, this.plugin.settings.quoteDataChar, this.plugin.settings.removeCRLF);
      });

      const combinedCsv = csvStrings.join("\n\n");

      if (combinedCsv.length > 0) {
         const filename = `${this.plugin.settings.baseFilename}-${this.plugin.settings.fileNumber}.csv`;
         this.plugin.app.vault.create(filename, combinedCsv)
            .then(() => {
               let fn: number = +this.plugin.settings.fileNumber;
               fn++;
               if (fn == 1000) fn = 1;
               let newFileNumberString: string = fn + "";
               while (newFileNumberString.length < 3) newFileNumberString = "0" + newFileNumberString;
               this.plugin.settings.fileNumber = newFileNumberString;
               this.plugin.saveSettings();

               if (this.plugin.settings.saveToClipboardToo) {
                  navigator.clipboard
                     .writeText(combinedCsv)
                     .then(() => {
                        new Notice(`The file ${filename} was successfully created in your vault. The contents was also copied to the clipboard.`);
                     })
                     .catch((err) => {
                        new Notice('There was an error with copying the contents to the clipboard.');
                     });
               } else {
                  new Notice(`The file ${filename} was successfully created in your vault.`);
               }
            })
            .catch((error: any) => {
               const errorMessage = `Error: ${error.message}`;
               new Notice(errorMessage);
            });
      } else {
         new Notice(`No data to export.`);
      }
   }

   onClose() {
      const { contentEl } = this;
      contentEl.empty();
   }
}

const DEFAULT_SETTINGS: Table2CSVSettings = {
   exportPath: './',
   baseFilename: 'table-export',
   fileNumber: '001',
   sepChar: 'sepChar-semicolon',
   quoteDataChar: 'quoteChar-noQuote',
   saveToClipboardToo: false,
   removeCRLF: 'removeCRLF-space'
}

export default class Table2CSVPlugin extends Plugin {
   settings: Table2CSVSettings;

   async onload() {
      
      await this.loadSettings();

      this.addCommand({
         id: 'obsidian-table-to-csv-exporter',
         name: 'Export table to CSV file',
         checkCallback: (checking: boolean) => {

            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            
            if (view) {
               if (!checking) {
                  // Here we can actually start with our work
                  const viewMode = view.getMode();
                  if (viewMode=="preview") {
                     const tables = view.previewMode.containerEl.querySelectorAll("table");

                     if (tables.length === 0) {
                        new Notice(`No table was found. No CSV file was written.`);
                        return;
                     }

                     new SelectTablesModal(this.app, this, tables).open();

                  }
                  else {
                     new Notice('This command only works on panes in reading mode! – No CSV files were written.');
                  }
               }

               return true;
            }

            return false;
         }
      });


      // This adds a settings tab so the user can configure various aspects of the plugin
      this.addSettingTab(new Table2CSVSettingTab(this.app, this));

      console.log(`Table to CSV plugin: Version ${this.manifest.version} loaded.`);
   }

   onunload() {
   }

   async loadSettings() {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
   }

   async saveSettings() {
      await this.saveData(this.settings);
   }
}


function tableToCSV(table: HTMLTableElement, sepMode: string, quoteChar: string, removeCRLF: string) {
	var data = [];
   if (table) {
      var rows = table.rows;
      //console.log(`htmlToCSV::rows: ${rows}`);
      for (var i = 0; i < rows.length; i++) {
         var row = [], cols = rows[i].querySelectorAll("td, th");
               
         for (var j = 0; j < cols.length; j++) {
            var cellContent = (cols[j] as HTMLElement).innerText;
            
            // handle the optional replacement of CR/LF characters:
            if (removeCRLF=='removeCRLF-clear') {
               cellContent = cellContent.replace(/(\r\n|\n|\r)/gm, "");
            } else if (removeCRLF=='removeCRLF-space') {
               cellContent = cellContent.replace(/(\r\n|\n|\r)/gm, " ");
            } else if (removeCRLF=='removeCRLF-string1') {
               cellContent = cellContent.replace(/(\r\n|\n|\r)/gm, "[CR]");
            }

            // handle the quoting of data cells:
            // for now it's just the hard-coded character "
            if (quoteChar=='quoteChar-doubleQuotes') {
               cellContent = '"' + cellContent + '"';
            } else if (quoteChar=='quoteChar-singleQuotes') {
               cellContent = "'" + cellContent + "'";
            }
            row.push(cellContent);
         }
         
         var sepChar = ';';
         switch(sepMode) {
            case 'sepChar-semicolon': 
               sepChar = ';';
               break;
            case 'sepChar-comma': 
               sepChar = ',';
               break;
            case 'sepChar-tab': 
               sepChar = '\t';
               break;
            case 'sepChar-pipe': 
               sepChar = '|';
               break;
            case 'sepChar-tilde': 
               sepChar = '~';
               break;
            case 'sepChar-caret': 
               sepChar = '^';
               break;
            case 'sepChar-colon': 
               sepChar = ':';
               break;
         }
         data.push(row.join(sepChar));
      }
   }
   //console.log(`htmlToCSV::data.length: ${data.length}`);
   if (data.length > 0)
      return data.join("\n");
   else
      return "";
}

class Table2CSVSettingTab extends PluginSettingTab {
   plugin: Table2CSVPlugin;

   constructor(app: App, plugin: Table2CSVPlugin) {
      super(app, plugin);
      this.plugin = plugin;
   }

   display(): void {
      const {containerEl} = this;

      containerEl.empty();

      containerEl.createEl('h2', {text: 'Settings for the Table to CSV Plugin.'});
      containerEl.createEl('p', {text: 'NOTE: Currently, the exported CSV files are saved inside your vault main folder.'});

      // Being able to set a path for the exports will be a future addition
      // ------------------------------------------------------------------
      // new Setting(containerEl)
      //    .setName('CSV file export path')
      //    .setDesc('Enter the path where the exported CSV file should be saved. If no path is set the CSV file will be saved into your vault folder.')
      //    .addText(text => text
      //       .setPlaceholder('<enter a path>')
      //       .setValue(this.plugin.settings.exportPath)
      //       .onChange(async (value) => {
      //          console.log('path: ' + value);
      //          this.plugin.settings.exportPath = value;
      //          await this.plugin.saveSettings();
      //       }));

      new Setting(containerEl)
         .setName('CSV file base filename')
         .setDesc('Enter the base filename. The "File Number addendum" gets added after that and finally .csv')
         .addText(text => text
            .setPlaceholder('<enter a base filename')
            .setValue(this.plugin.settings.baseFilename)
            .onChange(async (value) => {
               //console.log('base filename: ' + value);
               this.plugin.settings.baseFilename = value;
               await this.plugin.saveSettings();
            }));
            
      new Setting(containerEl)
         .setName('File Number addendum')
         .setDesc('This number gets added to the base filename and incremented after each export. Normally, you shouldn\'t need to edit this.')
         .addText(text => text
            .setPlaceholder('')
            .setValue(this.plugin.settings.fileNumber)
            .onChange(async (value) => {
               //console.log('fileNumber: ' + value);
               this.plugin.settings.fileNumber = value;
               await this.plugin.saveSettings();
            }));
      
      new Setting(containerEl)
         .setName('Data fields separation character/string')
         .setDesc('This character will be put between each cell\'s data. Defaults to a semicolon.')
         .addDropdown(dropdown => dropdown
            .addOption('sepChar-semicolon', '; (semicolon)')
            .addOption('sepChar-comma', ', (comma)')
            .addOption('sepChar-tab', '\\t (tab)')
            .addOption('sepChar-pipe', '| (pipe)')
            .addOption('sepChar-tilde', '~ (tilde)')
            .addOption('sepChar-caret', '^ (caret)')
            .addOption('sepChar-colon', ': (colon)')
            .setValue(this.plugin.settings.sepChar)
            .onChange(async (value) => {
               //console.log('sepChar: ' + value);
               this.plugin.settings.sepChar = value;
               await this.plugin.saveSettings();
            }));
   
      new Setting(containerEl)
         .setName('Quote data')
         .setDesc('Do you want quotation marks around each cell\'s data?')
         .addDropdown( dropdown => dropdown
            .addOption('quoteChar-noQuote', 'Don\'t quote data')
            .addOption('quoteChar-doubleQuotes', 'Quote data with double quote character (")')
            .addOption('quoteChar-singleQuotes', 'Quote data with single quote character (\')')
            .setValue(this.plugin.settings.quoteDataChar)
            .onChange(async (value) => {
               //console.log('quote data toggle: ' + value);
               this.plugin.settings.quoteDataChar = value;
               await this.plugin.saveSettings();
            }));
   
      new Setting(containerEl)
         .setName('Handling of CR/LF in data')
         .setDesc('Choose how to handle the occurance of return and linefeed characters in data cells.')
         .addDropdown( dropdown => dropdown
            .addOption('removeCRLF-clear', 'Remove all CR & LF characters')
            .addOption('removeCRLF-space', 'Replace all CR & LF characters with one space')
            .addOption('removeCRLF-string1', 'Replace all CR & LF characters with string [CR]')
            .setValue(this.plugin.settings.removeCRLF)
            .onChange(async (value) => {
               this.plugin.settings.removeCRLF = value;
               await this.plugin.saveSettings();
            }))

      new Setting(containerEl)
         .setName('Copy to clipboard, too')
         .setDesc('Do you want to copy the contents of the CSV file to the system clipboard, too?')
         .addToggle( toggle => toggle
            .setValue(this.plugin.settings.saveToClipboardToo)
            .onChange(async (value) => {
               //console.log('save to clipboard, too: ' + value);
               this.plugin.settings.saveToClipboardToo = value;
               await this.plugin.saveSettings();
            }));
   
   }
}

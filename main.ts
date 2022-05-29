import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface Table2CSVSettings {
   exportPath: string;
   fileNumber: string;
}

const DEFAULT_SETTINGS: Table2CSVSettings = {
   exportPath: '',
   fileNumber: '001'
}

export default class Table2CSVPlugin extends Plugin {
   settings: Table2CSVSettings;

   async onload() {
      console.log("In onload().");
      await this.loadSettings();

      this.addCommand({
         id: 'table-to-csv-export',
         name: 'Export all tables to CSV files',
         checkCallback: (checking: boolean) => {

            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            
            // const markdownView = this.app.workspace.activeLeaf.view as MarkdownView;
            // const livePreviewActive: boolean = markdownView.getState().field(editorLivePreviewField);

            if (view) {
               if (!checking) {
                  // Here we can actually start with our work
                  console.log("table-to-csv-export command triggered.")
                  const viewMode = view.getMode();
                  console.log("viewMode =", viewMode);
                  if (viewMode=="preview") {
                     console.log("We're in reading mode and can now work on the HTML tables! :-)");
                     console.log("Here's the HTML of the active pane in reading mode:");
                     console.log(view.previewMode.containerEl);
                     
                     // Now convert the tables
                     const csvString = htmlToCSV(view.previewMode.containerEl);
                     console.log("And here's the HTML tables converted to CSV:");
                     console.log(csvString);
                     
                     this.app.vault.create(`./csv-file-${this.settings.fileNumber}.csv`, csvString)
   
                        .catch( (error) => {
                           console.log(error.message);
                           const errorMessage = `Error: ${error.message}`;
                           new Notice(errorMessage);
                        })

                        .finally( () => {
                           let fn: number = +this.settings.fileNumber;
                           fn++;
                           let newFileNumberString: string = fn + "";
                           while (newFileNumberString.length < 3) newFileNumberString = "0" + newFileNumberString;
                           this.settings.fileNumber = newFileNumberString;
                        })
                        
                     
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


      // This creates an icon in the left ribbon.
      const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
         // Called when the user clicks the icon.
         new Notice('This is a notice!');
      });
      // Perform additional things with the ribbon
      ribbonIconEl.addClass('my-plugin-ribbon-class');

      // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
      // const statusBarItemEl = this.addStatusBarItem();
      // statusBarItemEl.setText('Status Bar Text');

      // This adds a simple command that can be triggered anywhere
      // this.addCommand({
      //    id: 'open-sample-modal-simple',
      //    name: 'Open sample modal (simple)',
      //    callback: () => {
      //       new SampleModal(this.app).open();
      //    }
      // });
      // This adds an editor command that can perform some operation on the current editor instance
      // this.addCommand({
      //    id: 'sample-editor-command',
      //    name: 'Sample editor command',
      //    editorCallback: (editor: Editor, view: MarkdownView) => {
      //       console.log(editor.getSelection());
      //       editor.replaceSelection('Sample Editor Command');
      //    }
      // });
      // This adds a complex command that can check whether the current state of the app allows execution of the command
      // this.addCommand({
      //    id: 'open-sample-modal-complex',
      //    name: 'Open sample modal (complex)',
      //    checkCallback: (checking: boolean) => {
      //       // Conditions to check
      //       const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
      //       if (markdownView) {
      //          // If checking is true, we're simply "checking" if the command can be run.
      //          // If checking is false, then we want to actually perform the operation.
      //          if (!checking) {
      //             new SampleModal(this.app).open();
      //          }

      //          // This command will only show up in Command Palette when the check function returns true
      //          return true;
      //       }
      //    }
      // });

      // This adds a settings tab so the user can configure various aspects of the plugin
      this.addSettingTab(new Table2CSVSettingTab(this.app, this));

      // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
      // Using this function will automatically remove the event listener when this plugin is disabled.
      // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      //    console.log('click', evt);
      // });

      // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
      //this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
   }

    onunload() {
       console.log("In onunload().");
    }

    async loadSettings() {
       this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
       await this.saveData(this.settings);
    }
}


function htmlToCSV(html: HTMLElement) {
	var data = [];
	var rows = html.querySelectorAll("table tr");
			
	for (var i = 0; i < rows.length; i++) {
		var row = [], cols = rows[i].querySelectorAll("td, th");
				
		for (var j = 0; j < cols.length; j++) {
		        row.push(cols[j].innerText);
        }
		        
		data.push(row.join(",")); 		
	}

   return data.join("\n");
}

// class SampleModal extends Modal {
//     constructor(app: App) {
//        super(app);
//     }

//    onOpen() {
//       const {contentEl} = this;
//       contentEl.setText('Woah!');
//    }

//    onClose() {
//       const {contentEl} = this;
//       contentEl.empty();
//    }
// }

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

      new Setting(containerEl)
         .setName('CSV file export path')
         .setDesc('Enter the path where the exported CSV file should be saved. If no path is set the CSV file will be saved into your vault folder.')
         .addText(text => text
            .setPlaceholder('<enter a path>')
            .setValue(this.plugin.settings.exportPath)
            .onChange(async (value) => {
               console.log('path: ' + value);
               this.plugin.settings.exportPath = value;
               await this.plugin.saveSettings();
            }));

      new Setting(containerEl)
         .setName('File Number addendum')
         .setDesc('This number gets added to the base filename and incremented after each export.')
         .addText(text => text
            .setPlaceholder('')
            .setValue(this.plugin.settings.fileNumber)
            .onChange(async (value) => {
               console.log('fileNumber: ' + value);
               this.plugin.settings.fileNumber = value;
               await this.plugin.saveSettings();
            }));
      


   }
}

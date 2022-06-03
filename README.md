# Obsidian Plugin "Table to CSV Exporter"

This is my very first attempt in writing a plugin for [Obsidian](https://obsidian.md).

## What does it do?

The purpose of this plugin is to be able to export table data from a pane in reading mode into a CSV file.

Background: The fabulous Dataview plugin for Obsidian allows to dynamically create tables from an SQL-like query over your notes' metadata.
I wanted to be able to further use this created data in external applications, like MS Power BI, to create visualizations of that data.
But the plugin can export any table into a CSV file, even those you "hard-coded" in Markdown (if that makes sense for you) or those that were created by some other plugin.

## Settings

My plugin allows you to configure a few things in its settings:

* The base filename of the CSV file.

   This is the first part of the filename of the CSV file you're about to save.

   Default: `table-export`

* A file number addition

   This gets added to the base filename (after a hyphen). After this, the extension `.csv` is added.  
   This number gets incremented by one after each succesful export and resetted to 001 after reaching 999.  
   Normally you won't need to interfere with this in the settings but you can change it if you want.  
   **But be careful!** Don't mess with this. Don't change this to text or something different than numbers. And stay in the ### scheme (three ciphers max., leading zeroes).  
   It may become neccessary to either change this number manually or to delete/rename/move files out of your vault folder.  
   No worries, though: the plugin never overwrites any files and warns you if a file already exists.

   Default: `001`

* The separation character

   Here you can change the character that separates the data fields in the CSV file. You can enter more than one character here, too, if you like. Entering a TAB character (as `\t` or otherwise) is currently not possible. But you might have the need to change the default comma to a semicolon if your data contains commas.

   Default: `,`

* Quote data

   Switch this on if you want the data cells in the CSV file to be enclosed in double quote marks. Currently, you can't change that quote character. It's `"` for now.

   Default: `off`

* Copy to clipboard, too

   Optionally you can copy the CSV string to the clipboard, too.
   
   Default: `off`

## Usage

The plugin adds a new command: "Export table to CSV file". This will only work when your currently active pane is in reading mode. When the command is executed a `.csv` file is written according to the settings in your vault's main folder. This CSV file contains the data of the *first* table in the reading mode of the note.

The plugin works on mobile, too. (Tested on iPadOS only, though.)

## Current limitations

Of course, there's always room for improvement. **Currently, there are the following limitations/restrictions**:

* The plugin currently exports only the first table that it finds in the reading mode of a note.
* The plugin saves the CSV file directly into you vault's main folder. A feature to select another folder inside your vault will be added later.
* It's currently not possible to use a TAB character as a separation character.
* The quotation character is currently the double quote character `"` and cannot be changed.

## Thanks

I'd like to thank several people here. Without them this plugin wouldn't have come to live.

* [Edmund Gröpl](https://twitter.com/groepl) – for bringing up the problem at all and his encouragement over all the years.
* [Marcus Olsson](https://github.com/marcusolsson) – for starting the [Obsidian Plugin Developer Docs](https://marcus.se.net/obsidian-plugin-docs/) project which I highly recommended, especially for beginners. He's on Twitter, too: [@marcusolsson](https://twitter.com/marcusolsson)
* [Johannes Theiner](https://github.com/joethei) – a very kind and helpful user over at the official Obsidian Discord server. I met him in the `#plugin-dev` channel and his answers to my questions were very helpful. He's also on Twitter: [@joethei](https://twitter.com/joethei)

## Contact

Please leave feedback here in the GitHub discussions or file a new issue if you found a bug or have a feature request.
You can reach me via Twitter, too: [@metawops](https://twitter.com/metawops)

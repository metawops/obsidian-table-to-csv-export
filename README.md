# Obsidian Plugin "Table to CSV Exporter"

This is my very first attempt in writing a plugin for [Obsidian](https://obsidian.md).

## What does it do?

The purpose of this plugin is to be able to export table data from a pane in reading mode into a CSV file.

Background: The fabulous Dataview plugin for Obsidian allows to dynamicall create tables from an SQL-like query over your notes' metadata.
I wanted to be able to further use this created data in external applications, like MS Power BI, to create visualizations of that data.
But the plugin can export any table into a CSV file, even those you "hard-coded" in Markdown (if that makes sense for you).

## Settings

My plugin allows you to configure a few things in its settings:

* The base filename of the CSV file.
*  

## Usage

The plugin adds a new command: "Export table to CSV file". This will only work when your currently active pane is in reading mode. When the command is executed a `.csv` file is written according to the settings in your vault's main folder.

The plugin works on mobile, too. (Tested on iPadOS only, though.)

## Current limitations

Of course, there's always room for improvement. **Currently, there are the following limitations/restrictions**:

* The plugin will produce unpredictable results if your note contains more than one table. Please just make one table per note if you want to make use of this plugin in its current version.
* The plugin saves the CSV file directly into you vault's main folder. A feature to select another folder inside your vault will be added later.


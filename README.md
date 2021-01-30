# Sync Folder CLI

It is a command line tool for real time synchronization between different folders.

## Install

```shell
npm install sync-folder -g
```

Or if you want to use Yarn:

```shell
yarn global install sync-folder
```

## Usage

- Basic usage of synchronizing one folder to another:

```shell
sf -from ./source -to ../storage/target
sf -f ./source -t ../storage/target
```

> For relative paths, your starting directory is the working directory where you run the tool.

- Real time synchronization mode:

```shell
sf -from ./source -to ./target -watch
sf -f ./source -t ./target -w
```

- Multiple sources or multiple targets:

```shell
sf -from ./source1 ./source2 -to ./target1 ./target2
```

> Priority is starting from the beginning and decreasing in turn.

- Download files from the network for synchronization.

```shell
sf -f ftp://example.net/temp -t ./
sf -f https://github.com/linus/linux.git -t ./
```

> Only support to synchronize Git warehouse with HTTPS.

> When the Git repository is synchronized, the submission history will not be downloaded, only the latest submitted file will be pulled.

- Change how files are written to the destination folder:

```shell
# Just write the content from the source folder to the destination folder.
# It is the default option.
sf -soft-merge ...
# The contents of the destination folder must be exactly the same as those of the source folder, and the extra files will be removed.
sf -full-merge
```

- Ignore synchronization of some special folders:

```shell
# Treat the folder as a git repository, and automatically ignore '.git' folder and the ignore file defined in '.gitignore' file.
# It is the default option.
sf -ignore-git ...
# Ignore accurately based on folder or file name
sf -ignore file1.mp4 folder2 ...
sf -i file3.mp4 folder4 ...
# Ignore the specified folder and file with a regular expression.
sf -ignore-reg ".+\.swf$" "\.tsx?$" ...
# According to a text file to ignore the folder and file, its format requirements and '.gitignore' consistent.
sf -ignore-list ./ignore.txt ...
# No files are ignored.
sf -ignore-none
```

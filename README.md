# Sync Folder CLI

It is a command line tool for real time synchronization between different folders.

## Install

```shell
npm install sync-folder-cli -g
```

Or if you want to use Yarn:

```shell
yarn global install sync-folder-cli
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

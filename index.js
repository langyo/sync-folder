const { program } = require('commander');
program.version('0.1.0', '-v, -version');

program
	.requireOption('-f, -from <paths...>', 'Source paths')
	.requireOption('-t, -to <paths...>', 'Target paths')
	.option('-w, -watch', 'Real time monitoring of folder changes')
	.option('-soft-merge', 'In this mode, redundant files in the destination folder will not be deleted')
	.option('-full-merge', 'In this mode, the contents in the destination folder must be exactly the same as those in the source folder')
	.option('-ignore-git', 'Treat the folder as a git repository and ignore files')
	.option('-i, -ignore <names...>', 'Ignore folders or files by name')
	.option('-ignore-reg <reg...>', 'Ignore files or folders based on regular expressions')
	.option('-ignore-list <files...>', 'Ignore files or folders according to the list given in the configuration file')
	.option('ingore-none', 'Do not ignore any files and folders')
	.parse();

const opts = program.opts();

const {
	resolve,
	basename
} = require('path');
const {
	readFileSync,
	readdirSync,
	statSync
} = require('fs');

const { from, to } = opts;

function getIgnoreDeclFile(path) {
	if (path.test(/^(ftp)|(https?)/)) {
		throw new Error('Network synchronization is not supported at the moment');
	}
	if (statSync(path).isDirectory()) {
		return readdirSync(path).reduce(
			(arr, name) => [
				...arr,
				...getIgnoreDeclFile(resolve(path, name))
			], []);
	}
	else if (basename(path) === '.gitignore') {
		return [path]
	}
}

const ignoreMode =
	opts.ignoreReg && 'regExp' ||
	opts.ignoreNone && 'none' ||
	'default';
const ignoreList =
	opts.ignore ||
	opts.ignoreList && opts.ignoreList.reduce(
		(arr, path) => [
			...arr,
			readFileSync(resolve(path, 'utf-8'))
				.split('\n').map(n => n.trim())
		], []) ||
	opts.ignoreReg && opts.ignoreReg.map(
		n => new RegExp(n)
	) ||
	opts.ignoreNone && [] ||
	from.reduce((arr, path) => [
		...arr,
		...getIgnoreDeclFile(resolve(path))
	], []);

const chalk = require('chalk');

function log(type, info) {
  const timeStr = (new Date()).toLocaleTimeString();
  switch(type) {
    case 'warn':
      console.error(timeStr, chalk.yellow('WARN'), info);
      break;
    case 'error':
      console.error(timeStr, chalk.red('ERROR'), info);
      break;
    default:
      console.log(timeStr, type.toUpperCase(), info);
      break;
  }
}

const { program } = require('commander');
program.version('0.1.0', '-v, -version');

program
  .requireOption('-f, -from <paths...>', 'Source paths')
  .requireOption('-t, -to <paths...>', 'Target paths')
  .option('-w, -watch', 'Real time monitoring of folder changes')
  .option(
    '-soft-merge',
    'Redundant files in the destination folder will not be deleted'
  )
  .option(
    '-full-merge',
    'The contents  must be exactly the same as those in the source folder'
  )
  .option('-ignore-git', 'Treat the folder as a git repository and ignore files')
  .option('-i, -ignore <names...>', 'Ignore folders or files by name')
  .option('-ignore-reg <reg...>', 'Ignore files or folders based on regular expressions')
  .option(
    '-ignore-list <files...>',
    'Ignore files or folders according to the list given in the configuration file'
  )
  .option('ingore-none', 'Do not ignore any files and folders')
  .parse();

const opts = program.opts();

const { resolve, basename } = require('path');
const {
  readFileSync, readdirSync, statSync,
  unlinkSync, rmdirSync, copyFileSync
} = require('fs');

const { from, to, watch, softMerge, fullMerge } = opts;

function getIgnoreDeclFile(path) {
	if (statSync(path).isDirectory()) {
		return readdirSync(path).reduce(
			(arr, name) => [
				...arr,
				...getIgnoreDeclFile(resolve(path, name))
			], []);
	} else if (basename(path) === '.gitignore') {
		return readFileSync(path).split('\n').filter(
      n => n[0] !== '#' && n.trim() !== ''
    ).map(
      n => `^${n.trim().split('*').join('.+').split('?').join('.?')}$`
    )
	}
}

const ignoreList = (
	opts.ignore && opt.ignore.map(
    n => `^${n.split('*').join('.+').split('?').join('.?')}$`
  ) ||
	opts.ignoreList && opts.ignoreList.reduce(
	(arr, path) => [
		...arr,
		readFileSync(resolve(path, 'utf-8')).split('\n').filter(
      n => n[0] !== '#' && n.trim() !== ''
    ).map(
      n => `^${n.trim().split('*').join('.+').split('?').join('.?')}$`
    )
	], []) ||
	opts.ignoreReg ||
	opts.ignoreNone && [] ||
	from.reduce((arr, path) => {
		if (path.test(/^(ftp)|(https?)/)) {
			throw new Error('Network synchronization is not supported at the moment');
		}
		return [
			...arr,
			...getIgnoreDeclFile(resolve(path))
		];
	}, [])
).map(n => new RegExp(n));

function isIgnored(name) {
	for (const expr of ignoreList) {
    if (expr.test(n)) {
      return true;
    }
  }
  return false;
}

const isFullMerge = !!fullMerge;

function copy(source, target) {
  if (isIgnored(basename(source)) || isIgnored(basename(target))) {
    return;
  }
  if (statSync(source).isDirectory()) {
    if (!statSync(target).isDirectory()) {
      if (isFullMerge) {
        log('warn', `'This location '${target}' will be replaced to a folder.`);
        unlinkSync(target);        
      } else {
        log('warn', `This location '${target}' is not a folder.`);
        return;
      }
    }
    for (const name of readdirSync(source)) {
      copy(resolve(source, name), resolve(target, name));
    }
  } else {
    if (statSync(target).isDirectory()) {
      if (isFullMerge) {
        log('warn', `'This location '${target}' will be replaced to a file.`);
        rmdirSync(target, { recursive: true });
      } else {
        log('warn', `This location '${target}' is not a folder.`);
        return;
      }
    }
    try {
      copyFileSync(resolve(source, name), resolve(target, name));
    } catch(e) {
      log('error', e);
    }
  }
}

function removeIllegalFileOnFullMerge(sources, target) {
  // TODO - On the full merge mode, the extra files are also be removed.
}

for (const source of from) {
  for (const target of to) {
    copy(resolve(source), resolve(target));
  }
}
// for (const target of to) {
//   removeIllegalFileOnFullMerge(from.map(n => resolve(n)), target);
// }

if (watch) {
  // TODO - Watch every source folders.
}

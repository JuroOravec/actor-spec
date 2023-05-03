import fs from 'fs';
import path from 'path';
import fsp from 'fs/promises';

import type { ActorSpec } from '../types/actorSpec';

type MaybePromise<T> = T | Promise<T>;
type MaybeAsyncFn<R, Args extends any[]> = R | ((...args: Args) => MaybePromise<R>);

const absPath = (filepath: string) => {
  const cwd = process.cwd();
  return path.resolve(cwd, filepath);
};

/**
 * Given a filepath which we assume is relative to CWD,
 * resolve it relative to this file (module), so it can be
 * passed to require().
 */
const resolvePath = (filepath: string) => {
  return path.relative(module.path, absPath(filepath));
};

/** Given a path to an actorspec.js file, resolve the config and export it as JSON to out path */
export const generate = async ({
  config: unresolvedConfigPath,
  outDir,
  silent,
}: {
  /** Path to config file, relative to CWD */
  config: string;
  /** Dir path where the actorspec.json will be generated, relative to CWD */
  outDir?: string;
  silent?: boolean;
}) => {
  const log = silent ? () => {} : console.log;

  const absConfigPath = absPath(unresolvedConfigPath); // Used for logging
  // Since we use require(), we need path that's relative to this file
  const configPath = resolvePath(unresolvedConfigPath);
  log(`Importing file from ${absConfigPath}`);

  const configOrInit = require(configPath).default as MaybeAsyncFn<ActorSpec, []>;
  if (!configOrInit || !['function', 'object'].includes(typeof configOrInit)) {
    throw Error(`Failed to import actorspec from path ${absConfigPath}, got ${configOrInit} instead`); // prettier-ignore
  }

  log(`Actorspec found! Resolving...`);
  const resolvedConfig = typeof configOrInit === 'function' ? await configOrInit() : configOrInit;
  if (!resolvedConfig || typeof configOrInit !== 'object') {
    throw Error(`Failed to import actorspec from path ${absConfigPath}, the import did not resolve to object, got ${configOrInit} instead`); // prettier-ignore
  }

  if (!resolvedConfig.actorspecVersion) {
    throw Error(`Invalid actorspec object imported from path ${absConfigPath}, config.actorspecVersion is missing`); // prettier-ignore
  }

  const jsonConfig = JSON.stringify(resolvedConfig, null, 2);

  const outDirUsed = outDir ? outDir : fs.existsSync(absPath('./.actor')) ? './.actor' : '.';
  const absOutDirPath = absPath(outDirUsed);
  const absOutFilePath = path.resolve(absOutDirPath, 'actorspec.json');
  log(`Writing resolved config to file ${absOutFilePath}`);

  await fsp.mkdir(absOutDirPath, { recursive: true });
  await fsp.writeFile(absOutFilePath, jsonConfig, 'utf-8');

  log(`Done!`);
};

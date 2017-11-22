import { sep } from 'path';
import { Application, OutputArtifact } from './types';

export function addOutputArtifact(application: Application, artifact: OutputArtifact): void {
  if (application.resources) {
    application.resources = [
      ...application.resources.filter(r => r.id !== artifact.id),
      artifact
    ];
  } else {
    console.warn(`Tried to write additional artifacts but your patternplate version is outdated. Try to update`);
  }
}

export function normalizePath(input: string): string {
  return input.split(sep).join('/');
}
